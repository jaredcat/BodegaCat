/// <reference types="astro/client" />

/**
 * Mirrors `astro:env` output for the schema defined in `integration.ts`.
 * The consuming app also generates `.astro/env.d.ts`; these declarations let
 * the package typecheck before/with that file.
 */
declare module "astro:env/client" {
  export const STRIPE_PUBLISHABLE_KEY: string;
  export const STRIPE_API_VERSION: string;
}

declare module "astro:env/server" {
  export const STRIPE_SECRET_KEY: string;
  export const STRIPE_WEBHOOK_SECRET: string;
  export const BUILD_HOOK_URL: string | undefined;
  export const BODEGACAT_ADMIN_LOCAL_BYPASS: string | undefined;
}

declare module "cloudflare:workers" {
  const env: {
    SETTINGS_KV?: CloudflareKVNamespace;
    SESSION?: CloudflareKVNamespace;
  };
  export { env };
}

interface ImportMetaEnv {
  readonly STRIPE_SECRET_KEY: string;
  readonly STRIPE_PUBLISHABLE_KEY: string;
  readonly STRIPE_WEBHOOK_SECRET: string;
  readonly BODEGACAT_ADMIN_LOCAL_BYPASS?: string;
  readonly SITE_NAME?: string;
  readonly SITE_DESCRIPTION?: string;
  readonly SITE_LOGO?: string;
  readonly SITE_FAVICON?: string;
  readonly SITE_LOCALE?: string;
  readonly SITE_CURRENCY?: string;
  readonly SITE_CONTACT_EMAIL?: string;
  readonly SITE_PRIMARY_COLOR?: string;
  readonly SITE_SECONDARY_COLOR?: string;
  readonly SITE_ACCENT_COLOR?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Minimal typing for Cloudflare KV namespaces available in the Worker runtime. */
interface CloudflareKVNamespace {
  get(key: string, type: 'json'): Promise<unknown>;
  get(key: string, type?: 'text'): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

declare namespace App {
  interface Locals {
    user?: {
      email: string;
      jwt: string;
      isDevelopment?: boolean;
      /** Mock admin via BODEGACAT_ADMIN_LOCAL_BYPASS on localhost wrangler preview */
      localPreviewBypass?: boolean;
    };
    /**
     * True on `/preview/*` draft storefront routes (SSR, staff-only).
     * Public `/` and `/shop` are prerendered with published products only.
     */
    storefrontPreview?: boolean;
  }
}
