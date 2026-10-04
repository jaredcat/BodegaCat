/**
BodegaCat Theme Interface — v1

STABILITY CONTRACT FOR THEME AUTHORS:
- Existing variable names in ThemeVariables will NEVER be removed or renamed
  within a major version of Bodega Cat.
- New optional variables may be added in minor versions; themes that don't
  include them will fall back to the framework's CSS defaults.
- The `variables` property shape is the stable styling interface.
- `slots` are optional layout components, matched by theme `id`.
- `settings` lists the admin fields this theme renders. It is JSON and is saved with the theme.

CREATING A THEME (npm package):
  import type { BodegaCatTheme } from 'bodegacat/themes/types';
  // or: import type { BodegaCatTheme } from 'bodegacat/themes' (re-exports types)
  const myTheme: BodegaCatTheme = { name: 'My Theme', variables: { ... } };
  export default myTheme;

INSTALLING A THEME:
  Pass slot files to bodegacat({ themeSlots }) and set the theme id
  in site config or Admin → Settings. CSS variables still come from
  the theme object. Slot components are not stored in KV.
*/
export interface ThemeSlots {
  /**
  Replaces the default home page body.
  Props: siteConfig, t, copyrightYear, catalogShopHref.
  */
  home?: ThemeSlotComponent;
  /**
  Extra block on the product page, under the buy box.
  Props: product, siteConfig. Built-in themes leave this empty.
  */
  productExtra?: ThemeSlotComponent;
  /**
  Replaces the default shop catalog body.
  Props: siteConfig, products, t, productPath.
  */
  shop?: ThemeSlotComponent;
}

/**
A label and href row on a theme settings form.
*/
export interface ThemeLink {
  label: string;
  href: string;
}

export type ThemeContentValue = string | ThemeLink[];

/**
Values for a theme's text, link, and image fields. Colors stay on `variables`.
*/
export type ThemeContent = Record<string, ThemeContentValue>;

interface ThemeSettingBase {
  id: string;
  label: string;
  help?: string;
}

export interface ThemeSettingText extends ThemeSettingBase {
  type: "text" | "textarea" | "url";
  placeholder?: string;
  /**
  When set, this field edits a CSS variable instead of theme content.
  Fonts use this. Colors use `type: "color"`.
  */
  variable?: `--${string}`;
}

export interface ThemeSettingImage extends ThemeSettingBase {
  type: "image";
}

export interface ThemeSettingLinks extends ThemeSettingBase {
  type: "links";
}

export interface ThemeSettingColor extends ThemeSettingBase {
  type: "color";
  variable: `--${string}`;
}

export interface ThemeSettingSelect extends ThemeSettingBase {
  type: "select";
  variable: `--${string}`;
  options: { value: string; label: string }[];
}

export type ThemeSettingField =
  | ThemeSettingText
  | ThemeSettingImage
  | ThemeSettingLinks
  | ThemeSettingColor
  | ThemeSettingSelect;

/**
Component rendered by a slot. The storefront calls it. KV cannot store it.
*/
export type ThemeSlotComponent = (
  properties: Record<string, unknown>,
) => unknown;
export interface BodegaCatTheme {
  /**
  Stable identifier for the theme (useful for routing to theme runtimes).
  For built-in themes this matches the built-in theme key (e.g. 'voidkitten').
  Third-party themes should use a package-scoped id (e.g. '@acme/my-theme').
  */
  id?: string;
  /**
  Display name shown in the admin panel
  */
  name: string;
  description?: string;
  author?: string;
  /**
  Semver version of the theme package
  */
  version?: string;

  /**
  CSS custom properties injected into :root on every page.
  These are the stable interface — new vars may be added over time
  but the ones listed in ThemeVariables will not change.
  */
  variables: ThemeVariables;

  /**
  Optional raw CSS string injected into <head> after the variables.
  Use this for @font-face declarations, custom animations, or anything
  that cannot be expressed as CSS variables.
  
  Keep this minimal — the more CSS a theme ships here, the more likely
  framework updates will conflict with it. Prefer variables.
  */
  css?: string;

  /**
  Layout components for this theme object when it is the build-time theme.
  Admin saves of the theme do not keep these. Prefer `themeSlots` on
  `bodegacat()` keyed by `id`, which still apply after a settings save.
  */
  slots?: ThemeSlots;

  /**
  Admin fields this layout uses. Omitted fields are not shown.
  Stored with the theme because it is plain data, unlike slot components.
  */
  settings?: ThemeSettingField[];
}

/**
The stable set of CSS custom properties Bodega Cat defines and uses.
The index signature allows themes to add their own custom variables,
which can be referenced in `theme.css`.
*/
export interface ThemeVariables {
  // ─── Colors ───────────────────────────────────────────────────────────────
  "--color-primary": string;
  "--color-secondary": string;
  "--color-accent": string;
  "--color-background": string;
  "--color-surface": string;
  "--color-text": string;
  "--color-text-secondary": string;

  // ─── Navigation ───────────────────────────────────────────────────────────
  /**
  Navbar background color. Defaults to white if unset.
  */
  "--color-navbar-bg": string;
  /**
  Navbar foreground/text color. Defaults to --color-text if unset.
  */
  "--color-navbar-text": string;

  // ─── Hero Section ─────────────────────────────────────────────────────────
  /**
  Start color of the hero gradient. Defaults to --color-primary.
  */
  "--color-hero-from": string;
  /**
  End color of the hero gradient. Defaults to --color-accent.
  */
  "--color-hero-to": string;

  // ─── Footer ───────────────────────────────────────────────────────────────
  /**
  Footer background color. Defaults to --color-surface.
  */
  "--color-footer-bg": string;
  /**
  Footer text color. Defaults to --color-text.
  */
  "--color-footer-text": string;
  /**
  Footer muted/secondary text (links, sub-labels).
  */
  "--color-footer-text-muted": string;
  /**
  Footer top border color.
  */
  "--color-footer-border": string;

  // ─── CTA Section ──────────────────────────────────────────────────────────
  /**
  Start color of the CTA banner gradient. Defaults to --color-primary.
  */
  "--color-cta-from": string;
  /**
  End color of the CTA banner gradient. Defaults to --color-accent.
  */
  "--color-cta-to": string;

  // ─── Typography ───────────────────────────────────────────────────────────
  /**
  Full font-family stack for headings, e.g. "Playfair Display, serif"
  */
  "--font-heading": string;
  /**
  Full font-family stack for body text, e.g. "Inter, system-ui, sans-serif"
  */
  "--font-body": string;

  // ─── Shape ────────────────────────────────────────────────────────────────
  "--border-radius": string;

  // ─── Spacing ──────────────────────────────────────────────────────────────
  "--spacing-xs": string;
  "--spacing-sm": string;
  "--spacing-md": string;
  "--spacing-lg": string;
  "--spacing-xl": string;

  // ─── Custom ───────────────────────────────────────────────────────────────
  /**
  Themes may add any additional CSS custom properties here.
  */
  [key: `--${string}`]: string;
}
