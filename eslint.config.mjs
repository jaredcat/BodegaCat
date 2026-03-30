// @ts-check
import eslint from "@eslint/js";
import eslintPluginAstro from "eslint-plugin-astro";
import astroParser from "astro-eslint-parser";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import sonarjs from "eslint-plugin-sonarjs";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  // @ts-expect-error - sonarjs v4 types are incompatible with ESLint flat config types
  sonarjs.configs.recommended,
  reactHooks.configs.flat.recommended,
  jsxA11y.flatConfigs.recommended,
  eslintPluginAstro.configs.recommended,
  {
    ignores: [
      "**/build/**",
      "**/dist/**",
      "**/coverage/**",
      "scripts/**",
      ".astro/**",
    ],
  },
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        // Browser globals for client-side code
        window: "readonly",
        document: "readonly",
        console: "readonly",
        alert: "readonly",
        confirm: "readonly",
        prompt: "readonly",
        fetch: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
      },
    },
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { ignoreRestSiblings: true },
      ],
      "sonarjs/no-unused-vars": "off",
    },
  },
  {
    files: ["**/*.astro"],
    languageOptions: {
      // Ensure Astro files are parsed with the Astro parser, not the TS program parser.
      parser: astroParser,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-misused-promises": "off",
      "sonarjs/prefer-read-only-props": "off",
      // Allow more flexible typing in Astro files
      "jsx-a11y/label-has-associated-control": "off",
    },
  },
]);
