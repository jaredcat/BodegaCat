import { useStore } from "@nanostores/react";
import { useEffect, type ReactNode } from "react";
import { beginCheckout } from "../lib/checkout";
import {
  cartCount,
  cartItems,
  cartTotal,
  clearCart,
  closeCart,
  initializeCart,
  isCartOpen,
} from "../lib/cartStore";
import { useIsClient } from "../lib/useIsClient";
import CartLine from "./CartLine";

function CartDrawer({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close cart"
        className="absolute inset-0 cursor-default border-0 bg-black/50 p-0"
        onClick={closeCart}
      />
      <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        {children}
      </div>
    </div>
  );
}

function CartHeader({ title }: Readonly<{ title: ReactNode }>) {
  return (
    <div className="flex items-center justify-between border-b p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
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
  );
}

export default function Cart() {
  const items = useStore(cartItems);
  const total = useStore(cartTotal);
  const count = useStore(cartCount);
  const open = useStore(isCartOpen);
  const isClient = useIsClient();

  useEffect(() => {
    initializeCart();
  }, []);

  // Don't render if cart is not open
  if (!open) {
    return null;
  }

  const cartItemsArray = Object.values(items);
  const countLabel = isClient ? ` (${count.toString()})` : "";

  if (count === 0) {
    return (
      <CartDrawer>
        <CartHeader title="Shopping Cart" />
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
      </CartDrawer>
    );
  }

  return (
    <CartDrawer>
      <CartHeader title={`Shopping Cart${countLabel}`} />

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {cartItemsArray.map((item) => (
          <CartLine key={`${item.product.id}-${item.priceId}`} item={item} />
        ))}
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
            void beginCheckout(items, { beforeRedirect: closeCart });
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
    </CartDrawer>
  );
}
