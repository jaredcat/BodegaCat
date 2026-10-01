/**
 * Bodega Cat built-in themes.
 *
 * To create a custom theme, implement the BodegaCatTheme interface:
 *   import type { BodegaCatTheme } from 'bodegacat/themes';
 *
 * Simple themes are a single .ts file with variables + optional css.
 * A theme that replaces a layout passes slot files to bodegacat({ themeSlots }),
 * keyed by theme id. See docs/THEMES.md.
 */
export type {
  BodegaCatTheme,
  ThemeContent,
  ThemeLink,
  ThemeSettingField,
  ThemeSlots,
  ThemeVariables,
} from "./types";
export { themeLinks, themeText } from "../lib/theme-content";
export { bodegaCatTheme } from "./bodegacat";
export { voidKittenTheme } from "./voidkitten";
export { paddleboardTheme } from "./paddleboard/index";

export const builtInThemes = [
  "bodegacat",
  "voidkitten",
  "paddleboard",
] as const;
export type BuiltInThemeName = (typeof builtInThemes)[number];
