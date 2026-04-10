import { stripe } from "@lib/stripe";
import type { APIRoute } from "astro";

export const prerender = false;

/** Sets `bodegacat_published` to true without touching other fields (metadata merge). */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as { id?: string };
    const id = body.id;
    if (typeof id !== "string" || id.length === 0) {
      return new Response(JSON.stringify({ error: "Product id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const existing = await stripe.products.retrieve(id);
    await stripe.products.update(id, {
      metadata: {
        ...existing.metadata,
        bodegacat_published: "true",
      },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[publish-product]", error);
    return new Response(JSON.stringify({ error: "Failed to publish product" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
