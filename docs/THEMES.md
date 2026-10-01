# Themes

Two ways to use Bodega Cat. Both keep the public shop as static HTML. Admin, preview, and checkout stay Cloudflare functions.

## Launch a shop

1. Copy [`apps/template`](../apps/template) (or start a new Astro app with the Cloudflare adapter).
2. Install `bodegacat` and add `bodegacat()` in `astro.config`.
3. Set Stripe keys. Deploy with [`examples/deploy/cloudflare-pages/README.md`](../examples/deploy/cloudflare-pages/README.md).
4. Pick a built-in theme in **Admin → Settings**: Bodega Cat, Void Kitten, or Paddleboard. The page lists the fields that theme actually uses (copy, links, colors, and photos). Paddleboard replaces the home page. Save, then redeploy when the static pages should match. A photo uploaded for an image field is served from `/files/theme/<field>` and updates without a rebuild.

## Change the shop

A theme package implements `BodegaCatTheme` (`import type { BodegaCatTheme } from "bodegacat/themes/types"`).

- **Colors and type.** Set `variables` (and optional `css`) on the theme. Admin can save that object to KV. Those values are CSS only.
- **Admin fields.** Add a JSON `settings` list on the theme. Field types are `text`, `textarea`, `url`, `links`, `color`, `select`, and `image`. Text, links, and images are stored on settings as `content`, keyed by field id. Color and font fields write `theme.variables`. Read values with `themeText` and `themeLinks` from `bodegacat/themes`. Older shops still have `homeHeadline`, `shopTagline`, `aboutTitle`, `aboutText`, `contactEmail`, `footerLinks`, `socialLinks`, and `logo`; those fill in when `content` does not have the same id.
- **A different home page, shop page, or an extra block on the product page.** Pass the component files to `bodegacat()`, keyed by the theme `id`. These files are not stored in KV. They still apply after an admin settings save, as long as the saved theme uses the same `id`.

```js
import bodegacat from "bodegacat";

export default {
  integrations: [
    bodegacat({
      themeSlots: {
        "@acme/shore": {
          home: "./src/themes/shore/Home.astro",
          shop: "./src/themes/shore/Shop.astro",
          productExtra: "./src/themes/shore/ProductExtra.astro",
        },
      },
    }),
  ],
};
```

`home` receives `siteConfig`, `t`, `copyrightYear`, and `catalogShopHref`. `shop` receives `siteConfig`, `products`, `t`, and `productPath` and replaces the catalog page, including the shop tagline. Omit `shop` to keep the default catalog (search, category and tag filters, product grid). `productExtra` receives `product` and `siteConfig` and renders under the buy box. Omit a slot to keep its default.

Image fields upload to staff-only `POST /api/admin/theme-asset`. The file is stored at `theme/<fieldId>` and the saved value is `/files/theme/<fieldId>`. `GET /files/[...key]` is public and only serves keys under `theme/`. The template `wrangler.toml` binds that bucket as `FILES`. If the binding is missing, the image field says file storage is not configured.

Set that theme as `theme` in site config (alias `@config` if you replace the package default) or save a theme with the same `id` in Admin → Settings, then redeploy the static shop.

**Product types** are presets for variation editors. Merchants edit them in Admin → Product types. A host can pass `productTypes` to `bodegacat()` as a starting list before KV exists.

**Deeper changes** (a different data model or a replaced page) use Vite `resolve.alias` for `@models`, `@themes`, or `@config`. Those aliases apply to the injected routes, so you do not fork the package source. Replacing a whole route is the alias of last resort.

## License

Bodega Cat is [AGPL-3.0](../LICENSE). You can customize it. If you offer a modified copy of Bodega Cat to users — including running that copy as the shop they use — you share the source of those modifications. A theme package that only implements this public interface is your code.
