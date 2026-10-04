import { useStore } from "@nanostores/react";
import { useEffect } from "react";
import CartLine from "./CartLine";
import { beginCheckout } from "../lib/checkout";
import {
  cartCount,
  cartItems,
  cartTotal,
  clearCart,
  initializeCart,
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

  const cartItemsArray = Object.values(items);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">
        Shopping Cart {isClient && `(${count.toString()} items)`}
      </h1>

      <div className="rounded-lg bg-white shadow">
        {/* Cart Items */}
        <div className="space-y-4 p-6">
          {cartItemsArray.map((item) => (
            <CartLine key={`${item.product.id}-${item.priceId}`} item={item} />
          ))}
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
              void beginCheckout(items);
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
