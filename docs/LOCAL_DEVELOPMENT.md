# Local development (monorepo)

How to run and test the **template app** (`apps/template`) and the **`bodegacat` integration** on your machine. Admin routes work without Cloudflare Access in dev.

> Use **pnpm** from the **repository root**. Stripe keys belong in **`apps/template/.env`**. Integration source is **`packages/bodegacat`**.

**Deploying to Cloudflare** (KV, Pages env vars, wrangler, Access): see [`examples/deploy/cloudflare-pages/README.md`](../examples/deploy/cloudflare-pages/README.md). This doc stays focused on local `astro dev` and monorepo workflows.

## Quick start

1. **Install**

   ```bash
   pnpm install
   ```

2. **Environment**

   ```bash
   cp env.example apps/template/.env
   ```

   Edit `apps/template/.env` with your Stripe test keys and, for admin dev bypass:

   ```env
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NODE_ENV=development
   ```

3. **Run**

   ```bash
   pnpm dev
   ```

   Open `http://localhost:4321`.

## Admin in development

In dev (`NODE_ENV=development` or `import.meta.env.DEV`), middleware **skips Cloudflare Access**, sets a mock user (`dev@localhost`), and shows a **Development mode** indicator on screen.

In production, `/admin/*` expects Cloudflare Access (see the deploy guide, section 6).

### Admin while testing `pnpm preview` / `wrangler dev` (built app)

`astro dev` is not the same as running the **built** Worker. To use `/admin` on **local wrangler** without Cloudflare Access:

1. Add to **`apps/template/.dev.vars`** (copy from `apps/template/dev.vars.example`):

   ```env
   BODEGACAT_ADMIN_LOCAL_BYPASS=true
   ```

   Wrangler injects this at **runtime** (keep Stripe keys here too for preview).

2. Run **`pnpm --filter @bodegacat/template preview`** (or `pnpm preview` from repo root).

3. Open **`http://localhost:8787/admin`** (or the URL wrangler prints). The bypass applies only when the request host is **loopback** (`localhost`, `127.0.0.1`, etc.) — not on a real deployed hostname.

4. Never set `BODEGACAT_ADMIN_LOCAL_BYPASS` in **production** Cloudflare env.

Useful routes:

| Path | Purpose |
|------|--------|
| `/admin` | Dashboard |
| `/admin/products` | Product list |
| `/admin/products/new` | Create product |
| `/api/admin/products` | List/create (API) |
| `/api/stripe-webhook` | Webhook endpoint |

## Storefront preview (unpublished products)

Products can be **active** in Stripe but **not published** to the public catalog (`metadata.bodegacat_published=false`). Everyone else sees only published items; **preview mode** includes drafts on `/` and `/shop`.

| Environment | How to enable |
|---------------|----------------|
| **Local dev** | Visit `/shop?preview=1` or `/?preview=1` (no Cloudflare Access required). A short-lived cookie keeps preview on as you click around. |
| **Production** | You must be logged in via **Cloudflare Access**, then open `https://yoursite/shop?preview=1` (cookie + `?preview=1` on the first visit). Use **Exit preview** in the banner or add `?preview=0` to any URL. |

The admin nav includes **Storefront preview** linking to `/shop?preview=1`. Uncheck **Published on storefront** in the product form to hide a product from the public site until you are ready.

## Stripe test data

Use the Stripe Dashboard (test mode) for products and webhooks. Required product metadata (`bodegacat_active`, `slug`, prices, etc.) is documented in **[VARIATION_SYSTEM.md](./VARIATION_SYSTEM.md)** and summarized on the repository README.

For card numbers and test mode behavior, see [Stripe testing](https://stripe.com/docs/testing).

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| Admin not loading | `NODE_ENV=development` in `.env`, `pnpm dev` from repo root, browser console |
| Stripe / empty shop | Keys match test mode, products exist with correct metadata (see VARIATION_SYSTEM) |
| Draft not on `/shop` | Expected until published or until you use `?preview=1` (see **Storefront preview** above) |
| Type / lint errors | `pnpm run typecheck`, `pnpm run lint` from repo root |

## After local testing

Staging/production, Cloudflare Access, and Stripe live mode are covered in the **[Cloudflare deploy guide](../examples/deploy/cloudflare-pages/README.md)**.

## Related links

- [Stripe Test Mode](https://stripe.com/docs/testing)
- [Astro dev toolbar](https://docs.astro.build/en/guides/dev-toolbar/)
- [Product variations & metadata](./VARIATION_SYSTEM.md)
- **Dogfooding** a separate store repo against a local `packages/bodegacat` clone: *Developing the package with a separate store app* in the [repository README](../README.md)
