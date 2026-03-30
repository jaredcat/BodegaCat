/**
 * BodegaCat Theme Interface — v1
 *
 * STABILITY CONTRACT FOR THEME AUTHORS:
 * - Existing variable names in ThemeVariables will NEVER be removed or renamed
 *   within a major version of Bodega Cat.
 * - New optional variables may be added in minor versions; themes that don't
 *   include them will fall back to the framework's CSS defaults.
 * - The `variables` property shape is the only interface theme authors need
 *   to depend on. Everything else in this file is informational.
 *
 * CREATING A THEME (npm package):
 *   import type { BodegaCatTheme } from 'bodegacat/themes';
 *   const myTheme: BodegaCatTheme = { name: 'My Theme', variables: { ... } };
 *   export default myTheme;
 *
 * INSTALLING A THEME:
 *   In src/config/site.ts, set `theme: myTheme` in your site config.
 */
export interface BodegaCatTheme {
  /** Display name shown in the admin panel */
  name: string;
  description?: string;
  author?: string;
  /** Semver version of the theme package */
  version?: string;

  /**
   * CSS custom properties injected into :root on every page.
   * These are the stable interface — new vars may be added over time
   * but the ones listed in ThemeVariables will not change.
   */
  variables: ThemeVariables;

  /**
   * Optional raw CSS string injected into <head> after the variables.
   * Use this for @font-face declarations, custom animations, or anything
   * that cannot be expressed as CSS variables.
   *
   * Keep this minimal — the more CSS a theme ships here, the more likely
   * framework updates will conflict with it. Prefer variables.
   */
  css?: string;
}

/**
 * The stable set of CSS custom properties Bodega Cat defines and uses.
 * The index signature allows themes to add their own custom variables,
 * which can be referenced in `theme.css`.
 */
export interface ThemeVariables {
  // ─── Colors ───────────────────────────────────────────────────────────────
  '--color-primary': string;
  '--color-secondary': string;
  '--color-accent': string;
  '--color-background': string;
  '--color-surface': string;
  '--color-text': string;
  '--color-text-secondary': string;

  // ─── Typography ───────────────────────────────────────────────────────────
  /** Full font-family stack for headings, e.g. "Playfair Display, serif" */
  '--font-heading': string;
  /** Full font-family stack for body text, e.g. "Inter, system-ui, sans-serif" */
  '--font-body': string;

  // ─── Shape ────────────────────────────────────────────────────────────────
  '--border-radius': string;

  // ─── Spacing ──────────────────────────────────────────────────────────────
  '--spacing-xs': string;
  '--spacing-sm': string;
  '--spacing-md': string;
  '--spacing-lg': string;
  '--spacing-xl': string;

  // ─── Custom ───────────────────────────────────────────────────────────────
  /** Themes may add any additional CSS custom properties here. */
  [key: `--${string}`]: string;
}
