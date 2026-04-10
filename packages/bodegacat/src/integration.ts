import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import type { AstroIntegration, ViteUserConfig } from "astro";
import { envField } from "astro/config";
import type { ProductType } from "./types/product";

/** Directory containing this file (`packages/bodegacat/src`). */
const packageSrcDir = path.dirname(fileURLToPath(import.meta.url));

function viteAliases(): Record<string, string> {
  return {
    "@": packageSrcDir,
    "@components": path.join(packageSrcDir, "components"),
    "@layouts": path.join(packageSrcDir, "layouts"),
    "@lib": path.join(packageSrcDir, "lib"),
    "@config": path.join(packageSrcDir, "config"),
    "@models": path.join(packageSrcDir, "types"),
    "@styles": path.join(packageSrcDir, "styles"),
    "@themes": path.join(packageSrcDir, "themes"),
    "@i18n": path.join(packageSrcDir, "i18n"),
  };
}

export interface BodegaCatUserOptions {
  /** Optional theme override (reserved for future use; KV theme remains default). */
  theme?: unknown;
  /**
   * Optional dev override for default product types before KV exists.
   * Merchants should use **Admin → Product types** (KV); no code is required for normal setup.
   */
  productTypes?: ProductType[];
}

const VIRTUAL_USER_PRODUCT_TYPES = "\0virtual:bodegacat-user-product-types";
const VIRTUAL_BUILD_KV_SETTINGS = "\0virtual:bodegacat-build-kv-settings";
const VIRTUAL_BUILD_KV_META = "\0virtual:bodegacat-build-kv-meta";

function userProductTypesVitePlugin(productTypes: ProductType[] | undefined) {
  return {
    name: "bodegacat-user-product-types",
    resolveId(id: string) {
      if (id === "virtual:bodegacat-user-product-types") {
        return VIRTUAL_USER_PRODUCT_TYPES;
      }
    },
    load(id: string) {
      if (id === VIRTUAL_USER_PRODUCT_TYPES) {
        return `export default ${JSON.stringify(productTypes ?? [])};`;
      }
    },
  };
}

async function fetchBuildKvSettings(): Promise<Record<string, unknown>> {
  const enabled =
    process.env.BODEGACAT_BUILD_FETCH_KV_SETTINGS === "true" ||
    process.env.BODEGACAT_BUILD_FETCH_KV_SETTINGS === "1";
  if (!enabled) return {};

  const token =
    process.env.CLOUDFLARE_API_TOKEN ??
    process.env.BODEGACAT_CLOUDFLARE_API_TOKEN;
  const accountId =
    process.env.CLOUDFLARE_ACCOUNT_ID ??
    process.env.BODEGACAT_CLOUDFLARE_ACCOUNT_ID;
  const namespaceId =
    process.env.BODEGACAT_SETTINGS_KV_NAMESPACE_ID ??
    process.env.SETTINGS_KV_NAMESPACE_ID;

  if (!token || !accountId || !namespaceId) {
    console.warn(
      "[bodegacat] build KV fetch enabled but missing one of: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, BODEGACAT_SETTINGS_KV_NAMESPACE_ID",
    );
    return {};
  }

  const key = "site_settings";
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${key}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 404) return {};
    if (!res.ok) {
      console.warn(
        `[bodegacat] build KV fetch failed (${String(res.status)}) — continuing without KV settings`,
      );
      return {};
    }
    const text = await res.text();
    if (!text) return {};
    return JSON.parse(text) as Record<string, unknown>;
  } catch (e) {
    console.warn(
      "[bodegacat] build KV fetch error — continuing without KV settings",
      e,
    );
    return {};
  }
}

function getBuildKvMeta(): {
  enabled: boolean;
  hasToken: boolean;
  hasAccountId: boolean;
  hasNamespaceId: boolean;
  configured: boolean;
} {
  const enabled =
    process.env.BODEGACAT_BUILD_FETCH_KV_SETTINGS === "true" ||
    process.env.BODEGACAT_BUILD_FETCH_KV_SETTINGS === "1";
  const hasToken = Boolean(
    process.env.CLOUDFLARE_API_TOKEN ??
    process.env.BODEGACAT_CLOUDFLARE_API_TOKEN,
  );
  const hasAccountId = Boolean(
    process.env.CLOUDFLARE_ACCOUNT_ID ??
    process.env.BODEGACAT_CLOUDFLARE_ACCOUNT_ID,
  );
  const hasNamespaceId = Boolean(
    process.env.BODEGACAT_SETTINGS_KV_NAMESPACE_ID ??
    process.env.SETTINGS_KV_NAMESPACE_ID,
  );
  return {
    enabled,
    hasToken,
    hasAccountId,
    hasNamespaceId,
    configured: enabled && hasToken && hasAccountId && hasNamespaceId,
  };
}

function buildKvSettingsVitePlugin() {
  let cached: Record<string, unknown> | undefined;
  let inflight: Promise<Record<string, unknown>> | undefined;
  return {
    name: "bodegacat-build-kv-settings",
    resolveId(id: string) {
      if (id === "virtual:bodegacat-build-kv-settings") {
        return VIRTUAL_BUILD_KV_SETTINGS;
      }
      if (id === "virtual:bodegacat-build-kv-meta") {
        return VIRTUAL_BUILD_KV_META;
      }
    },
    async load(id: string) {
      if (id === VIRTUAL_BUILD_KV_META) {
        return `export default ${JSON.stringify(getBuildKvMeta())};`;
      }
      if (id !== VIRTUAL_BUILD_KV_SETTINGS) return;
      if (cached !== undefined) {
        return `export default ${JSON.stringify(cached)};`;
      }
      inflight ??= fetchBuildKvSettings();
      cached = await inflight;
      return `export default ${JSON.stringify(cached)};`;
    },
  };
}

function routeEntry(pathFromIntegration: string): URL {
  return new URL(pathFromIntegration, import.meta.url);
}

export default function bodegacat(
  options?: BodegaCatUserOptions,
): AstroIntegration {
  return {
    name: "bodegacat",
    hooks: {
      "astro:config:setup": ({ injectRoute, addMiddleware, updateConfig }) => {
        addMiddleware({
          entrypoint: routeEntry("./middleware.ts"),
          order: "pre",
        });

        updateConfig({
          integrations: [
            react({
              experimentalReactChildren: true,
            }),
          ],
          image: {
            domains: ["files.stripe.com"],
          },
          vite: {
            // Vite is duplicated in the dependency tree; Plugin types from different copies are incompatible.
            // Cast via `unknown` to avoid `any` while still allowing the config assignment.
            plugins: [
              userProductTypesVitePlugin(options?.productTypes),
              buildKvSettingsVitePlugin(),
              tailwindcss(),
            ] as unknown as NonNullable<ViteUserConfig["plugins"]>,
            define: {
              global: "globalThis",
            },
            resolve: {
              // One React instance for app + injected package routes (pnpm can nest copies otherwise).
              dedupe: ["react", "react-dom"],
              alias: {
                ...viteAliases(),
                // Cloudflare adapter runs SSR in workerd/miniflare for `astro dev` and production.
                // Use the edge entry for both — dev-only Node `react-dom/server` + dep prebundles
                // can otherwise produce duplicate React / invalid hook calls during SSR.
                "react-dom/server": "react-dom/server.edge",
              },
            },
            ssr: {
              noExternal: [
                // Single React for SSR (avoids invalid hook calls when deps_ssr prebundles a second copy).
                "react",
                "react-dom",
                // Workspace integration: bundle with the app so Vite does not split a second React.
                "bodegacat",
                "@nanostores/react",
                "@heroicons/react",
                "@stripe/react-stripe-js",
              ],
            },
            // Reduces races where dep optimization reload references a deleted chunk-*.js.
            optimizeDeps: {
              holdUntilCrawlEnd: true,
              include: ["react", "react-dom"],
            },
          },
          output: "server",
          build: {
            assets: "_astro",
          },
          env: {
            schema: {
              STRIPE_SECRET_KEY: envField.string({
                context: "server",
                access: "secret",
              }),
              STRIPE_WEBHOOK_SECRET: envField.string({
                context: "server",
                access: "secret",
              }),
              BUILD_HOOK_URL: envField.string({
                context: "server",
                access: "secret",
                optional: true,
              }),
              /**
               * When `true` or `1`, Stripe product/price webhook events call `BUILD_HOOK_URL`.
               * Omit or set to `false` to avoid a production deploy on every Stripe save — use
               * **Deploy live site** in admin when ready instead.
               */
              STRIPE_WEBHOOK_AUTO_DEPLOY: envField.string({
                context: "server",
                access: "secret",
                optional: true,
              }),
              /**
               * When `true` or `1`, allow `/admin` without Cloudflare Access **only** on loopback
               * (localhost / 127.0.0.1). For `wrangler dev` / built preview. Never set in production.
               */
              BODEGACAT_ADMIN_LOCAL_BYPASS: envField.string({
                context: "server",
                access: "secret",
                optional: true,
              }),
              STRIPE_PUBLISHABLE_KEY: envField.string({
                context: "client",
                access: "public",
              }),
              STRIPE_API_VERSION: envField.string({
                context: "client",
                access: "public",
                default: "2026-03-25.dahlia",
              }),
            },
          },
        });

        const routes: [string, URL][] = [
          ["/", routeEntry("./routes/index.astro")],
          ["/shop", routeEntry("./routes/shop/index.astro")],
          ["/shop/[slug]", routeEntry("./routes/shop/[slug].astro")],
          ["/preview", routeEntry("./routes/preview/index.astro")],
          ["/preview/shop", routeEntry("./routes/preview/shop/index.astro")],
          [
            "/preview/shop/[slug]",
            routeEntry("./routes/preview/shop/[slug].astro"),
          ],
          ["/cart", routeEntry("./routes/cart.astro")],
          ["/cart/checkout", routeEntry("./routes/cart/checkout.astro")],
          ["/success", routeEntry("./routes/success.astro")],
          ["/admin", routeEntry("./routes/admin/index.astro")],
          ["/admin/settings", routeEntry("./routes/admin/settings.astro")],
          [
            "/admin/product-types",
            routeEntry("./routes/admin/product-types.astro"),
          ],
          [
            "/admin/products",
            routeEntry("./routes/admin/products/index.astro"),
          ],
          [
            "/admin/products/new",
            routeEntry("./routes/admin/products/new.astro"),
          ],
          [
            "/admin/products/[id]",
            routeEntry("./routes/admin/products/[id].astro"),
          ],
          [
            "/api/create-checkout-session",
            routeEntry("./routes/api/create-checkout-session.ts"),
          ],
          ["/api/stripe-webhook", routeEntry("./routes/api/stripe-webhook.ts")],
          ["/api/admin/products", routeEntry("./routes/api/admin/products.ts")],
          ["/api/admin/settings", routeEntry("./routes/api/admin/settings.ts")],
          [
            "/api/admin/trigger-deploy",
            routeEntry("./routes/api/admin/trigger-deploy.ts"),
          ],
        ];

        for (const [pattern, entrypoint] of routes) {
          injectRoute({ pattern, entrypoint });
        }
      },
    },
  };
}
