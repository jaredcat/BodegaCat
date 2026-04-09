import { stripe } from "@lib/stripe";
import type { APIRoute } from "astro";
import type { Product } from "@models/product";

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const products = await stripe.products.list({
      limit: 100,
      expand: ["data.default_price"],
    });

    return new Response(JSON.stringify(products.data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch products" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
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
      return new Response(
        JSON.stringify({
          error:
            "Missing required fields: name, description, and basePrice are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Create product in Stripe
    const stripeProduct = await stripe.products.create({
      name: productData.name,
      description: productData.description,
      images: productData.images,
      metadata: {
        bodegacat_active: productData.active ? "true" : "false",
        productTypeId: productData.metadata?.productTypeId ?? "",
        category: productData.metadata?.category ?? "",
        brand: productData.metadata?.brand ?? "",
        sku: productData.metadata?.sku ?? "",
        tags: JSON.stringify(productData.metadata?.tags ?? []),
        slug: productData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
        ...(productData.metadata?.deliveryType && {
          deliveryType: productData.metadata.deliveryType,
        }),
        ...(productData.metadata?.bookingConfig && {
          bookingConfig: JSON.stringify(productData.metadata.bookingConfig),
        }),
      },
      active: productData.active,
    });

    // Create price for the product
    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: productData.basePrice,
      currency: productData.currency ?? "usd",
    });

    // Update product with default price
    await stripe.products.update(stripeProduct.id, {
      default_price: stripePrice.id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        product: {
          id: stripeProduct.id,
          name: stripeProduct.name,
          description: stripeProduct.description,
          images: stripeProduct.images,
          active: stripeProduct.active,
          metadata: stripeProduct.metadata,
          default_price: stripePrice.id,
        },
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error creating product:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to create product",
      }),
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
      return new Response(
        JSON.stringify({
          error: "Product ID is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Update product in Stripe
    const updatedProduct = await stripe.products.update(id, {
      name: productData.name,
      description: productData.description,
      images: productData.images,
      metadata: {
        bodegacat_active: productData.active ? "true" : "false",
        productTypeId: productData.metadata?.productTypeId ?? "",
        category: productData.metadata?.category ?? "",
        brand: productData.metadata?.brand ?? "",
        sku: productData.metadata?.sku ?? "",
        tags: JSON.stringify(productData.metadata?.tags ?? []),
        deliveryType: productData.metadata?.deliveryType ?? "",
        bookingConfig: productData.metadata?.bookingConfig
          ? JSON.stringify(productData.metadata.bookingConfig)
          : "",
      },
      active: productData.active,
    });

    // If price changed, create new price
    if (productData.basePrice) {
      const newPrice = await stripe.prices.create({
        product: id,
        unit_amount: productData.basePrice,
        currency: productData.currency ?? "usd",
      });

      await stripe.products.update(id, {
        default_price: newPrice.id,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        product: updatedProduct,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error updating product:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to update product",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const requestData = (await request.json()) as { id: string };
    const { id } = requestData;

    if (!id) {
      return new Response(
        JSON.stringify({
          error: "Product ID is required",
        }),
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

    return new Response(
      JSON.stringify({
        success: true,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error deleting product:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to delete product",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
