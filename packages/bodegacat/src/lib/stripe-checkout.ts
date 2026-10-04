import type Stripe from "stripe";
import { stripe } from "./stripe-client";

function checkoutUrl(path: string, requestUrl?: string): string {
  if (requestUrl) {
    const url = new URL(requestUrl);
    return `${url.protocol}//${url.host}${path}`;
  }
  return `http://localhost:4321${path}`;
}

export interface CheckoutLine {
  priceId: string;
  quantity: number;
}

interface VerifiedLine {
  priceId: string;
  quantity: number;
  productId: string;
  selection: string;
  physical: boolean;
}

function isPhysical(deliveryType: string | undefined): boolean {
  return deliveryType === undefined || ["", "physical"].includes(deliveryType);
}

async function verifyLine(line: CheckoutLine): Promise<VerifiedLine> {
  if (
    !Number.isSafeInteger(line.quantity) ||
    line.quantity < 1 ||
    line.quantity > 99
  ) {
    throw new Error("Quantity must be a whole number from 1 to 99");
  }

  const price = await stripe.prices.retrieve(line.priceId, {
    expand: ["product"],
  });

  if (!price.active || price.metadata.bodegacat_unsellable === "true") {
    throw new Error("That option is not for sale");
  }

  const product = price.product;
  if (typeof product === "string" || product.deleted) {
    throw new Error("That option is not for sale");
  }
  if (product.metadata.bodegacat_active !== "true") {
    throw new Error("That option is not for sale");
  }
  if (product.metadata.bodegacat_published === "false") {
    throw new Error("That option is not for sale");
  }

  return {
    priceId: price.id,
    quantity: line.quantity,
    productId: product.id,
    selection: price.metadata.bodegacat_options || "{}",
    physical: isPhysical(product.metadata.deliveryType),
  };
}

/**
One Checkout Session for one line or many. Amounts come from Stripe Prices
created when the product was published. The browser cannot set the charge.
*/
export async function createCheckoutSession(
  lines: CheckoutLine[],
  requestUrl?: string,
): Promise<Stripe.Checkout.Session> {
  if (lines.length === 0) {
    throw new Error("Cart is empty");
  }

  const merged = new Map<string, CheckoutLine>();
  for (const line of lines) {
    const current = merged.get(line.priceId);
    merged.set(line.priceId, {
      priceId: line.priceId,
      quantity: (current?.quantity ?? 0) + line.quantity,
    });
  }

  const verified = await Promise.all(
    merged.values().map((line) => verifyLine(line)),
  );

  const summary = JSON.stringify(
    verified.map((line) => ({
      productId: line.productId,
      priceId: line.priceId,
      options: line.selection,
    })),
  );

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: verified.map((line) => ({
      price: line.priceId,
      quantity: line.quantity,
    })),
    success_url: checkoutUrl(
      "/success?session_id={CHECKOUT_SESSION_ID}",
      requestUrl,
    ),
    cancel_url: checkoutUrl("/shop", requestUrl),
    ...(verified.some((line) => line.physical) && {
      shipping_address_collection: {
        allowed_countries: [
          "AU",
          "AT",
          "BE",
          "CA",
          "DK",
          "FI",
          "FR",
          "DE",
          "IE",
          "IT",
          "JP",
          "MX",
          "NL",
          "NZ",
          "NO",
          "PT",
          "SG",
          "KR",
          "ES",
          "SE",
          "CH",
          "GB",
          "US",
        ],
      },
    }),
    metadata: {
      ...(summary.length <= 500 && { bodegacat_lines: summary }),
      ...(verified.length === 1 &&
        verified[0] && { productId: verified[0].productId }),
    },
  });

  return session;
}
