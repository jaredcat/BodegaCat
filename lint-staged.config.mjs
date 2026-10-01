import { defineConfig } from "lint-staged/config";

export default defineConfig({
  "*.{js,mjs,cjs,ts,tsx,astro}": ["eslint --fix", "prettier --write"],
  "*.{json,md,css,yml,yaml,html}": "prettier --write",
});
