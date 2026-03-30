import type { BodegaCatTheme } from '../themes/types';
import type { FooterLink, SocialLink } from '../types/product';

const SETTINGS_KEY = 'site_settings';

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
  shopTagline?: string;
  aboutTitle?: string;
  aboutText?: string;
  contactEmail?: string;
  socialLinks?: SocialLink[];
  footerLinks?: FooterLink[];
  theme?: BodegaCatTheme;
}

export interface KVNamespace {
  get(key: string, type: 'json'): Promise<unknown>;
  put(key: string, value: string): Promise<void>;
}

/**
 * Read stored settings from KV. Returns an empty object if KV is not
 * configured or the key doesn't exist yet.
 */
export async function getStoredSettings(
  kv: KVNamespace | undefined,
): Promise<EditableSettings> {
  if (!kv) {
    try {
      const raw = getDevStore().get(SETTINGS_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as unknown;
      return parsed as EditableSettings;
    } catch {
      return {};
    }
  }
  try {
    const raw = await kv.get(SETTINGS_KEY, 'json');
    return raw as EditableSettings;
  } catch {
    return {};
  }
}

/**
 * Persist settings to KV. Only stores fields that are actually provided.
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

  await kv.put(SETTINGS_KEY, next);
}
