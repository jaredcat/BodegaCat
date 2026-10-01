import { STRIPE_API_VERSION } from "astro:env/client";
import { STRIPE_SECRET_KEY } from "astro:env/server";
import Stripe from "stripe";

if (!STRIPE_SECRET_KEY) {
  throw new Error(
    "STRIPE_SECRET_KEY is required: set it for the Worker at runtime and for `astro build` so static /shop/[slug] pages can be generated.",
  );
}

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: STRIPE_API_VERSION,
} as ConstructorParameters<typeof Stripe>[1]);
