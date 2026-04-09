import type { BodegaCatTheme } from "../themes/types";

// ─── Product Types (variation templates) ──────────────────────────────────────

export interface ProductType {
  id: string;
  name: string;
  description?: string;
  /**
   * Variation template shown in the admin UI when creating/editing a product.
   * Stored and edited using the same robust variation schema as products.
   */
  variationDefinitions: ProductVariationDefinition[];
}

// ─── Robust variation system ───────────────────────────────────────────────────

export interface ProductVariationDefinition {
  id: string;
  name: string;
  displayName: string;
  type: "independent" | "dependent";
  order: number;
  required: boolean;
  dependsOn?: string[];
  options: ProductVariationOptionDefinition[];
}

export interface ProductVariationOptionDefinition {
  id: string;
  name: string;
  displayName: string;
  priceModifier: number;
  available: boolean;
  images?: string[];
  availableFor?: {
    variationId: string;
    optionIds: string[];
  }[];
}

// Runtime variation state (UI layer)
export interface ProductVariation {
  id: string;
  name: string;
  displayName: string;
  type: "independent" | "dependent";
  order: number;
  required: boolean;
  dependsOn?: string[];
  options: ProductVariationOption[];
  isVisible: boolean;
}

export interface ProductVariationOption {
  id: string;
  name: string;
  displayName: string;
  priceModifier: number;
  available: boolean;
  images?: string[];
  isVisible: boolean;
}

// ─── Product ───────────────────────────────────────────────────────────────────

/**
 * All supported delivery types. Add new values here — the type is derived
 * automatically everywhere it's used.
 */
export const DELIVERY_TYPES = ["physical", "digital", "service", "booking"] as const;
export type DeliveryType = (typeof DELIVERY_TYPES)[number];

/**
 * All supported booking providers. Add new values here — the discriminated
 * union type is derived automatically.
 */
export const BOOKING_PROVIDERS = ["calcom", "calendly", "url"] as const;
export type BookingProvider = (typeof BOOKING_PROVIDERS)[number];

export type BookingConfig =
  | { provider: "calcom"; eventSlug: string; namespace?: string }
  | { provider: "calendly"; url: string }
  | { provider: "url"; url: string; label?: string };

export interface ProductMetadata {
  productTypeId: string;
  tags: string[];
  /**
   * When false, the product is hidden from the public storefront (still editable in admin).
   * Stored in Stripe as `bodegacat_published`. Omitted or true means visible.
   */
  publishedToStorefront?: boolean;
  category?: string;
  brand?: string;
  sku?: string;
  /** How the product is delivered. Determines which fields and UI are shown. */
  deliveryType?: DeliveryType;
  /**
   * External booking provider config. Only used when deliveryType is 'booking'.
   * The product page renders a BookingEmbed instead of the Add to Cart flow.
   */
  bookingConfig?: BookingConfig;
  /** Physical dimensions — only relevant when deliveryType is 'physical'. */
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

export interface Product {
  id: string;
  name: string;
  description: string;
  metadata: ProductMetadata;
  images: string[];
  active: boolean;
  slug: string;
  basePrice: number;
  currency: string;
  variationDefinitions: ProductVariationDefinition[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Cart ──────────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  selectedVariations: Record<string, string>;
  price: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  currency: string;
}

// ─── Site Config ───────────────────────────────────────────────────────────────

/** A link shown in the site footer navigation. */
export interface FooterLink {
  label: string;
  href: string;
}

/** A social media or external profile link. */
export interface SocialLink {
  /** Short identifier, e.g. 'instagram', 'tiktok', 'bluesky'. Displayed as label if label is not set. */
  platform: string;
  url: string;
  /** Accessible label for screen readers. Defaults to platform if omitted. */
  label?: string;
}


export interface SiteConfig {
  // ─── Identity ───────────────────────────────────────────────────────────
  name: string;
  description: string;
  logo?: string;
  favicon?: string;
  contactEmail?: string;

  // ─── Internationalization ───────────────────────────────────────────────
  /** BCP 47 locale tag, e.g. 'en-US', 'fr-FR', 'ja-JP'. Used for <html lang>, Intl formatting. */
  locale: string;
  /** ISO 4217 currency code, e.g. 'USD', 'EUR', 'JPY'. */
  currency: string;

  // ─── Customizable copy ──────────────────────────────────────────────────
  /** Tagline displayed on the shop listing page below the "Shop" heading. */
  shopTagline: string;
  /** Heading for the about section on the homepage. */
  aboutTitle: string;
  /** Body text for the about section on the homepage. */
  aboutText: string;

  // ─── Navigation & Footer ────────────────────────────────────────────────
  socialLinks: SocialLink[];
  footerLinks: FooterLink[];

  // ─── Appearance ─────────────────────────────────────────────────────────
  /**
   * Active theme. Install third-party themes via npm and set them here.
   * See src/themes/types.ts for the BodegaCatTheme interface.
   */
  theme: BodegaCatTheme;

  // ─── Product variation templates ────────────────────────────────────────
  /** Templates shown in the admin UI when creating a new product. Leave empty to start from scratch. */
  productTypes: ProductType[];

  // ─── Stripe (env-var only — never set these in admin UI) ────────────────
  stripe: {
    publishableKey: string;
    webhookSecret: string;
  };
}
