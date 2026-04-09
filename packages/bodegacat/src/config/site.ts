import { STRIPE_PUBLISHABLE_KEY } from "astro:env/client";
import { STRIPE_WEBHOOK_SECRET } from "astro:env/server";
import { bodegaCatTheme } from "../themes/bodegacat";
import type { BodegaCatTheme } from "../themes/types";
import type {
  EditableSettings,
  KVNamespace,
} from "../lib/settings";
import { getStoredSettings } from "../lib/settings";
import type { ProductType, SiteConfig } from "../types/product";

// ─── Example variation templates ──────────────────────────────────────────────
// These are starting-point templates shown in the admin UI when creating a product.
// They are NOT applied automatically. Rename/replace/remove them to suit your store.
// An empty array means admins start from a blank variation sheet.

export const exampleProductTypes: ProductType[] = [
  {
    id: "clothing",
    name: "Clothing",
    description: "Apparel and accessories",
    variationDefinitions: [
      {
        id: "size",
        name: "size",
        displayName: "Size",
        type: "independent",
        order: 1,
        required: true,
        options: [
          { id: "xs", name: "xs", displayName: "XS", priceModifier: 0, available: true },
          { id: "s", name: "s", displayName: "S", priceModifier: 0, available: true },
          { id: "m", name: "m", displayName: "M", priceModifier: 0, available: true },
          { id: "l", name: "l", displayName: "L", priceModifier: 0, available: true },
          { id: "xl", name: "xl", displayName: "XL", priceModifier: 200, available: true },
          { id: "xxl", name: "xxl", displayName: "XXL", priceModifier: 400, available: true },
        ],
      },
      {
        id: "color",
        name: "color",
        displayName: "Color",
        type: "independent",
        order: 2,
        required: true,
        options: [
          { id: "black", name: "black", displayName: "Black", priceModifier: 0, available: true },
          { id: "white", name: "white", displayName: "White", priceModifier: 0, available: true },
          { id: "navy", name: "navy", displayName: "Navy", priceModifier: 0, available: true },
          { id: "gray", name: "gray", displayName: "Gray", priceModifier: 0, available: true },
        ],
      },
    ],
  },
  {
    id: "prints",
    name: "Prints",
    description: "Art prints and posters",
    variationDefinitions: [
      {
        id: "size",
        name: "size",
        displayName: "Size",
        type: "independent",
        order: 1,
        required: true,
        options: [
          { id: "8x10", name: "8x10", displayName: '8" x 10"', priceModifier: 0, available: true },
          { id: "11x14", name: "11x14", displayName: '11" x 14"', priceModifier: 500, available: true },
          { id: "16x20", name: "16x20", displayName: '16" x 20"', priceModifier: 1500, available: true },
          { id: "24x36", name: "24x36", displayName: '24" x 36"', priceModifier: 2500, available: true },
        ],
      },
      {
        id: "material",
        name: "material",
        displayName: "Material",
        type: "independent",
        order: 2,
        required: true,
        options: [
          { id: "paper", name: "paper", displayName: "Paper", priceModifier: 0, available: true },
          { id: "canvas", name: "canvas", displayName: "Canvas", priceModifier: 1000, available: true },
          { id: "vinyl", name: "vinyl", displayName: "Vinyl", priceModifier: 500, available: true },
        ],
      },
    ],
  },
  {
    id: "digital",
    name: "Digital",
    description: "Digital downloads",
    variationDefinitions: [],
  },
];

// ─── Default site configuration ───────────────────────────────────────────────
// These values are used when no environment variable or KV override exists.
// Override any of these using environment variables (SITE_NAME, etc.) or the
// admin settings UI (stored in Cloudflare KV).

export const defaultSiteConfig: SiteConfig = {
  name: "My Store",
  description: "Your friendly neighborhood store",
  logo: "/logo.png",
  favicon: "/favicon.ico",
  contactEmail: undefined,

  locale: "en-US",
  currency: "USD",

  shopTagline: "Discover our collection of products",
  aboutTitle: "About Us",
  aboutText:
    "Welcome to our store. We're passionate about bringing you quality products.",

  socialLinks: [],
  footerLinks: [
    { label: "Shop", href: "/shop" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],

  theme: bodegaCatTheme,

  // Ship empty by default. Add to exampleProductTypes and import here if you
  // want pre-built variation templates available in the admin UI.
  productTypes: [],

  stripe: {
    publishableKey: STRIPE_PUBLISHABLE_KEY,
    webhookSecret: STRIPE_WEBHOOK_SECRET,
  },
};

// ─── Config loading ────────────────────────────────────────────────────────────

/**
 * Returns the base site config, merging environment variable overrides over
 * the coded defaults. This is synchronous and safe to use in statically
 * prerendered pages (no KV access).
 *
 * For dynamic pages that should pick up admin UI changes, use
 * getEffectiveConfig(kv) instead.
 */
export function getSiteConfig(): SiteConfig {
  const config = { ...defaultSiteConfig };

  // Environment variable overrides (optional — set these in .env or Cloudflare dashboard)
  if (process.env.SITE_NAME) config.name = process.env.SITE_NAME;
  if (process.env.SITE_DESCRIPTION) config.description = process.env.SITE_DESCRIPTION;
  if (process.env.SITE_LOGO) config.logo = process.env.SITE_LOGO;
  if (process.env.SITE_FAVICON) config.favicon = process.env.SITE_FAVICON;
  if (process.env.SITE_LOCALE) config.locale = process.env.SITE_LOCALE;
  if (process.env.SITE_CURRENCY) config.currency = process.env.SITE_CURRENCY;
  if (process.env.SITE_CONTACT_EMAIL) config.contactEmail = process.env.SITE_CONTACT_EMAIL;

  // Theme color overrides via environment variables
  const primaryColor = process.env.SITE_PRIMARY_COLOR;
  const secondaryColor = process.env.SITE_SECONDARY_COLOR;
  const accentColor = process.env.SITE_ACCENT_COLOR;
  if (primaryColor || secondaryColor || accentColor) {
    config.theme = {
      ...config.theme,
      variables: {
        ...config.theme.variables,
        ...(primaryColor ? { '--color-primary': primaryColor } : {}),
        ...(secondaryColor ? { '--color-secondary': secondaryColor } : {}),
        ...(accentColor ? { '--color-accent': accentColor } : {}),
      },
    };
  }

  return config;
}

/**
 * Returns the site config with Cloudflare KV overrides merged on top.
 * Use this in dynamic (SSR) pages so admin UI changes take effect immediately
 * without requiring a redeploy.
 *
 * For routes that cannot access KV (e.g. rare static-only pages), use getSiteConfig().
 *
 * @param kv - The SETTINGS_KV binding from Astro.locals.runtime.env
 */
export async function getEffectiveConfig(
  kv: KVNamespace | undefined,
): Promise<SiteConfig> {
  const base = getSiteConfig();
  const overrides: EditableSettings = await getStoredSettings(kv);
  return mergeSettings(base, overrides);
}

function mergeSettings(base: SiteConfig, overrides: EditableSettings): SiteConfig {
  const merged = { ...base };

  if (overrides.name !== undefined) merged.name = overrides.name;
  if (overrides.description !== undefined) merged.description = overrides.description;
  if (overrides.logo !== undefined) merged.logo = overrides.logo;
  if (overrides.favicon !== undefined) merged.favicon = overrides.favicon;
  if (overrides.locale !== undefined) merged.locale = overrides.locale;
  if (overrides.currency !== undefined) merged.currency = overrides.currency;
  if (overrides.shopTagline !== undefined) merged.shopTagline = overrides.shopTagline;
  if (overrides.aboutTitle !== undefined) merged.aboutTitle = overrides.aboutTitle;
  if (overrides.aboutText !== undefined) merged.aboutText = overrides.aboutText;
  if (overrides.contactEmail !== undefined) merged.contactEmail = overrides.contactEmail;
  if (overrides.socialLinks !== undefined) merged.socialLinks = overrides.socialLinks;
  if (overrides.footerLinks !== undefined) merged.footerLinks = overrides.footerLinks;
  if (overrides.theme !== undefined) {
    merged.theme = {
      ...base.theme,
      ...overrides.theme,
      variables: {
        ...base.theme.variables,
        ...overrides.theme.variables,
      },
    };
  }

  return merged;
}

// ─── Theme helpers ─────────────────────────────────────────────────────────────

/**
 * Returns a BodegaCatTheme with specific color overrides applied.
 * Useful for quick customization without creating a full theme package.
 */
export function customizeTheme(
  base: BodegaCatTheme,
  overrides: Partial<BodegaCatTheme["variables"]>,
): BodegaCatTheme {
  // Filter undefined values so Partial<ThemeVariables> doesn't produce string | undefined
  const definedOverrides = Object.fromEntries(
    Object.entries(overrides).filter(([, v]) => v !== undefined),
  ) as unknown as BodegaCatTheme["variables"];
  return {
    ...base,
    variables: { ...base.variables, ...definedOverrides },
  };
}
