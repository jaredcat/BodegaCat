import { atom, computed, map } from "nanostores";
import type { Product } from "../types/product";

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariations: Record<string, string>;
  totalPrice: number;
}

// Cart state using map for better performance
export const cartItems = map<Record<string, CartItem>>({});
export const isCartOpen = atom(false);

// Computed values
export const cartCount = computed(cartItems, (items) =>
  Object.values(items).reduce((total, item) => total + item.quantity, 0),
);

export const cartTotal = computed(cartItems, (items) =>
  Object.values(items).reduce(
    (total, item) => total + item.totalPrice * item.quantity,
    0,
  ),
);

// Cart actions
export function addToCart(
  product: Product,
  quantity: number,
  selectedVariations: Record<string, string> = {},
  totalPrice: number,
) {
  console.log("Adding to cart:", {
    product: product.name,
    quantity,
    selectedVariations,
    totalPrice,
  });

  const currentItems = cartItems.get();
  const itemKey = `${product.id}-${JSON.stringify(selectedVariations)}`;

  if (Object.prototype.hasOwnProperty.call(currentItems, itemKey)) {
    // Update existing item
    const existingItem = currentItems[itemKey];
    cartItems.setKey(itemKey, {
      ...existingItem,
      quantity: existingItem.quantity + quantity,
    });
    console.log("Updated existing item in cart");
  } else {
    // Add new item
    cartItems.setKey(itemKey, {
      product,
      quantity,
      selectedVariations,
      totalPrice,
    });
    console.log("Added new item to cart");
  }

  // Open cart after adding item
  isCartOpen.set(true);
  console.log("Cart opened");
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

  if (Object.prototype.hasOwnProperty.call(currentItems, itemKey)) {
    const existingItem = currentItems[itemKey];
    cartItems.setKey(itemKey, { ...existingItem, quantity });
  }
}

export function clearCart() {
  cartItems.set({});
  console.log("Cart cleared");
}

export function toggleCart() {
  const currentState = isCartOpen.get();
  console.log("Toggling cart from:", currentState, "to:", !currentState);
  isCartOpen.set(!currentState);
}

export function closeCart() {
  console.log("Closing cart");
  isCartOpen.set(false);
}

// Initialize cart from localStorage only on client side
let isInitialized = false;

export function initializeCart() {
  if (isInitialized || typeof window === "undefined") {
    return;
  }

  isInitialized = true;

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
  isCartOpen.subscribe((open) => {
    console.log("Cart open state changed to:", open);
  });
}
