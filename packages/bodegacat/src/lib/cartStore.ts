import { atom, computed, map } from "nanostores";
import type { Product } from "../types/product";
import { unitAmountFor } from "./offers";

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariations: Record<string, string>;
  priceId: string;
}

export function cartLineAmount(item: CartItem): number {
  return unitAmountFor(item.product, item.priceId, item.selectedVariations);
}

// Cart state using map for better performance
export const cartItems = map<Record<string, CartItem>>({});
export const cartOpen = atom(false);

// Computed values
export const cartCount = computed(cartItems, (items) =>
  Object.values(items).reduce((total, item) => total + item.quantity, 0),
);

export const cartTotal = computed(cartItems, (items) =>
  Object.values(items).reduce(
    (total, item) => total + cartLineAmount(item) * item.quantity,
    0,
  ),
);

// Cart actions
export function addToCart(
  product: Product,
  quantity: number,
  selectedVariations: Record<string, string>,
  priceId: string,
) {
  const currentItems = cartItems.get();
  const itemKey = `${product.id}-${priceId}`;

  if (Object.hasOwn(currentItems, itemKey)) {
    const existingItem = currentItems[itemKey];
    cartItems.setKey(itemKey, {
      ...existingItem,
      quantity: existingItem.quantity + quantity,
    });
  } else {
    cartItems.setKey(itemKey, {
      product,
      quantity,
      selectedVariations,
      priceId,
    });
  }

  cartOpen.set(true);
}

export function removeFromCart(itemKey: string) {
  const currentItems = cartItems.get();

  const { [itemKey]: removed, ...remainingItems } = currentItems;
  cartItems.set(remainingItems);
  console.log("Removed item from cart:", itemKey);
}

export function updateQuantity(itemKey: string, quantity: number) {
  if (quantity <= 0) {
    removeFromCart(itemKey);
    return;
  }

  const currentItems = cartItems.get();
  if (!Object.hasOwn(currentItems, itemKey)) {
    return;
  }

  const existingItem = currentItems[itemKey];
  cartItems.setKey(itemKey, { ...existingItem, quantity });
}

export function clearCart() {
  cartItems.set({});
  console.log("Cart cleared");
}

export function toggleCart() {
  const isCurrentlyOpen = cartOpen.get();
  console.log("Toggling cart from:", isCurrentlyOpen, "to:", !isCurrentlyOpen);
  cartOpen.set(!isCurrentlyOpen);
}

export function closeCart() {
  console.log("Closing cart");
  cartOpen.set(false);
}

// Initialize cart from localStorage only on client side
const cartInitialization = { done: false };

export function initializeCart() {
  if (typeof window === "undefined" || cartInitialization.done) {
    return;
  }

  cartInitialization.done = true;

  // Load cart from localStorage on client side
  const savedCart = localStorage.getItem("bodegacat-cart");
  if (savedCart) {
    try {
      const parsedCart = JSON.parse(savedCart) as Record<string, CartItem>;
      cartItems.set(parsedCart);
      console.log("Loaded cart from localStorage:", parsedCart);
    } catch (error) {
      console.warn("Failed to load cart from localStorage:", error);
    }
  }

  // Save cart to localStorage whenever it changes
  cartItems.subscribe((items) => {
    localStorage.setItem("bodegacat-cart", JSON.stringify(items));
    console.log("Saved cart to localStorage:", items);
  });

  // Debug cart state changes
  cartOpen.subscribe((open) => {
    console.log("Cart open state changed to:", open);
  });
}
