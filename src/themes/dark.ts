import type { BodegaCatTheme } from './types';

export const darkTheme: BodegaCatTheme = {
  name: 'Dark',
  description: 'Dark mode theme with blue and amber accents',
  author: 'Bodega Cat',
  version: '1.0.0',
  variables: {
    '--color-primary': '#60A5FA',
    '--color-secondary': '#9CA3AF',
    '--color-accent': '#FBBF24',
    '--color-background': '#111827',
    '--color-surface': '#1F2937',
    '--color-text': '#F9FAFB',
    '--color-text-secondary': '#D1D5DB',
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
