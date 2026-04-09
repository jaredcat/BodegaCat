import { en } from './locales/en';
import type { Translations } from './locales/en';

// Add imports for additional locales here as they are created:
// import { fr } from './locales/fr';
// import { es } from './locales/es';

const localeMap: Record<string, Translations> = {
  en,
  // fr,
  // es,
};

/**
 * Returns the translation object for the given BCP 47 locale tag.
 * Falls back to English if the locale is not yet available.
 *
 * Usage in Astro pages:
 *   const t = getTranslations(siteConfig.locale);
 *   <p>{t.shop.title}</p>
 */
export function getTranslations(locale: string): Translations {
  const lang = locale.split('-')[0]!;
  return localeMap[lang] ?? localeMap['en']!;
}

/**
 * Format a monetary amount using the browser/server's Intl API.
 * @param amountInCents - Amount in the currency's smallest unit (e.g. cents for USD)
 * @param currency - ISO 4217 currency code (e.g. 'USD', 'EUR', 'JPY')
 * @param locale - BCP 47 locale tag (e.g. 'en-US', 'fr-FR', 'ja-JP')
 */
export function formatPrice(
  amountInCents: number,
  currency: string,
  locale: string,
): string {
  const divisor = getMinorUnitDivisor(currency);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountInCents / divisor);
}

/**
 * Format a date using the Intl API.
 * @param date - Date object or ISO string
 * @param locale - BCP 47 locale tag
 */
export function formatDate(date: Date | string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(typeof date === 'string' ? new Date(date) : date);
}

/**
 * Returns the divisor to convert from minor units to major units.
 * Most currencies use 100 (cents), but some (JPY, KRW, etc.) use 1.
 */
function getMinorUnitDivisor(currency: string): number {
  const zeroCurrencies = new Set([
    'BIF', 'CLP', 'DJF', 'GNF', 'ISK', 'JPY', 'KMF', 'KRW',
    'MGA', 'PYG', 'RWF', 'UGX', 'UYI', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
  ]);
  return zeroCurrencies.has(currency.toUpperCase()) ? 1 : 100;
}

export type { Translations };
