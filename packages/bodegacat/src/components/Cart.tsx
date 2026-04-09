import { useStore } from "@nanostores/react";
import { useEffect, useState } from "react";
import {
  cartCount,
  cartItems,
  cartTotal,
  clearCart,
  closeCart,
  initializeCart,
  isCartOpen,
  removeFromCart,
  updateQuantity,
} from "../lib/cartStore";

export default function Cart() {
  const items = useStore(cartItems);
  const total = useStore(cartTotal);
  const count = useStore(cartCount);
  const open = useStore(isCartOpen);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
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
        closeCart();
        window.location.href = data.url;
      } else {
        throw new Error(data.error ?? "Failed to create checkout session");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to start checkout. Please try again.");
    }
  };

  // Don't render if cart is not open
  if (!open) {
    return null;
  }

  const cartItemsArray = Object.values(items);

  if (count === 0) {
    return (
      <div className="bg-opacity-50 fixed inset-0 z-50 flex justify-end bg-black">
        <div className="h-full w-full max-w-md bg-white shadow-xl">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-lg font-semibold">Shopping Cart</h2>
            <button
              onClick={closeCart}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close cart"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex justify-end bg-black">
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">
            Shopping Cart {isClient && `(${count.toString()})`}
          </h2>
          <button
            onClick={closeCart}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close cart"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {cartItemsArray.map((item) => {
            const itemKey = `${item.product.id}-${JSON.stringify(item.selectedVariations)}`;
            return (
              <div key={itemKey} className="flex space-x-4 border-b pb-4">
                {/* Product Image */}
                <div className="shrink-0">
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
        <div className="space-y-4 border-t p-4">
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
            Checkout {isClient && `(${count.toString()} items)`}
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
