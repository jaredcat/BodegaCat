// @ts-check
import path from "node:path";
import { fileURLToPath } from "node:url";

import narwhal from "eslint-config-narwhal";
import eslintPluginAstro from "eslint-plugin-astro";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig } from "eslint/config";

const rootDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig([
  ...narwhal({
    typescript: true,
    typechecked: true,
    strict: true,
    stylistic: true,
    prettier: true,
  }),
  reactHooks.configs.flat.recommended,
  jsxA11y.flatConfigs.recommended,
  eslintPluginAstro.configs.recommended,
  {
    ignores: [
      "**/build/**",
      "**/dist/**",
      "**/coverage/**",
      ".astro/**",
      "apps/template/worker-configuration/**",
    ],
  },
  {
    languageOptions: {
      parserOptions: {
        // Root tsconfig only includes eslint.config.mjs (tooling). Package/app tsconfigs
        // must not list the same source files, or project selection breaks @models/* in .astro.
        project: [
          "./tsconfig.json",
          "./packages/bodegacat/tsconfig.json",
          "./apps/template/tsconfig.json",
        ],
        tsconfigRootDir: rootDirectory,
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

      // React components (PascalCase), hooks/util modules (camelCase), and
      // kebab-case files coexist in this package.
      "unicorn/filename-case": [
        "error",
        {
          cases: {
            kebabCase: true,
            pascalCase: true,
            camelCase: true,
          },
        },
      ],
      // Rewrites Astro `interface Props`, React event `e`, fetch `res`, etc.
      "unicorn/name-replacements": "off",
      // Astro's `export const prerender` name is fixed by the framework.
      "unicorn/consistent-boolean-name": ["error", { ignore: ["^prerender$"] }],
      // Prefer `undefined`; keep the rule stricter than unicorn defaults so
      // `=== null` is also banned. `useRef(null)` stays allowed by the rule.
      "unicorn/no-null": [
        "error",
        { checkArguments: true, checkStrictEquality: true },
      ],
    },
  },
  {
    // Injected storefront routes live outside src/pages, but Astro still honors prerender.
    files: ["packages/bodegacat/src/routes/**/*.{astro,ts}"],
    rules: {
      "astro/no-prerender-export-outside-pages": "off",
    },
  },
  {
    files: ["**/*.astro"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-misused-promises": "off",
      "jsx-a11y/label-has-associated-control": "off",
      "unicorn/prefer-ternary": "off",
      // Astro frontmatter uses top-level `return` for redirects / early exits.
      "unicorn/prefer-module": "off",
      // Typed lint does not resolve Astro.props / component script types reliably.
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
    },
  },
]);
