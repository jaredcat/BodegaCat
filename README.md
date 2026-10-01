# Bodega Cat

**Bodega Cat** is an [Astro](https://astro.build) integration for small e-commerce sites: Stripe-backed catalog, checkout, admin UI, and Cloudflare-friendly defaults. The integration is published on npm as **`bodegacat`**. Store authors **add the dependency** to their own Astro app; you do **not** fork this repository to open a shop.

## Repository layout

| Path                                | Purpose                                                                     |
| ----------------------------------- | --------------------------------------------------------------------------- |
| `packages/bodegacat`                | npm package source (`bodegacat`): routes, components, Stripe, themes        |
| `apps/template`                     | Minimal Astro shell that consumes the package (reference / GitHub template) |
| `docs/`                             | Deeper guides (local dev, variations)                                       |
| `examples/deploy/cloudflare-pages/` | Cloudflare Pages, KV, env vars, optional Access                             |

## For store authors (consume the package)

The public shop (`/`, `/shop`, `/shop/[slug]`) is static HTML from the build. Admin, draft preview, and checkout are Cloudflare functions beside that HTML. Redeploy when the live catalog or build-time copy should change.

**Launch a shop:** copy `apps/template`, set Stripe keys, pick a built-in theme in Admin → Settings, and deploy on Cloudflare. Start with **`examples/deploy/cloudflare-pages/README.md`**.

**Change the shop:** publish a theme that implements `BodegaCatTheme`, and pass home or product-page slot files to `bodegacat({ themeSlots })`. Product-type presets live in admin. Vite aliases for `@config`, `@themes`, and `@models` go further without forking route source. Details: **`docs/THEMES.md`**.

1. Create or use an Astro app with the [Cloudflare adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/).
2. Install: `pnpm add bodegacat` (see [peer deps](https://github.com/jaredcat/BodegaCat/blob/main/packages/bodegacat/package.json) in the package manifest).
3. In `astro.config.mjs`, add `import bodegacat from "bodegacat"` and `integrations: [bodegacat()]`.
4. Configure Stripe and deploy — **`examples/deploy/cloudflare-pages/README.md`**.

Exports and types are documented in **`packages/bodegacat/README.md`**.

## Quick start (this monorepo — contributors)

```bash
pnpm install
cp env.example apps/template/.env   # add Stripe keys
pnpm dev                            # runs apps/template
```

Open `http://localhost:4321`. Integration source lives under **`packages/bodegacat/src`**.

More detail: **`docs/LOCAL_DEVELOPMENT.md`**.

## Developing the package with a separate store app (dogfooding)

If you maintain a **store repo** (e.g. astelts) next to this one, you can point it at the workspace package instead of npm to test changes in a tight loop:

```bash
# From your store app root (adjust the path if your folders differ)
pnpm add bodegacat@file:../bodegacat/packages/bodegacat
```

Switch back to the published package when you are done (use the current semver from npm):

```bash
pnpm add bodegacat
```

Avoid committing a permanent `file:` dependency in public repos unless everyone shares the same directory layout; CI clones will not have a sibling `bodegacat` checkout unless you design for that.

## Documentation

| Doc                                                                                        | Contents                                            |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| [`docs/LOCAL_DEVELOPMENT.md`](docs/LOCAL_DEVELOPMENT.md)                                   | Monorepo: run template, Stripe `.env`, admin in dev |
| [`docs/THEMES.md`](docs/THEMES.md)                                                         | Launch a shop, or replace layouts with theme slots  |
| [`docs/VARIATION_SYSTEM.md`](docs/VARIATION_SYSTEM.md)                                     | Product variations and Stripe metadata              |
| [`examples/deploy/cloudflare-pages/README.md`](examples/deploy/cloudflare-pages/README.md) | Workers, KV, Stripe env, deploy                     |

## Features (high level)

- Stripe catalog, one Checkout Session for a single item or a cart, and webhooks
- Static home, shop, and product pages, rebuilt when the catalog or copy changes
- Cloudflare functions for admin, preview, and checkout
- Built-in themes, theme slots, and product-type templates

## License

[AGPL-3.0](LICENSE). You can customize Bodega Cat. If you offer a modified copy to users, including running that copy as the shop they use, you share the source of those modifications. A separate theme package that only uses the public theme interface is your code. See [docs/THEMES.md](docs/THEMES.md).
