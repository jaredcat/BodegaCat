/**
 * Bodega Cat built-in themes.
 *
 * To create a custom theme, implement the BodegaCatTheme interface:
 *   import type { BodegaCatTheme } from 'bodegacat/themes';
 *
 * To use a theme, set it as `theme` in your site config:
 *   import { darkTheme } from 'bodegacat/themes';
 *   // or import myTheme from 'bodegacat-theme-mystore';
 */
export type { BodegaCatTheme, ThemeVariables } from './types';
export { defaultTheme } from './default';
export { darkTheme } from './dark';

export const builtInThemes = ['default', 'dark'] as const;
export type BuiltInThemeName = (typeof builtInThemes)[number];
