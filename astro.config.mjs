import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField } from "astro/config";

// https://astro.build/config
export default defineConfig({
  integrations: [react({
    experimentalReactChildren: true,
  })],
  adapter: cloudflare({
    imageService: "compile",
  }),

  image: {
    // Authorize Stripe's image domains for optimization
    domains: ["files.stripe.com"],
    // Alternative: Use remotePatterns for more specific control
    // remotePatterns: [
    //   {
    //     protocol: "https",
    //     hostname: "files.stripe.com",
    //   },
    // ],
  },

  vite: {
    plugins: [tailwindcss()],
    define: {
      global: 'globalThis',
    },
    resolve: {
      alias: import.meta.env.PROD
        ? { "react-dom/server": "react-dom/server.edge" }
        : {},
    },
  },
  output: "server",

  build: {
    assets: "_astro",
  },
  env: {
    schema: {
      // Server-side secrets (not exposed to client)
      STRIPE_SECRET_KEY: envField.string({
        context: "server",
        access: "secret",
      }),
      STRIPE_WEBHOOK_SECRET: envField.string({
        context: "server",
        access: "secret",
      }),
      BUILD_HOOK_URL: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),

      // Client-side public variables (exposed to browser)
      STRIPE_PUBLISHABLE_KEY: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
      STRIPE_API_VERSION: envField.string({
        context: "client",
        access: "public",
        default: "2026-03-25.dahlia",
      }),
    },
  },
});
