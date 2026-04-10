import type { BodegaCatTheme } from "../themes/types";
import type { FooterLink, ProductType, SocialLink } from "../types/product";

const SETTINGS_KEY = "site_settings";

// In-memory fallback used when KV is not available (e.g. `astro dev`).
// Resets on server restart, but lets the admin UI work locally.
function getDevStore(): Map<string, string> {
  const g = globalThis as unknown as {
    __bodegacat_settings_dev_store__?: Map<string, string>;
  };
  g.__bodegacat_settings_dev_store__ ??= new Map<string, string>();
  return g.__bodegacat_settings_dev_store__;
}

/**
 * The subset of SiteConfig that can be changed at runtime via the admin UI
 * and persisted to Cloudflare KV. Stripe keys and other secrets are
 * intentionally excluded — those are always managed via environment variables.
 */
export interface EditableSettings {
  name?: string;
  description?: string;
  logo?: string;
  favicon?: string;
  locale?: string;
  currency?: string;
  homeHeadline?: string;
  shopTagline?: string;
  aboutTitle?: string;
  aboutText?: string;
  contactEmail?: string;
  socialLinks?: SocialLink[];
  footerLinks?: FooterLink[];
  theme?: BodegaCatTheme;
  /** Variation templates for the product editor; stored in KV. Replaces the merged list when set. */
  productTypes?: ProductType[];
}

export interface KVNamespace {
  // Cloudflare KV returns `unknown` (and `null` when key is missing).
  // Keep this broad so the real `CloudflareKVNamespace` binding is assignable.
  get(key: string, type: "json"): Promise<unknown>;
  put(key: string, value: string): Promise<void>;
}

function getFromDevStore(): EditableSettings {
  try {
    const raw = getDevStore().get(SETTINGS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as EditableSettings;
  } catch {
    return {};
  }
}

/**
 * Read stored settings from KV. Returns an empty object if KV is not
 * configured or the key doesn't exist yet.
 * Falls back to the in-memory dev store when KV is absent or fails
 * (e.g. placeholder IDs in wrangler.toml during local dev).
 */
export async function getStoredSettings(
  kv: KVNamespace | undefined,
): Promise<EditableSettings> {
  if (!kv) return getFromDevStore();
  try {
    const raw = await kv.get(SETTINGS_KEY, "json");
    if (!raw || typeof raw !== "object") return {};
    return raw as EditableSettings;
  } catch {
    // KV unavailable (e.g. placeholder namespace IDs in dev) — use in-memory store
    return getFromDevStore();
  }
}

/**
 * Persist settings to KV. Only stores fields that are actually provided.
 * Falls back to the in-memory dev store when KV is absent or fails.
 */
export async function saveSettings(
  kv: KVNamespace | undefined,
  settings: EditableSettings,
): Promise<void> {
  // Merge with existing settings so a partial save doesn't wipe other fields
  const existing = await getStoredSettings(kv);
  const next = JSON.stringify({ ...existing, ...settings });

  if (!kv) {
    getDevStore().set(SETTINGS_KEY, next);
    return;
  }

  try {
    await kv.put(SETTINGS_KEY, next);
  } catch {
    // KV unavailable — persist to in-memory dev store as fallback
    getDevStore().set(SETTINGS_KEY, next);
  }
}
