import { STRIPE_PUBLISHABLE_KEY } from "astro:env/client";
import { STRIPE_WEBHOOK_SECRET } from "astro:env/server";
import userProductTypesFromIntegration from "virtual:bodegacat-user-product-types";
import type { EditableSettings, KVNamespace } from "../lib/settings";
import { getStoredSettings } from "../lib/settings";
import { bodegaCatTheme } from "../themes/bodegacat";
import type { BodegaCatTheme } from "../themes/types";
import type { SiteConfig } from "../types/product";
import { exampleProductTypes } from "./exampleProductTypes";

export { exampleProductTypes };

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

  /** Starter templates; merchants edit in Admin → Product types (KV). Optional integration override replaces this until KV is saved. */
  productTypes: exampleProductTypes,

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
  const config: SiteConfig = structuredClone(defaultSiteConfig);

  if (userProductTypesFromIntegration.length > 0) {
    config.productTypes = structuredClone(userProductTypesFromIntegration);
  }

  // Environment variable overrides (optional — set these in .env or Cloudflare dashboard)
  if (process.env.SITE_NAME) config.name = process.env.SITE_NAME;
  if (process.env.SITE_DESCRIPTION)
    config.description = process.env.SITE_DESCRIPTION;
  if (process.env.SITE_LOGO) config.logo = process.env.SITE_LOGO;
  if (process.env.SITE_FAVICON) config.favicon = process.env.SITE_FAVICON;
  if (process.env.SITE_LOCALE) config.locale = process.env.SITE_LOCALE;
  if (process.env.SITE_CURRENCY) config.currency = process.env.SITE_CURRENCY;
  if (process.env.SITE_CONTACT_EMAIL)
    config.contactEmail = process.env.SITE_CONTACT_EMAIL;

  // Theme color overrides via environment variables
  const primaryColor = process.env.SITE_PRIMARY_COLOR;
  const secondaryColor = process.env.SITE_SECONDARY_COLOR;
  const accentColor = process.env.SITE_ACCENT_COLOR;
  if (primaryColor || secondaryColor || accentColor) {
    config.theme = {
      ...config.theme,
      variables: {
        ...config.theme.variables,
        ...(primaryColor ? { "--color-primary": primaryColor } : {}),
        ...(secondaryColor ? { "--color-secondary": secondaryColor } : {}),
        ...(accentColor ? { "--color-accent": accentColor } : {}),
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
 * For routes that cannot access KV (e.g. static-only adapters), use getSiteConfig().
 *
 * @param kv - The SETTINGS_KV binding from `cloudflare:workers` env
 */
export async function getEffectiveConfig(
  kv: KVNamespace | undefined,
): Promise<SiteConfig> {
  const base = getSiteConfig();
  const overrides: EditableSettings = await getStoredSettings(kv);
  return mergeSettings(base, overrides);
}

function mergeSettings(
  base: SiteConfig,
  overrides: EditableSettings,
): SiteConfig {
  const merged = { ...base };

  if (overrides.name !== undefined) merged.name = overrides.name;
  if (overrides.description !== undefined)
    merged.description = overrides.description;
  if (overrides.logo !== undefined) merged.logo = overrides.logo;
  if (overrides.favicon !== undefined) merged.favicon = overrides.favicon;
  if (overrides.locale !== undefined) merged.locale = overrides.locale;
  if (overrides.currency !== undefined) merged.currency = overrides.currency;
  if (overrides.shopTagline !== undefined)
    merged.shopTagline = overrides.shopTagline;
  if (overrides.aboutTitle !== undefined)
    merged.aboutTitle = overrides.aboutTitle;
  if (overrides.aboutText !== undefined) merged.aboutText = overrides.aboutText;
  if (overrides.contactEmail !== undefined)
    merged.contactEmail = overrides.contactEmail;
  if (overrides.socialLinks !== undefined)
    merged.socialLinks = overrides.socialLinks;
  if (overrides.footerLinks !== undefined)
    merged.footerLinks = overrides.footerLinks;
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
  if (overrides.productTypes !== undefined) {
    merged.productTypes = structuredClone(overrides.productTypes);
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
