import { stripe } from "@lib/stripe";
import { syncCatalogPrices } from "@lib/catalog-prices";
import {
  variationMetadataPatch,
  readVariationMetadata,
} from "@lib/variation-metadata";
import type { APIRoute } from "astro";
import type { Product, ProductVariationDefinition } from "@models/product";

export const prerender = false;

function variationDefinitionsFrom(
  productData: Partial<Product>,
): ProductVariationDefinition[] {
  return productData.variationDefinitions ?? [];
}

function stringMeta(value = ""): string {
  return value;
}

function productMetadata(
  productData: Partial<Product>,
  existing: Record<string, string> = {},
  definitions: ProductVariationDefinition[] = [],
  basePrice = productData.basePrice ?? 0,
): Record<string, string> {
  const publishedRaw =
    productData.metadata?.publishedToStorefront === false ? "false" : "true";
  const variationPatch = variationMetadataPatch(
    definitions,
    Object.keys(existing),
  );

  return {
    ...existing,
    ...variationPatch,
    bodegacat_active: productData.active ? "true" : "false",
    bodegacat_published: publishedRaw,
    bodegacat_base_price: String(basePrice),
    productTypeId: stringMeta(
      productData.metadata?.productTypeId ?? existing.productTypeId,
    ),
    category: productData.metadata?.category ?? "",
    brand: productData.metadata?.brand ?? "",
    sku: productData.metadata?.sku ?? "",
    tags: JSON.stringify(productData.metadata?.tags ?? []),
    slug:
      existing.slug ||
      (productData.name ?? "")
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, "-")
        .replaceAll(/(^-|-$)/g, ""),
    deliveryType: productData.metadata?.deliveryType ?? "",
    bookingConfig: productData.metadata?.bookingConfig
      ? JSON.stringify(productData.metadata.bookingConfig)
      : "",
  };
}

export const GET: APIRoute = async () => {
  try {
    const products = await stripe.products.list({
      limit: 100,
      expand: ["data.default_price"],
    });

    return Response.json(products.data, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return Response.json(
      { error: "Failed to fetch products" },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const productData = (await request.json()) as Partial<Product>;

    // Validate required fields
    if (
      !productData.name ||
      !productData.description ||
      !productData.basePrice
    ) {
      return Response.json(
        {
          error:
            "Missing required fields: name, description, and basePrice are required",
        },
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Create product in Stripe
    const definitions = variationDefinitionsFrom(productData);
    const stripeProduct = await stripe.products.create({
      name: productData.name,
      description: productData.description,
      images: productData.images,
      metadata: productMetadata(
        productData,
        {},
        definitions,
        productData.basePrice,
      ),
      active: productData.active,
    });

    await syncCatalogPrices({
      productId: stripeProduct.id,
      basePrice: productData.basePrice,
      currency: productData.currency ?? "usd",
      definitions: variationDefinitionsFrom(productData),
    });

    return Response.json(
      {
        success: true,
        product: {
          id: stripeProduct.id,
          name: stripeProduct.name,
          description: stripeProduct.description,
          images: stripeProduct.images,
          active: stripeProduct.active,
          metadata: stripeProduct.metadata,
          default_price:
            typeof stripeProduct.default_price === "string"
              ? stripeProduct.default_price
              : stripeProduct.default_price?.id,
        },
      },
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error creating product:", error);
    return Response.json(
      {
        error: "Failed to create product",
      },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const requestData = (await request.json()) as {
      id: string;
    } & Partial<Product>;
    const { id, ...productData } = requestData;

    if (!id) {
      return Response.json(
        {
          error: "Product ID is required",
        },
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const existing = await stripe.products.retrieve(id);
    const definitions =
      productData.variationDefinitions ??
      readVariationMetadata(existing.metadata) ??
      [];
    const basePrice =
      productData.basePrice ??
      Number(existing.metadata.bodegacat_base_price || "0");

    const updatedProduct = await stripe.products.update(id, {
      name: productData.name,
      description: productData.description,
      images: productData.images,
      metadata: productMetadata(
        productData,
        existing.metadata,
        definitions,
        basePrice,
      ),
      active: productData.active,
    });

    await syncCatalogPrices({
      productId: id,
      basePrice,
      currency: productData.currency ?? "usd",
      definitions,
    });

    return Response.json(
      {
        success: true,
        product: updatedProduct,
      },
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error updating product:", error);
    return Response.json(
      {
        error: "Failed to update product",
      },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { id } = (await request.json()) as { id: string };

    if (!id) {
      return Response.json(
        {
          error: "Product ID is required",
        },
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Archive product in Stripe (soft delete)
    await stripe.products.update(id, {
      active: false,
      metadata: {
        bodegacat_active: "false",
      },
    });

    return Response.json(
      {
        success: true,
      },
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error deleting product:", error);
    return Response.json(
      {
        error: "Failed to delete product",
      },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
