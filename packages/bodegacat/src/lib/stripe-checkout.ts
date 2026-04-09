import { STRIPE_SECRET_KEY } from "astro:env/server";
import Stripe from "stripe";

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2026-03-25.dahlia",
});

// Helper function to construct proper URLs
function constructUrl(path: string, requestUrl?: string): string {
  if (requestUrl) {
    // Use the request URL to determine the base URL dynamically
    const url = new URL(requestUrl);
    const baseUrl = `${url.protocol}//${url.host}`;
    return `${baseUrl}${path}`;
  }

  // Fallback: use environment variable if available
  const siteUrl = process.env.SITE_URL;
  if (siteUrl) {
    const url = siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`;
    return `${url}${path}`;
  }

  // Final fallback for development
  return `http://localhost:8787${path}`;
}

interface CartItem {
  productId: string;
  quantity: number;
  selectedVariations: Record<string, string>;
}

async function findMatchingPrice(
  productId: string,
  selectedVariations: Record<string, string>,
): Promise<string> {
  const product = await stripe.products.retrieve(productId);
  let priceId = product.default_price as string;

  if (Object.keys(selectedVariations).length > 0) {
    const prices = await stripe.prices.list({
      product: productId,
      active: true,
    });

    const matchingPrice = prices.data.find((price) => {
      return Object.entries(selectedVariations).every(
        ([key, value]) => price.metadata[key] === value,
      );
    });

    if (matchingPrice) {
      priceId = matchingPrice.id;
    }
  }

  return priceId;
}

async function createLineItemsForCart(
  cartItems: CartItem[],
): Promise<Stripe.Checkout.SessionCreateParams.LineItem[]> {
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  for (const item of cartItems) {
    const priceId = await findMatchingPrice(
      item.productId,
      item.selectedVariations,
    );
    lineItems.push({
      price: priceId,
      quantity: item.quantity,
    });
  }

  return lineItems;
}

export async function createCheckoutSession(
  productIdOrItems: string | CartItem[],
  quantity?: number,
  selectedVariations?: Record<string, string>,
  requestUrl?: string,
) {
  try {
    // Handle cart checkout (multiple items)
    if (Array.isArray(productIdOrItems)) {
      const lineItems = await createLineItemsForCart(productIdOrItems);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: constructUrl(
          "/success?session_id={CHECKOUT_SESSION_ID}",
          requestUrl,
        ),
        cancel_url: constructUrl("/shop", requestUrl),
      });

      return session;
    }

    // Handle single item checkout
    const productId = productIdOrItems;
    const priceId = await findMatchingPrice(
      productId,
      selectedVariations ?? {},
    );

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: quantity ?? 1,
        },
      ],
      mode: "payment",
      success_url: constructUrl(
        "/success?session_id={CHECKOUT_SESSION_ID}",
        requestUrl,
      ),
      cancel_url: constructUrl("/shop", requestUrl),
      metadata: {
        productId,
        selectedVariations: selectedVariations
          ? JSON.stringify(selectedVariations)
          : "",
      },
    });

    return session;
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw error;
  }
}

export async function createPaymentLink(
  productId: string,
  quantity = 1,
  selectedVariations: Record<string, string> = {},
) {
  try {
    // Get the product from Stripe
    const product = await stripe.products.retrieve(productId);

    // Find the appropriate price based on variations
    let priceId = product.default_price as string;

    // If there are variations, find the matching price
    if (Object.keys(selectedVariations).length > 0) {
      const prices = await stripe.prices.list({
        product: productId,
        active: true,
      });

      // Find price that matches the selected variations
      const matchingPrice = prices.data.find((price) => {
        // Check if price metadata matches selected variations
        return Object.entries(selectedVariations).every(
          ([key, value]) => price.metadata[key] === value,
        );
      });

      if (matchingPrice) {
        priceId = matchingPrice.id;
      }
    }

    // Create payment link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: priceId,
          quantity: quantity,
        },
      ],
      metadata: {
        productId,
        selectedVariations: JSON.stringify(selectedVariations),
      },
    });

    return paymentLink;
  } catch (error) {
    console.error("Error creating payment link:", error);
    throw error;
  }
}
