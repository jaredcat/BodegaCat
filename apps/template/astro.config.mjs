import cloudflare from "@astrojs/cloudflare";
import bodegacat from "bodegacat";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  integrations: [bodegacat()],
  adapter: cloudflare({
    imageService: "compile",
  }),
});
