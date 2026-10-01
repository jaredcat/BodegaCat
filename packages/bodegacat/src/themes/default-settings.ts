import type { ThemeSettingField } from "./types";

const radiusOptions = [
  { value: "0", label: "None" },
  { value: "0.25rem", label: "Small" },
  { value: "0.5rem", label: "Medium" },
  { value: "0.75rem", label: "Large" },
  { value: "1rem", label: "Extra Large" },
  { value: "9999px", label: "Pill" },
];

/** Fields the default homepage and catalog page read. Void Kitten uses the same layouts. */
export const defaultThemeSettings: ThemeSettingField[] = [
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
