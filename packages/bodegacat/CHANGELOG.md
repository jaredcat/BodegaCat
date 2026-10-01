# bodegacat

## 0.7.0

### Minor Changes

- **Catalog prices:** Saving a product stores its variation definitions on the Stripe product and creates one active Stripe Price per sellable combination. The amount is the base price plus modifiers. Checkout charges those Price ids. The browser does not send an amount. A product with no variation definitions sells as a single price.
- **Checkout:** The cart drawer and `/cart` share one Checkout Session. Payment Links and `/cart/checkout` are removed.
- **Runtime:** Admin, preview, cart, and checkout use a host runtime. This release ships the Cloudflare adapter (Workers, KV, and Access). Static pages do not import Worker bindings.
- **Storefront:** `/`, `/shop`, and `/shop/[slug]` are static HTML from the build. Redeploy when the live catalog or build-time copy should change. Staff drafts stay on `/preview`.

## 0.3.0

### Minor / patch

- **Shop:** `/shop/[slug]` is SSR on the Worker (same Stripe + KV path as `/shop`) so catalog and product URLs stay aligned. Later releases render `/`, `/shop`, and `/shop/[slug]` as static HTML (see 0.7.0).
- **Storefront preview:** `?preview=1` plus Cloudflare Access in production (or `?preview=1` in dev) to include unpublished products (`bodegacat_published` metadata); admin product form adds **Published on storefront**.
- **Local wrangler admin:** optional `BODEGACAT_ADMIN_LOCAL_BYPASS` (loopback only) for `/admin` during `wrangler dev` / built preview without Access.
- **Vite:** tighter React SSR resolution for Cloudflare dev (`react-dom/server.edge`, `ssr.noExternal` for `react` / `react-dom`).
- **Types:** `astro:env/server` stubs in package `env.d.ts` for integration consumers.

## 0.2.0

### Minor Changes

- 1564d70: Publish Bodega Cat as an Astro integration (`bodegacat`) with a pnpm monorepo: `packages/bodegacat` (routes injected via `injectRoute`, shared middleware) and `apps/template` (thin GitHub-template shell).
