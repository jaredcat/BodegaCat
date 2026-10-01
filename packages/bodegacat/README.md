# bodegacat

Astro integration for Bodega Cat e-commerce (Stripe + Cloudflare). **Store authors install this package** in their own Astro app; see the **[repository README](https://github.com/jaredcat/BodegaCat#readme)** for how the monorepo is laid out, consumer quick start, and **developing the package against a separate store app (dogfooding)**.

The public shop is static HTML. Admin, preview, and checkout are Cloudflare functions. Deploying: **`examples/deploy/cloudflare-pages/README.md`**. Themes: **`docs/THEMES.md`** in the source repo.

This package is **AGPL-3.0**. You can customize it. If you offer a modified copy to users, you share the source of those modifications. A theme package that only implements the public `BodegaCatTheme` interface is your code.

## Public exports

Subpaths are declared in `package.json` `exports` so you can import types and helpers without copying source:

- `import type { BodegaCatTheme } from "bodegacat/themes"` — built-in theme registry + types
- `import type { BodegaCatTheme } from "bodegacat/themes/types"` — theme interface and slot types
- `import type { SiteConfig, … } from "bodegacat/types/product"` — product/site types
- `import { getEffectiveConfig } from "bodegacat/config/site"` — advanced; dynamic pages pass the host settings store

Use **`moduleResolution`: `"bundler"`** or **`Node16`/`NodeNext`** in the consuming `tsconfig` so these resolve.

Pass layout files with `bodegacat({ themeSlots })`, keyed by theme id. A home slot replaces the default home body. A product extra slot renders under the buy box. CSS variables stay on the theme object.

You can override integration paths (for example `@config`, `@themes`, `@models`) via **Vite `resolve.alias`**. Routes use these aliases so overrides apply without forking route source. (`@models/*` maps to `src/types/*` — the name **`@types`** is avoided because it clashes with DefinitelyTyped’s `@types/*` scope.)
