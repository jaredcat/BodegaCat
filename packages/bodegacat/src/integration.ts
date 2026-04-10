import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import type { AstroIntegration } from "astro";
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

function routeEntry(pathFromIntegration: string): URL {
  return new URL(pathFromIntegration, import.meta.url);
}

export default function bodegacat(
  options?: BodegaCatUserOptions,
): AstroIntegration {
  return {
    name: "bodegacat",
    hooks: {
      "astro:config:setup": ({
        injectRoute,
        addMiddleware,
        updateConfig,
      }) => {
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Vite types differ when multiple copies are hoisted
            plugins: [
              userProductTypesVitePlugin(options?.productTypes),
              tailwindcss(),
            ] as any,
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
          ["/admin/products", routeEntry("./routes/admin/products/index.astro")],
          ["/admin/products/new", routeEntry("./routes/admin/products/new.astro")],
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
          [
            "/api/admin/settings",
            routeEntry("./routes/api/admin/settings.ts"),
          ],
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
