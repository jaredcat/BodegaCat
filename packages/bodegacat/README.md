# bodegacat

Astro integration for Bodega Cat e-commerce (Stripe + Cloudflare). **Store authors install this package** in their own Astro app; see the **[repository README](https://github.com/jaredcat/BodegaCat#readme)** for how the monorepo is laid out, consumer quick start, and **developing the package against a separate store app (dogfooding)**.

Deploying: **`examples/deploy/cloudflare-pages/README.md`** in the source repo.

## Public exports

Subpaths are declared in `package.json` `exports` so you can import types and helpers without copying source:

- `import type { BodegaCatTheme } from "bodegacat/themes"` — built-in theme registry + types  
- `import type { BodegaCatTheme } from "bodegacat/themes/types"` — theme interface only  
- `import type { SiteConfig, … } from "bodegacat/types/product"` — product/site types  
- `import { getEffectiveConfig } from "bodegacat/config/site"` — advanced; most config is KV-driven  

Use **`moduleResolution`: `"bundler"`** or **`Node16`/`NodeNext`** in the consuming `tsconfig` so these resolve.

In a host app, you can override integration paths (e.g. `@config`, `@themes`, `@models`) via **Vite `resolve.alias`**; routes use these aliases so overrides apply without forking route source. (`@models/*` maps to `src/types/*` — the name **`@types`** is avoided because it clashes with DefinitelyTyped’s `@types/*` scope.)
