import type Stripe from "stripe";
import { canonicalSelection } from "./selection";
import { stripe } from "./stripe-client";
import type { ProductVariationDefinition } from "../types/product";
import { listSellableCombinations } from "./variationEngine";

const OPTIONS_KEY = "bodegacat_options";
const UNSELLABLE_KEY = "bodegacat_unsellable";

interface DesiredPrice {
  selection: Record<string, string>;
  canonical: string;
  unitAmount: number;
  unsellable: boolean;
  lookupKey: string;
}

async function lookupKey(
  productId: string,
  canonical: string,
): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${productId}:${canonical}`),
  );
  const hex = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
  return `bc_${hex}`;
}

export async function listActivePrices(
  productId: string,
): Promise<Stripe.Price[]> {
  const prices: Stripe.Price[] = [];
  let startingAfter: string | undefined;
  for (;;) {
    const page = await stripe.prices.list({
      product: productId,
      active: true,
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    prices.push(...page.data);
    if (!page.has_more || page.data.length === 0) break;
    const last = page.data.at(-1);
    if (!last) break;
    startingAfter = last.id;
  }
  return prices;
}

function priceMatches(
  price: Stripe.Price,
  desired: DesiredPrice,
  currency: string,
): boolean {
  return (
    price.metadata[OPTIONS_KEY] === desired.canonical &&
    price.unit_amount === desired.unitAmount &&
    price.currency === currency &&
    (desired.unsellable
      ? price.metadata[UNSELLABLE_KEY] === "true"
      : price.metadata[UNSELLABLE_KEY] !== "true")
  );
}

async function desiredPrices(input: {
  productId: string;
  basePrice: number;
  definitions: ProductVariationDefinition[];
}): Promise<DesiredPrice[]> {
  const combinations = listSellableCombinations(input.definitions);
  if (combinations.length === 0) {
    const canonical = canonicalSelection({});
    return [
      {
        selection: {},
        canonical,
        unitAmount: input.basePrice,
        unsellable: true,
        lookupKey: await lookupKey(input.productId, `unsellable:${canonical}`),
      },
    ];
  }

  const desired: DesiredPrice[] = [];
  for (const combination of combinations) {
    const canonical = canonicalSelection(combination.selection);
    if (canonical.length > 500) {
      throw new Error(
        "A variation combination is too large to store on its Stripe Price",
      );
    }
    desired.push({
      selection: combination.selection,
      canonical,
      unitAmount: input.basePrice + combination.priceModifier,
      unsellable: false,
      lookupKey: await lookupKey(input.productId, canonical),
    });
  }
  return desired;
}

/**
 * Writes one active Stripe Price per sellable combination.
 * Amounts are fixed here. Checkout later charges these Price ids and does not add modifiers.
 */
export async function syncCatalogPrices(input: {
  productId: string;
  basePrice: number;
  currency: string;
  definitions: ProductVariationDefinition[];
}): Promise<void> {
  const currency = input.currency.toLowerCase();
  const desired = await desiredPrices(input);

  const existing = await listActivePrices(input.productId);
  const keepIds: string[] = [];

  for (const item of desired) {
    const match = existing.find((price) => priceMatches(price, item, currency));

    if (match) {
      keepIds.push(match.id);
      continue;
    }

    const created = await stripe.prices.create({
      product: input.productId,
      unit_amount: item.unitAmount,
      currency,
      lookup_key: item.lookupKey,
      transfer_lookup_key: true,
      metadata: {
        [OPTIONS_KEY]: item.canonical,
        ...(item.unsellable ? { [UNSELLABLE_KEY]: "true" } : {}),
      },
    });
    keepIds.push(created.id);
  }

  for (const price of existing) {
    if (keepIds.includes(price.id)) continue;
    await stripe.prices.update(price.id, { active: false });
  }

  const kept = await listActivePrices(input.productId);
  const defaultPrice = kept.reduce<Stripe.Price | undefined>(
    (lowest, price) => {
      if (price.unit_amount == null) return lowest;
      if (!lowest || (lowest.unit_amount ?? 0) > price.unit_amount)
        return price;
      return lowest;
    },
    undefined,
  );

  if (defaultPrice) {
    await stripe.products.update(input.productId, {
      default_price: defaultPrice.id,
    });
  }
}

export function isUnsellablePrice(price: Stripe.Price): boolean {
  return price.metadata[UNSELLABLE_KEY] === "true";
}

export function selectionFromPrice(
  price: Stripe.Price,
): Record<string, string> {
  const raw = price.metadata[OPTIONS_KEY];
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed === null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return {};
    }
    const selection: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string") selection[key] = value;
    }
    return selection;
  } catch {
    return {};
  }
}
