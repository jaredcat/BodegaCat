import { clearCart, type CartItem } from "./cartStore";

/**
 * Starts Stripe Checkout for the current cart lines.
 * Clears the cart once the session URL is ready, then navigates there.
 * `beforeRedirect` runs after the cart is cleared and before navigation
 * (the drawer uses it to close).
 */
export async function beginCheckout(
  items: Record<string, CartItem>,
  options?: { readonly beforeRedirect?: () => void },
): Promise<void> {
  try {
    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: Object.values(items).map((item) => ({
          priceId: item.priceId,
          quantity: item.quantity,
        })),
      }),
    });

    const data = (await response.json()) as { url?: string; error?: string };

    if (!data.url) {
      throw new Error(data.error ?? "Failed to create checkout session");
    }

    clearCart();
    options?.beforeRedirect?.();
    window.location.href = data.url;
  } catch (error) {
    console.error("Checkout error:", error);
    alert("Failed to start checkout. Please try again.");
  }
}
