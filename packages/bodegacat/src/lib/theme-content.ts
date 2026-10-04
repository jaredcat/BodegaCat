import type { ThemeContent, ThemeLink } from "../themes/types";
import type { SiteConfig } from "../types/product";

/**
Coded default in `defaultSiteConfig`. Not a real uploaded logo.
*/
const PLACEHOLDER_LOGO = "/logo.png";

function legacyText(config: SiteConfig, id: string): string | undefined {
  switch (id) {
    case "logo": {
      return config.logo;
    }
    case "homeHeadline": {
      return config.homeHeadline;
    }
    case "shopTagline": {
      return config.shopTagline;
    }
    case "aboutTitle": {
      return config.aboutTitle;
    }
    case "aboutText": {
      return config.aboutText;
    }
    case "contactEmail": {
      return config.contactEmail;
    }
    default: {
      return undefined;
    }
  }
}

function legacyLinks(config: SiteConfig, id: string): ThemeLink[] | undefined {
  if (id === "footerLinks") return config.footerLinks;
  if (id === "socialLinks") {
    return config.socialLinks.map((link) => ({
      label: link.label ?? link.platform,
      href: link.url,
    }));
  }
  return undefined;
}

const SEEDED_TEXT_IDS = [
  "logo",
  "contactEmail",
  "homeHeadline",
  "shopTagline",
  "aboutTitle",
  "aboutText",
  "heroImage",
  "feature1Title",
  "feature1Text",
  "feature2Title",
  "feature2Text",
  "feature3Title",
  "feature3Text",
];

/**
Values to show in admin, including older site fields when content is empty.
*/
export function seedThemeContent(config: SiteConfig): ThemeContent {
  const content: ThemeContent = { ...config.content };
  for (const id of SEEDED_TEXT_IDS) {
    if (typeof content[id] === "string") continue;
    const value = themeText(config, id);
    if (!value || (id === "logo" && value === PLACEHOLDER_LOGO)) continue;
    content[id] = value;
  }
  for (const id of ["footerLinks", "socialLinks"]) {
    if (Array.isArray(content[id])) continue;
    const links = themeLinks(config, id);
    if (links.length > 0) content[id] = links;
  }
  return content;
}

/**
Text, URL, or image path for a theme field. Content wins; older site fields fill gaps.
*/
export function themeText(
  config: SiteConfig,
  id: string,
  fallback = "",
): string {
  const stored = config.content?.[id];
  return typeof stored === "string"
    ? stored
    : (legacyText(config, id) ?? fallback);
}

/**
Link rows for a theme field. Content wins; older footer and social lists fill gaps.
*/
export function themeLinks(config: SiteConfig, id: string): ThemeLink[] {
  const stored = config.content?.[id];
  return Array.isArray(stored) ? stored : (legacyLinks(config, id) ?? []);
}

const LEGACY_TEXT_IDS = [
  "logo",
  "homeHeadline",
  "shopTagline",
  "aboutTitle",
  "aboutText",
  "contactEmail",
] as const;

/**
Copy theme content back onto the older site fields those ids replaced.
*/
export function legacyFromContent(
  content: ThemeContent,
): Partial<
  Pick<
    SiteConfig,
    | "logo"
    | "homeHeadline"
    | "shopTagline"
    | "aboutTitle"
    | "aboutText"
    | "contactEmail"
    | "footerLinks"
    | "socialLinks"
  >
> {
  const mirrored: Partial<SiteConfig> = {};
  for (const id of LEGACY_TEXT_IDS) {
    const value = content[id];
    if (typeof value === "string") mirrored[id] = value;
  }
  if (Array.isArray(content.footerLinks)) {
    mirrored.footerLinks = content.footerLinks;
  }
  if (Array.isArray(content.socialLinks)) {
    mirrored.socialLinks = content.socialLinks.map((link) => ({
      platform: link.label,
      url: link.href,
      label: link.label,
    }));
  }
  return mirrored;
}
