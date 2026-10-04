import type { ThemeSettingField } from "../types";

const radiusOptions = [
  { value: "0", label: "None" },
  { value: "0.25rem", label: "Small" },
  { value: "0.5rem", label: "Medium" },
  { value: "0.75rem", label: "Large" },
  { value: "1rem", label: "Extra Large" },
  { value: "9999px", label: "Pill" },
];

/**
Fields the Paddleboard homepage, footer, and default shop page read.
*/
export const paddleboardThemeSettings: ThemeSettingField[] = [
  {
    type: "text",
    id: "homeHeadline",
    label: "Homepage headline",
    help: "Large heading in the hero. Leave blank to use the store name.",
  },
  {
    type: "text",
    id: "shopTagline",
    label: "Shop page tagline",
    help: "Line under the shop heading.",
  },
  { type: "text", id: "aboutTitle", label: "Features heading" },
  { type: "textarea", id: "aboutText", label: "Features introduction" },
  { type: "text", id: "feature1Title", label: "Feature 1 title" },
  { type: "textarea", id: "feature1Text", label: "Feature 1 description" },
  { type: "text", id: "feature2Title", label: "Feature 2 title" },
  { type: "textarea", id: "feature2Text", label: "Feature 2 description" },
  { type: "text", id: "feature3Title", label: "Feature 3 title" },
  { type: "textarea", id: "feature3Text", label: "Feature 3 description" },
  {
    type: "text",
    id: "contactEmail",
    label: "Contact email",
    placeholder: "hello@example.com",
  },
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
    type: "image",
    id: "heroImage",
    label: "Hero image",
    help: "Shown above the hero heading. Replacing it updates the shop without a rebuild.",
  },
  {
    type: "color",
    id: "primary",
    label: "Primary",
    variable: "--color-primary",
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
    type: "color",
    id: "navbar",
    label: "Navbar",
    variable: "--color-navbar-bg",
  },
  {
    type: "color",
    id: "footer",
    label: "Footer",
    variable: "--color-footer-bg",
  },
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
