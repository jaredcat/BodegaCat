import { getSiteConfig } from "@/config/site";
import { stripe } from "@/lib/stripe";
import type { APIRoute } from "astro";

export const prerender = false;

async function triggerBuildHook(
  eventType: string,
  data: Record<string, unknown>,
) {
  if (!process.env.BUILD_HOOK_URL) return;

  try {
    const response = await fetch(process.env.BUILD_HOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: eventType,
        data,
        timestamp: new Date().toISOString(),
      }),
    });

    if (response.ok) {
      console.log("Build hook triggered successfully");
    } else {
      console.error("Failed to trigger build hook:", response.status);
    }
  } catch (error) {
    console.error("Error triggering build hook:", error);
  }
}

export const POST: APIRoute = async ({ request }) => {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const siteConfig = getSiteConfig();

  if (!signature) {
    return new Response("No signature provided", { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      siteConfig.stripe.webhookSecret,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  // Handle the event
  const shouldTriggerRebuild = [
    "product.created",
    "product.updated",
    "product.deleted",
    "price.created",
    "price.updated",
    "price.deleted",
  ].includes(event.type);

  if (shouldTriggerRebuild) {
    console.log(`${event.type} event received`);
    const eventData = event.data.object as { id: string };
    await triggerBuildHook(event.type, { id: eventData.id });
  } else if (event.type === "checkout.session.completed") {
    console.log("Checkout completed:", event.data.object);
  } else {
    console.log(`Unhandled event type: ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
