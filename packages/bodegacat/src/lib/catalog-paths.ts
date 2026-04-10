/** Authenticated draft preview (SSR). Public catalog uses `/shop` without this prefix. */
export const PREVIEW_CATALOG_PREFIX = "/preview" as const;

export function publicShopIndexPath(): string {
  return "/shop";
}

export function previewShopIndexPath(): string {
  return `${PREVIEW_CATALOG_PREFIX}/shop`;
}

export function publicProductPath(slug: string): string {
  return `/shop/${slug}`;
}

export function previewProductPath(slug: string): string {
  return `${PREVIEW_CATALOG_PREFIX}/shop/${slug}`;
}

export function previewHomePath(): string {
  return PREVIEW_CATALOG_PREFIX;
}
