import type { BodegaCatTheme } from './types';

export const defaultTheme: BodegaCatTheme = {
  name: 'Default',
  description: 'Clean blue and gray theme with amber accents',
  author: 'Bodega Cat',
  version: '1.0.0',
  variables: {
    '--color-primary': '#3B82F6',
    '--color-secondary': '#6B7280',
    '--color-accent': '#F59E0B',
    '--color-background': '#FFFFFF',
    '--color-surface': '#F9FAFB',
    '--color-text': '#111827',
    '--color-text-secondary': '#6B7280',
    '--font-heading': '"Inter", system-ui, sans-serif',
    '--font-body': '"Inter", system-ui, sans-serif',
    '--border-radius': '0.5rem',
    '--spacing-xs': '0.25rem',
    '--spacing-sm': '0.5rem',
    '--spacing-md': '1rem',
    '--spacing-lg': '1.5rem',
    '--spacing-xl': '2rem',
  },
};
