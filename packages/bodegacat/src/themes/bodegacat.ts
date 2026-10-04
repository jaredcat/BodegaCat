import type { BodegaCatTheme, ThemeSettingField } from "./types";

const radiusOptions = [
  { value: "0", label: "None" },
  { value: "0.25rem", label: "Small" },
  { value: "0.5rem", label: "Medium" },
  { value: "0.75rem", label: "Large" },
  { value: "1rem", label: "Extra Large" },
  { value: "9999px", label: "Pill" },
];

/**
Fields the Bodega Cat homepage and catalog read.
*/
const settings: ThemeSettingField[] = [
  { type: "image", id: "logo", label: "Logo" },
  {
    type: "text",
    id: "contactEmail",
    label: "Contact email",
    placeholder: "hello@example.com",
  },
  {
    type: "text",
    id: "homeHeadline",
    label: "Homepage headline",
    help: "Large heading on the homepage. Leave blank to use the store name.",
  },
  {
    type: "text",
    id: "shopTagline",
    label: "Shop page tagline",
    help: "Line under the shop heading.",
  },
  { type: "text", id: "aboutTitle", label: "About title" },
  { type: "textarea", id: "aboutText", label: "About text" },
  {
    type: "links",
    id: "footerLinks",
    label: "Footer links",
    help: "Label and path or URL.",
  },
  {
    type: "links",
    id: "socialLinks",
    label: "Social links",
    help: "Label and profile URL.",
  },
  {
    type: "color",
    id: "primary",
    label: "Primary",
    variable: "--color-primary",
  },
  {
    type: "color",
    id: "secondary",
    label: "Secondary",
    variable: "--color-secondary",
  },
  { type: "color", id: "accent", label: "Accent", variable: "--color-accent" },
  {
    type: "color",
    id: "background",
    label: "Background",
    variable: "--color-background",
  },
  {
    type: "color",
    id: "surface",
    label: "Surface",
    variable: "--color-surface",
  },
  { type: "color", id: "text", label: "Text", variable: "--color-text" },
  {
    type: "text",
    id: "fontHeading",
    label: "Heading font",
    variable: "--font-heading",
  },
  {
    type: "text",
    id: "fontBody",
    label: "Body font",
    variable: "--font-body",
  },
  {
    type: "select",
    id: "borderRadius",
    label: "Border radius",
    variable: "--border-radius",
    options: radiusOptions,
  },
];

export const bodegaCatTheme: BodegaCatTheme = {
  id: "bodegacat",
  name: "Bodega Cat",
  description: "Clean blue and gray theme with amber accents",
  author: "Bodega Cat",
  version: "1.0.0",
  variables: {
    "--color-primary": "#3B82F6",
    "--color-secondary": "#6B7280",
    "--color-accent": "#F59E0B",
    "--color-background": "#FFFFFF",
    "--color-surface": "#F9FAFB",
    "--color-text": "#111827",
    "--color-text-secondary": "#6B7280",
    "--color-navbar-bg": "#FFFFFF",
    "--color-navbar-text": "#111827",
    "--color-hero-from": "var(--color-primary)",
    "--color-hero-to": "var(--color-accent)",
    "--color-footer-bg": "#F9FAFB",
    "--color-footer-text": "#111827",
    "--color-footer-text-muted": "#6B7280",
    "--color-footer-border": "#E5E7EB",
    "--color-cta-from": "#3B82F6",
    "--color-cta-to": "#F59E0B",
    "--font-heading": '"Inter", system-ui, sans-serif',
    "--font-body": '"Inter", system-ui, sans-serif',
    "--border-radius": "0.5rem",
    "--spacing-xs": "0.25rem",
    "--spacing-sm": "0.5rem",
    "--spacing-md": "1rem",
    "--spacing-lg": "1.5rem",
    "--spacing-xl": "2rem",
  },
  settings,
};
