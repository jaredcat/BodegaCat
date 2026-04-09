/**
 * English (en) — the reference locale.
 *
 * When adding a new locale, copy this file and translate every value.
 * The TypeScript type is derived from this file so other locales are
 * automatically checked for completeness.
 */
export const en = {
  nav: {
    shop: 'Shop',
    cart: 'Cart',
    admin: 'Admin',
    home: 'Home',
  },
  shop: {
    title: 'Shop',
    filters: 'Filters',
    search: 'Search products...',
    categories: 'Categories',
    tags: 'Tags',
    priceRange: 'Price Range',
    clearFilters: 'Clear Filters',
    viewDetails: 'View Details',
    noProducts: 'No products found.',
    viewAll: 'View All Products',
    featured: 'Featured Products',
    noFeatured: 'No products available yet.',
    shopNow: 'Shop Now',
  },
  product: {
    addToCart: 'Add to Cart',
    quantity: 'Quantity',
    sku: 'SKU',
    brand: 'Brand',
    category: 'Category',
    tags: 'Tags',
    noImage: 'No image available',
  },
  cart: {
    title: 'Your Cart',
    empty: 'Your cart is empty.',
    checkout: 'Checkout',
    remove: 'Remove',
    subtotal: 'Subtotal',
    total: 'Total',
    continueShopping: 'Continue Shopping',
    items: 'items',
  },
  checkout: {
    title: 'Checkout',
    processing: 'Processing...',
    success: 'Order placed!',
    successMessage: 'Thank you for your order.',
    continueShopping: 'Continue Shopping',
  },
  footer: {
    allRightsReserved: 'All rights reserved.',
    quickLinks: 'Quick Links',
    contact: 'Contact',
    getInTouch: 'Get in touch for any questions or support.',
  },
  common: {
    loading: 'Loading...',
    error: 'Something went wrong.',
    save: 'Save Changes',
    saving: 'Saving...',
    saved: 'Saved!',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    back: 'Back',
    backToDashboard: 'Back to Dashboard',
    required: 'Required',
    optional: 'Optional',
  },
  admin: {
    dashboard: 'Admin Dashboard',
    products: 'Products',
    settings: 'Store Settings',
    newProduct: 'New Product',
    editProduct: 'Edit Product',
    noProducts: 'No products yet.',
    manageStore: 'Manage your store',
  },
} as const;

export type Translations = typeof en;
