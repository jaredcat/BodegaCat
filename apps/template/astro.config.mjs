import cloudflare from "@astrojs/cloudflare";
import seoEnforcer from "astro-seo-enforcer";
import { defineConfig } from "astro/config";
import bodegacat from "bodegacat";

// https://astro.build/config
export default defineConfig({
  integrations: [
    bodegacat(),
    // Checks prerendered HTML after `astro build`. SSR routes are not files on disk.
    seoEnforcer({
      rules: {
        // Catalog titles and descriptions come from the merchant, so short copy is valid.
        title: { minLength: 1, maxLength: 70, checkDuplicates: true },
        metaDescription: {
          minLength: 1,
          maxLength: 160,
          checkDuplicates: true,
        },
        internalLinks: {
          ignore: [
            "/cart",
            "/cart/checkout",
            "/success",
            "/about",
            "/contact",
            /^\/admin/,
            /^\/preview/,
            /^\/api\//,
          ],
        },
        // Absolute canonicals need Astro `site`, which this template does not set.
        canonical: false,
        thinContent: false,
        sitemapCoverage: { requireInSitemap: false },
        robotsTxt: false,
      },
    }),
  ],
  adapter: cloudflare({
    imageService: "compile",
  }),
});
