import type Stripe from "stripe";
import type { BodegaCatTheme } from "../themes/types";

// ─── Product Types (variation templates) ──────────────────────────────────────

export interface ProductType {
  id: string;
  name: string;
  description?: string;
  // Legacy variation system used by the ProductType template UI.
  // New products should use ProductVariationDefinition[] instead.
  variations: VariationConfig[];
}

/** @legacy Use ProductVariationDefinition for new product variations. */
export interface VariationConfig {
  id: string;
  name: string;
  type: "select" | "radio" | "checkbox";
  required: boolean;
  options: VariationOption[];
}

/** @legacy Use ProductVariationOptionDefinition for new variation options. */
export interface VariationOption {
  id: string;
  name: string;
  priceModifier: number;
  enabled: boolean;
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

export interface ProductMetadata {
  productTypeId: string;
  tags: string[];
  category?: string;
  brand?: string;
  sku?: string;
  /** How the product is delivered. Determines which fields and UI are shown. */
  deliveryType?: "physical" | "digital" | "service";
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
  stripeProductId?: string;
  stripePriceId?: string;
  prices?: Stripe.Price[];
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
