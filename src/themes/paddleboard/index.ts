import type { BodegaCatTheme } from '../types';

export const paddleboardTheme: BodegaCatTheme = {
  id: 'paddleboard',
  name: 'Paddleboard',
  description: 'Ocean blue and green theme inspired by outdoor water sports',
  author: 'Bodega Cat',
  version: '1.0.0',
  variables: {
    // ─── Core palette ────────────────────────────────────────────────────────
    '--color-primary': '#1d6baa',       // deep ocean blue — buttons, links, accents
    '--color-secondary': '#54595f',     // dark gray
    '--color-accent': '#61ce70',        // nature green — CTA gradients, icons
    '--color-background': '#ffffff',
    '--color-surface': '#f9fafb',       // bg-gray-50 — alternating section bg
    '--color-text': '#374151',          // enforced in original for readability
    '--color-text-secondary': '#6b7280',

    // ─── Navigation ──────────────────────────────────────────────────────────
    '--color-navbar-bg': '#1d6baa',     // matches header-background from anybodypaddlesports
    '--color-navbar-text': '#ffffff',

    // ─── Hero ────────────────────────────────────────────────────────────────
    '--color-hero-from': '#1d6baa',
    '--color-hero-to': '#61ce70',

    // ─── Footer ──────────────────────────────────────────────────────────────
    '--color-footer-bg': '#111827',
    '--color-footer-text': '#f9fafb',
    '--color-footer-text-muted': '#9ca3af',
    '--color-footer-border': '#374151',

    // ─── CTA Section ─────────────────────────────────────────────────────────
    '--color-cta-from': '#1d6baa',
    '--color-cta-to': '#61ce70',

    // ─── Typography ──────────────────────────────────────────────────────────
    '--font-heading': '"Poppins", system-ui, sans-serif',
    '--font-body': '"Poppins", system-ui, sans-serif',

    // ─── Shape ───────────────────────────────────────────────────────────────
    '--border-radius': '0.5rem',

    // ─── Spacing ─────────────────────────────────────────────────────────────
    '--spacing-xs': '0.25rem',
    '--spacing-sm': '0.5rem',
    '--spacing-md': '1rem',
    '--spacing-lg': '1.5rem',
    '--spacing-xl': '2rem',
  },

  // Load Poppins from Google Fonts.
  // Additional structural CSS is intentionally minimal here — the layout,
  // wave, feature circles, CTA section, and footer are all driven by
  // framework classes (hero-section, hero-wave, feature-icon-*, cta-section,
  // site-footer) that respond to the CSS variables above.
  css: `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

/* Elevated shadow on primary buttons to match the original site's CTA feel */
.btn-primary {
  font-weight: 600;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

.btn-primary:hover {
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

/* Cart badge — use accent green so it pops against the dark blue navbar */
.site-navbar span {
  background-color: #61ce70 !important;
}
`,
};
