import { STRIPE_API_VERSION } from "astro:env/client";
import { STRIPE_SECRET_KEY } from "astro:env/server";
import Stripe from "stripe";
import type {
  Product,
  ProductVariationDefinition,
  ProductVariationOptionDefinition,
} from "../types/product";

if (!STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is required");
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: STRIPE_API_VERSION as Stripe.LatestApiVersion,
});

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

export async function getProducts(): Promise<Product[]> {
  const products = await stripe.products.list({
    active: true,
    expand: ["data.default_price"],
  });

  const productsWithPrices = await Promise.all(
    products.data
      .filter((product) => product.metadata.bodegacat_active === "true")
      .map(async (product) => {
        // Get all prices for this product
        const prices = await stripe.prices.list({
          product: product.id,
          active: true,
        });

        return { product, prices: prices.data };
      }),
  );

  return productsWithPrices
    .filter(({ prices }) => prices.length > 0) // Only include products with at least one price
    .map(({ product, prices }) => transformStripeProduct(product, prices));
}

export async function getProduct(slug: string): Promise<Product | null> {
  const products = await stripe.products.list({
    active: true,
    expand: ["data.default_price"],
  });

  const product = products.data.find((p) => {
    const productSlug = p.metadata.slug || generateSlug(p.name);
    return productSlug === slug && p.metadata.bodegacat_active === "true";
  });

  if (!product) return null;

  // Get all prices for this product
  const prices = await stripe.prices.list({
    product: product.id,
    active: true,
  });

  if (prices.data.length === 0) return null;

  return transformStripeProduct(product, prices.data);
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

    // Get all prices for this product
    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
    });

    if (prices.data.length === 0) return null;

    return transformStripeProduct(product, prices.data);
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

  // Group prices by currency for variations
  const pricesByCurrency = prices.reduce<Record<string, Stripe.Price[]>>(
    (acc, price) => {
      acc[price.currency] = acc[price.currency] ?? [];
      acc[price.currency].push(price);
      return acc;
    },
    {},
  );

  // Use the currency of the lowest price
  const baseCurrency = lowestPrice.currency;

  // Parse variations from metadata or create default structure
  const variations = parseProductVariations(
    product,
    pricesByCurrency[baseCurrency] ?? [],
  );

  // Generate slug if not provided
  const slug = product.metadata.slug || generateSlug(product.name);

  return {
    id: product.id,
    name: product.name,
    description: product.description ?? "",
    metadata: {
      productTypeId: product.metadata.productTypeId,
      tags: (product.metadata.tags
        ? JSON.parse(product.metadata.tags)
        : []) as string[],
      category: product.metadata.category,
      brand: product.metadata.brand,
      sku: product.metadata.sku,
      deliveryType: product.metadata.deliveryType as
        | "physical"
        | "digital"
        | "service"
        | "booking"
        | undefined,
      bookingConfig: product.metadata.bookingConfig
        ? (() => {
            try {
              return JSON.parse(product.metadata.bookingConfig) as import("../types/product").BookingConfig;
            } catch {
              return undefined;
            }
          })()
        : undefined,
      weight: product.metadata.weight
        ? parseFloat(product.metadata.weight)
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
    basePrice: lowestPrice.unit_amount ?? 0,
    currency: baseCurrency,
    // New: robust variation system
    variationDefinitions: variations,
    createdAt: new Date(product.created * 1000),
    updatedAt: new Date(),
  };
}

function parseProductVariations(
  product: Stripe.Product,
  prices: Stripe.Price[],
): ProductVariationDefinition[] {
  // Try to parse variations from metadata
  if (product.metadata.variations) {
    try {
      const parsedVariations = JSON.parse(
        product.metadata.variations,
      ) as ProductVariationDefinition[];
      return parsedVariations.map((variation) => ({
        ...variation,
        options: variation.options.map((option) => ({
          ...option,
          available: option.available,
        })),
      }));
    } catch (error) {
      console.warn(
        `Failed to parse variations for product ${product.id}:`,
        error,
      );
    }
  }

  // Fallback: Create variations from prices
  // Group prices by their metadata to create variations
  const priceGroups = new Map<string, Stripe.Price[]>();

  prices.forEach((price) => {
    const variationName = price.metadata.variation || "Default";
    const optionName = price.metadata.option || "Standard";
    const key = `${variationName}:${optionName}`;

    if (!priceGroups.has(key)) {
      priceGroups.set(key, []);
    }
    const group = priceGroups.get(key);
    if (group) {
      group.push(price);
    }
  });

  if (priceGroups.size === 0) {
    // No variations found, create a default variation
    return [
      {
        id: "default",
        name: "default",
        displayName: "Default",
        type: "independent",
        order: 1,
        required: false,
        options: prices.map((price, index) => ({
          id: `option-${String(index)}`,
          name: price.metadata.option || "Standard",
          displayName: price.metadata.option || "Standard",
          priceModifier:
            (price.unit_amount ?? 0) - (prices[0]?.unit_amount ?? 0),
          available: true,
          images: price.metadata.images
            ? (JSON.parse(price.metadata.images) as string[])
            : undefined,
        })),
      },
    ];
  }

  // Group by variation name
  const variationsMap = new Map<string, ProductVariationOptionDefinition[]>();

  priceGroups.forEach((priceList, key) => {
    const [variationName, optionName] = key.split(":");
    const price = priceList[0]; // Use the first price for this option

    if (!variationsMap.has(variationName)) {
      variationsMap.set(variationName, []);
    }

    const variationOptions = variationsMap.get(variationName);
    if (variationOptions) {
      variationOptions.push({
        id: optionName,
        name: optionName,
        displayName: optionName,
        priceModifier: (price.unit_amount ?? 0) - (prices[0]?.unit_amount ?? 0),
        available: true,
        images: price.metadata.images
          ? (JSON.parse(price.metadata.images) as string[])
          : undefined,
      });
    }
  });

  return Array.from(variationsMap.entries()).map(([name, options], index) => ({
    id: name,
    name: name,
    displayName: name,
    type: "independent" as const,
    order: index + 1,
    required: false,
    options,
  }));
}

// Helper function to validate and construct proper URLs
function validateUrl(url: string): string {
  if (!url) {
    throw new Error("URL is required for checkout session");
  }

  // If URL already has protocol, return as is
  if (url.startsWith("http")) {
    return url;
  }

  // For relative URLs, construct absolute URL
  const siteUrl = import.meta.env.SITE_URL as string | undefined;
  if (siteUrl) {
    const baseUrl = siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`;
    const path = url.startsWith("/") ? url : `/${url}`;
    return `${baseUrl}${path}`;
  }

  // Fallback for development
  const protocol = import.meta.env.DEV ? "http" : "https";
  const host = import.meta.env.DEV ? "localhost:4321" : "your-domain.com";
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${protocol}://${host}${path}`;
}

export async function createCheckoutSession(
  items: {
    priceId: string;
    quantity: number;
  }[],
  successUrl: string,
  cancelUrl: string,
) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: items,
    mode: "payment",
    success_url: validateUrl(successUrl),
    cancel_url: validateUrl(cancelUrl),
  });

  return session;
}

export { stripe };
