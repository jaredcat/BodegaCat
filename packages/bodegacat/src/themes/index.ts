/**
 * Bodega Cat built-in themes.
 *
 * To create a custom theme, implement the BodegaCatTheme interface:
 *   import type { BodegaCatTheme } from 'bodegacat/themes';
 *
 * Simple themes are a single .ts file with variables + optional css.
 * Complex themes are a directory with an index.ts + Astro/React components.
 * See src/themes/paddleboard/ for a complex theme example.
 */
export type { BodegaCatTheme, ThemeVariables } from './types';
export { bodegaCatTheme } from './bodegacat';
export { voidKittenTheme } from './voidkitten';
export { paddleboardTheme } from './paddleboard/index';

export const builtInThemes = ['bodegacat', 'voidkitten', 'paddleboard'] as const;
export type BuiltInThemeName = (typeof builtInThemes)[number];
