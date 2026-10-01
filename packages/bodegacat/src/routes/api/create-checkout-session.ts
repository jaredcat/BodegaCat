import type { APIRoute } from "astro";
import { createCheckoutSession } from "@lib/stripe-checkout";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as {
      items?: { priceId?: string; quantity?: number }[];
    };

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return new Response(JSON.stringify({ error: "Cart is empty" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const lines = body.items.map((item) => ({
      priceId: item.priceId ?? "",
      quantity: item.quantity ?? 0,
    }));

    if (lines.some((line) => line.priceId === "")) {
      return new Response(
        JSON.stringify({
          error:
            "An item in the cart has no price. Remove it and add it again.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const session = await createCheckoutSession(lines, request.url);
    if (!session.url) {
      return new Response(
        JSON.stringify({ error: "Failed to create checkout session" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create checkout session";
    const status =
      message === "That option is not for sale" ||
      message.startsWith("Quantity")
        ? 400
        : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
};
