import type { APIRoute } from "astro";
import { createCheckoutSession } from "../../lib/stripe-checkout";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as {
      productId?: string;
      quantity?: number;
      selectedVariations?: Record<string, string>;
      items?: {
        productId: string;
        quantity: number;
        selectedVariations: Record<string, string>;
      }[];
    };
    const { productId, quantity, selectedVariations, items } = body;

    // Handle cart checkout (multiple items)
    if (items && Array.isArray(items)) {
      // Create checkout session with multiple items
      const session = await createCheckoutSession(
        items,
        undefined,
        undefined,
        request.url,
      );
      return new Response(JSON.stringify({ url: session.url }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle single item checkout (backward compatibility)
    if (!productId) {
      return new Response(JSON.stringify({ error: "Product ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const session = await createCheckoutSession(
      productId,
      quantity ?? 1,
      selectedVariations ?? {},
      request.url,
    );

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create checkout session" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
