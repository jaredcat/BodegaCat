import { useStore } from "@nanostores/react";
import { useEffect } from "react";
import {
  cartCount,
  cartItems,
  cartTotal,
  clearCart,
  initializeCart,
  removeFromCart,
  updateQuantity,
} from "../lib/cartStore";
import { useIsClient } from "../lib/useIsClient";

export default function CartPage() {
  const items = useStore(cartItems);
  const count = useStore(cartCount);
  const total = useStore(cartTotal);
  const isClient = useIsClient();

  useEffect(() => {
    initializeCart();
  }, []);

  const handleCheckout = async () => {
    try {
      // Create checkout session with all cart items
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: Object.values(items).map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            selectedVariations: item.selectedVariations,
          })),
        }),
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (data.url) {
        // Clear cart and redirect to Stripe Checkout
        clearCart();
        window.location.href = data.url;
      } else {
        throw new Error(data.error ?? "Failed to create checkout session");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to start checkout. Please try again.");
    }
  };

  const cartItemsArray = Object.values(items);

  if (count === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">
          Shopping Cart {isClient && `(${count.toString()} items)`}
        </h1>
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Your cart is empty
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Start shopping to add items to your cart.
          </p>
          <div className="mt-6">
            <a
              href="/shop"
              className="bg-primary hover:bg-primary/90 inline-flex items-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm"
            >
              Continue Shopping
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">
        Shopping Cart {isClient && `(${count.toString()} items)`}
      </h1>

      <div className="rounded-lg bg-white shadow">
        {/* Cart Items */}
        <div className="space-y-4 p-6">
          {cartItemsArray.map((item) => {
            const itemKey = `${item.product.id}-${JSON.stringify(item.selectedVariations)}`;
            return (
              <div key={itemKey} className="flex space-x-4 border-b pb-4">
                {/* Product Image */}
                <div className="flex-shrink-0">
                  <img
                    src={item.product.images[0] ?? "/placeholder-image.jpg"}
                    alt={item.product.name}
                    className="h-16 w-16 rounded object-cover"
                  />
                </div>

                {/* Product Details */}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-medium text-gray-900">
                    {item.product.name}
                  </h3>

                  {/* Variations */}
                  {Object.keys(item.selectedVariations).length > 0 && (
                    <div className="mt-1 text-xs text-gray-500">
                      {Object.entries(item.selectedVariations).map(
                        ([key, value]) => (
                          <div key={key}>
                            {key}: {value}
                          </div>
                        ),
                      )}
                    </div>
                  )}

                  {/* Price */}
                  <p className="mt-1 text-sm text-gray-900">
                    ${(item.totalPrice / 100).toFixed(2)} each
                  </p>

                  {/* Quantity Controls */}
                  <div className="mt-2 flex items-center space-x-2">
                    <button
                      onClick={() => {
                        updateQuantity(itemKey, item.quantity - 1);
                      }}
                      className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 hover:bg-gray-50"
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => {
                        updateQuantity(itemKey, item.quantity + 1);
                      }}
                      className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 hover:bg-gray-50"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                    <button
                      onClick={() => {
                        removeFromCart(itemKey);
                      }}
                      className="ml-2 text-sm text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="space-y-4 border-t p-6">
          {/* Total */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium">Total:</span>
            <span className="text-primary text-xl font-bold">
              ${(total / 100).toFixed(2)}
            </span>
          </div>

          {/* Checkout Button */}
          <button
            onClick={() => {
              void handleCheckout();
            }}
            className="bg-primary hover:bg-primary/90 w-full rounded-md px-4 py-3 font-medium text-white transition-colors"
          >
            Checkout ({count} items)
          </button>

          {/* Clear Cart */}
          <button
            onClick={clearCart}
            className="w-full text-sm text-gray-500 hover:text-gray-700"
          >
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  );
}
