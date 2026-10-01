import type { Product, ProductOffer } from "../types/product";
import { canonicalSelection } from "./selection";

export function findOffer(
  product: Product,
  selection: Record<string, string>,
): ProductOffer | undefined {
  const key = canonicalSelection(selection);
  return product.offers.find(
    (offer) => canonicalSelection(offer.selection) === key,
  );
}

/** Cents for a cart line. Prefer the stored Stripe price, then the variation selection. */
export function unitAmountFor(
  product: Product,
  priceId: string,
  selection: Record<string, string>,
): number {
  const priced = product.offers.find((offer) => offer.priceId === priceId);
  if (priced) return priced.unitAmount;
  const matched = findOffer(product, selection);
  if (matched) return matched.unitAmount;
  return 0;
}
