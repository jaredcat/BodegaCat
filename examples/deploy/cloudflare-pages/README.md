# Set up a Bodega Cat store on Cloudflare

This guide is for a **standalone store app** that depends on **`bodegacat`** from npm (same shape as `apps/template` in the bodegacat monorepo). You deploy with **Cloudflare Pages** (recommended) or **`wrangler`**; no GitHub Actions are required.

**Monorepo contributors** testing `apps/template` locally (`pnpm dev`, admin without Access, `.env` location): see **`docs/LOCAL_DEVELOPMENT.md`** in the bodegacat repository — not repeated here.

## 1. Create the app

- Add dependencies: `astro`, `@astrojs/cloudflare`, `@astrojs/react`, `react`, `react-dom`, and **`bodegacat`**.
- In `astro.config.mjs`, use the Cloudflare adapter and **`bodegacat()`** as in the template.
- Add a minimal `src/env.d.ts` if you need `App.Locals` / `cloudflare:workers` typings (copy from the template).

## 2. Wrangler and KV

- Add **`wrangler.toml`** at your app root. Copy and edit **`apps/template/wrangler.toml`** from the bodegacat source tree (adjust `name`, KV ids).
- Create KV namespaces, e.g. `wrangler kv namespace create SETTINGS_KV`, and paste **id** / **preview_id** into `wrangler.toml`.
- Bindings must include at least **`SETTINGS_KV`** (and **`SESSION`** if you use the integration’s session features).

## 3. Environment variables and secrets

The integration defines an Astro **env schema** (Stripe keys, optional build hook). Set these everywhere you run **`astro build`** and in the **Worker/Pages** runtime:

| Purpose | Notes |
|--------|--------|
| `STRIPE_PUBLISHABLE_KEY` | Client + build |
| `STRIPE_SECRET_KEY` | Server + build (bundled); **runtime** required for `/shop` and `/shop/[slug]` (SSR) |
| `STRIPE_WEBHOOK_SECRET` | Server webhook route |
| Optional `BUILD_HOOK_URL` | If you trigger rebuilds from Stripe |

In **Pages → Settings → Environment variables**, add the same names for **Production** (and **Preview** if needed). Mark secrets as **encrypted**.

## 4. Deploy with Cloudflare Pages (Git)

1. Push your app to GitHub/GitLab.
2. **Workers & Pages → Create → Connect to Git** and select the repo.
3. **Build command:** `pnpm run build` or `npm run build` (install command `pnpm install` / `npm ci` as usual).
4. **Build output directory:** `dist` (default for Astro + Cloudflare adapter at app root).
5. If the app lives in a **monorepo subfolder**, set **Root directory** to that folder so `dist` is relative to it.
6. Add the same **environment variables** as in section 3.

Cloudflare builds and deploys; SSR runs on Pages’ Workers integration.

## 5. Deploy from your machine (wrangler)

```bash
pnpm install
pnpm run build
pnpm exec wrangler pages deploy ./dist --project-name=YOUR_PAGES_PROJECT_NAME
```

Use a **Pages API token** or `wrangler login`. Match **vars/secrets** to production so build and Worker runtime match CI.

## 6. Admin routes and Cloudflare Access (optional)

`/admin/*` expects **Cloudflare Access** in production (see `middleware` in the package). Configure Access for your zone or use the dashboard patterns in the template `wrangler.toml` comments.

## 7. Local preview

- **Dev server:** `pnpm dev` / `astro dev` in your app (see **`docs/LOCAL_DEVELOPMENT.md`** if you use the monorepo template).
- **Production-shaped preview:** `pnpm run build`, then `wrangler dev` / `wrangler pages dev` against the built **`dist`** (see `preview` in `apps/template/package.json`). Wrangler reads **secrets from `.dev.vars`**, not `.env`, unless your app copies them — match production Workers.

---

For a minimal file layout, mirror **`apps/template`** in the bodegacat repository.

## 8. Troubleshooting: `sharp` fails during `pnpm install`

Astro’s **Cloudflare adapter** with **`imageService: "compile"`** (as in the template) pulls **`sharp`**, which runs an **install script** (native binaries or a **node-gyp** build). If install fails with *“Attempting to build from source”* / *“Please add node-addon-api”*:

1. **Use an active Node LTS** (20 or 22) — odd Node versions often lack prebuilt `sharp` binaries.
2. **macOS:** Install system libs so a source build can succeed:
   ```bash
   xcode-select --install   # if Command Line Tools are missing
   brew install vips
   ```
3. **Satisfy the error message:** add the helper once, then reinstall:
   ```bash
   pnpm add -D node-addon-api
   rm -rf node_modules && pnpm install
   ```
4. **pnpm** may block install scripts until approved — allow `sharp` (and friends) when prompted, or see [pnpm approve-builds](https://pnpm.io/cli/approve-builds).
5. **Optional:** if you don’t need compile-time image processing, in **your** `astro.config.mjs` you can try `adapter: cloudflare({ imageService: "passthrough" })` instead of `"compile"` to avoid the `sharp` path (verify [Astro + Cloudflare image docs](https://docs.astro.build/en/guides/images/) for your version).

`npm warn Unknown env config …` lines during `sharp`’s script usually come from **extra `NPM_CONFIG_*` environment variables** in your shell or tooling; they’re noisy but unrelated to the failure — fix the items above first.

