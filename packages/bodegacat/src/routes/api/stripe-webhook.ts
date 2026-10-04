import { getSiteConfig } from "@config/site";
import { triggerProductionDeployHook } from "@lib/deploy-hook";
import { stripe } from "@lib/stripe";
import { STRIPE_WEBHOOK_AUTO_DEPLOY } from "astro:env/server";
import type { APIRoute } from "astro";

export const prerender = false;

function shouldAutoDeployFromStripeWebhook(): boolean {
  const v = STRIPE_WEBHOOK_AUTO_DEPLOY;
  return v === "true" || v === "1";
}

export const POST: APIRoute = async ({ request }) => {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return new Response("No signature provided", { status: 400 });
  }

  const siteConfig = getSiteConfig();
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      siteConfig.stripe.webhookSecret,
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
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
    if (shouldAutoDeployFromStripeWebhook()) {
      await triggerProductionDeployHook(`stripe:${event.type}`, {
        id: eventData.id,
      });
    } else {
      console.log(
        "[stripe-webhook] STRIPE_WEBHOOK_AUTO_DEPLOY is not true — skipping deploy hook (use Admin → Deploy live site when ready)",
      );
    }
  } else if (event.type === "checkout.session.completed") {
    console.log("Checkout completed:", event.data.object);
  } else {
    console.log(`Unhandled event type: ${event.type}`);
  }

  return Response.json(
    { received: true },
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
};
