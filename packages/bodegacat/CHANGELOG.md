# bodegacat

## 0.3.0

### Minor / patch

- **Shop:** `/shop/[slug]` is SSR on the Worker (same Stripe + KV path as `/shop`) so catalog and product URLs stay aligned.
- **Storefront preview:** `?preview=1` plus Cloudflare Access in production (or `?preview=1` in dev) to include unpublished products (`bodegacat_published` metadata); admin product form adds **Published on storefront**.
- **Local wrangler admin:** optional `BODEGACAT_ADMIN_LOCAL_BYPASS` (loopback only) for `/admin` during `wrangler dev` / built preview without Access.
- **Vite:** tighter React SSR resolution for Cloudflare dev (`react-dom/server.edge`, `ssr.noExternal` for `react` / `react-dom`).
- **Types:** `astro:env/server` stubs in package `env.d.ts` for integration consumers.

## 0.2.0

### Minor Changes

- 1564d70: Publish Bodega Cat as an Astro integration (`bodegacat`) with a pnpm monorepo: `packages/bodegacat` (routes injected via `injectRoute`, shared middleware) and `apps/template` (thin GitHub-template shell).
