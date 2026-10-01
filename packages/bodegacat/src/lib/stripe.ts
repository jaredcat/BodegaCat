import type Stripe from "stripe";
import {
  isUnsellablePrice,
  listActivePrices,
  selectionFromPrice,
} from "./catalog-prices";
import { stripe } from "./stripe-client";
import { readVariationMetadata } from "./variation-metadata";
import type { Product, ProductOffer } from "../types/product";

export { stripe };
export function isPublishedOnStorefront(
  metadata: Stripe.Metadata | Record<string, string>,
): boolean {
  return metadata.bodegacat_published !== "false";
}

export interface GetProductsOptions {
  /** Include products not yet published to the public storefront (preview mode). */
  includeUnpublished?: boolean;
}

/** True when any product is a draft (`bodegacat_published` / publishedToStorefront false). */
export function hasUnpublishedDrafts(products: Product[]): boolean {
  return products.some((p) => p.metadata.publishedToStorefront === false);
}

// Function to generate a slug from a product name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters except spaces and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-/, "") // Remove leading hyphen
    .replace(/-$/, ""); // Remove trailing hyphen
}

export async function getProducts(
  options: GetProductsOptions = {},
): Promise<Product[]> {
  const { includeUnpublished = false } = options;
  const products = await stripe.products.list({
    active: true,
    expand: ["data.default_price"],
  });

  const productsWithPrices = await Promise.all(
    products.data
      .filter((product) => product.metadata.bodegacat_active === "true")
      .filter(
        (product) =>
          includeUnpublished || isPublishedOnStorefront(product.metadata),
      )
      .map(async (product) => ({
        product,
        prices: await listActivePrices(product.id),
      })),
  );

  return productsWithPrices
    .filter(({ prices }) => prices.length > 0) // Only include products with at least one price
    .map(({ product, prices }) => transformStripeProduct(product, prices));
}

export async function getProduct(
  slug: string,
  options: GetProductsOptions = {},
): Promise<Product | null> {
  const { includeUnpublished = false } = options;
  const products = await stripe.products.list({
    active: true,
    expand: ["data.default_price"],
  });

  const product = products.data.find((p) => {
    const productSlug = p.metadata.slug || generateSlug(p.name);
    const activeOk = p.metadata.bodegacat_active === "true";
    const publishedOk =
      includeUnpublished || isPublishedOnStorefront(p.metadata);
    return productSlug === slug && activeOk && publishedOk;
  });

  if (!product) return null;

  const prices = await listActivePrices(product.id);

  if (prices.length === 0) return null;

  return transformStripeProduct(product, prices);
}

export async function getProductById(
  productId: string,
): Promise<Product | null> {
  try {
    const product = await stripe.products.retrieve(productId, {
      expand: ["default_price"],
    });

    if (product.metadata.bodegacat_active !== "true") {
      return null;
    }

    const prices = await listActivePrices(product.id);

    if (prices.length === 0) return null;

    return transformStripeProduct(product, prices);
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    return null;
  }
}

function transformStripeProduct(
  product: Stripe.Product,
  prices: Stripe.Price[],
): Product {
  // Find the lowest price to use as base price
  const lowestPrice = prices.reduce<Stripe.Price | null>((lowest, price) => {
    if (
      price.unit_amount &&
      (!lowest ||
        (lowest.unit_amount && price.unit_amount < lowest.unit_amount))
    ) {
      return price;
    }
    return lowest;
  }, null);

  if (!lowestPrice) {
    throw new Error(`No valid prices found for product ${product.id}`);
  }

  const baseCurrency = lowestPrice.currency;

  const variations = readVariationMetadata(product.metadata) ?? [];

  const metaBase = product.metadata.bodegacat_base_price;
  const parsedBase = metaBase ? Number(metaBase) : Number.NaN;
  const basePrice = Number.isFinite(parsedBase)
    ? parsedBase
    : (lowestPrice.unit_amount ?? 0);

  let offerPrices = prices.filter(
    (price) =>
      price.currency === baseCurrency &&
      price.unit_amount != null &&
      !isUnsellablePrice(price),
  );
  if (variations.length === 0) {
    const only = offerPrices.reduce<Stripe.Price | undefined>(
      (lowest, price) => {
        if (!lowest || (price.unit_amount ?? 0) < (lowest.unit_amount ?? 0)) {
          return price;
        }
        return lowest;
      },
      undefined,
    );
    offerPrices = only ? [only] : [];
  }

  const offers: ProductOffer[] = offerPrices.map((price) => ({
    priceId: price.id,
    unitAmount: price.unit_amount ?? 0,
    currency: price.currency,
    selection: selectionFromPrice(price),
  }));

  // Generate slug if not provided
  const slug = product.metadata.slug || generateSlug(product.name);

  return {
    id: product.id,
    name: product.name,
    description: product.description ?? "",
    metadata: {
      productTypeId: product.metadata.productTypeId,
      publishedToStorefront: isPublishedOnStorefront(product.metadata),
      tags: (product.metadata.tags
        ? JSON.parse(product.metadata.tags)
        : []) as string[],
      category: product.metadata.category,
      brand: product.metadata.brand,
      sku: product.metadata.sku,
      deliveryType: product.metadata.deliveryType as
        "physical" | "digital" | "service" | "booking" | undefined,
      bookingConfig: product.metadata.bookingConfig
        ? (() => {
            try {
              return JSON.parse(
                product.metadata.bookingConfig,
              ) as import("../types/product").BookingConfig;
            } catch {
              return undefined;
            }
          })()
        : undefined,
      weight: product.metadata.weight
        ? Number.parseFloat(product.metadata.weight)
        : undefined,
      dimensions: product.metadata.dimensions
        ? (JSON.parse(product.metadata.dimensions) as {
            height: number;
            width: number;
            length: number;
            weight: number;
          })
        : undefined,
    },
    images: product.images,
    active: product.active,
    slug,
    basePrice,
    currency: baseCurrency,
    variationDefinitions: variations,
    offers,
    createdAt: new Date(product.created * 1000),
    updatedAt: new Date(),
  };
}
