import type { Metadata } from 'next';

/** Public marketing site: locales, URLs and shared metadata. Safe to import from middleware (no Node APIs). */

export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://quizkids.app').replace(/\/$/, '');
export const SITE_NAME = 'QuizKids';
// TODO(owner): confirm the public contact inbox before launch
export const CONTACT_EMAIL = 'hello@quizkids.app';

export const LOCALES = ['en', 'es'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

/** Cookie that remembers the language picked in the footer; it wins over browser/location detection */
export const LANG_COOKIE = 'qk_lang';

/** Marketing pages, by path without the locale prefix. English lives at the root, Spanish under /es. */
export const SITE_PAGES = ['/', '/features', '/how-it-works', '/pricing', '/faq', '/about', '/privacy', '/terms'] as const;
export type SitePage = (typeof SITE_PAGES)[number];

export function localePath(locale: Locale, page: string): string {
  if (locale === DEFAULT_LOCALE) return page;
  return page === '/' ? `/${locale}` : `/${locale}${page}`;
}

/** Splits a request path into its locale and page path, e.g. /es/pricing → { locale: 'es', page: '/pricing' } */
export function splitLocale(pathname: string): { locale: Locale; page: string } {
  const m = pathname.match(/^\/es(\/.*)?$/);
  if (m) return { locale: 'es', page: m[1] || '/' };
  return { locale: 'en', page: pathname };
}

const SPANISH_COUNTRIES = new Set([
  'MX', 'ES', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC', 'GT', 'CU', 'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY', 'PR', 'GQ',
]);

/**
 * Language for a first-time visitor. The browser's first language decides; the visitor's country only
 * breaks the tie when the browser also lists Spanish, or sends no languages at all.
 */
export function detectLocale(acceptLanguage: string | null, country: string | null): Locale {
  const langs = (acceptLanguage || '')
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=');
      return { lang: tag.toLowerCase().split('-')[0], q: q ? parseFloat(q) : 1 };
    })
    .filter((l) => l.lang && l.lang !== '*')
    .sort((a, b) => b.q - a.q);
  const fromSpanishCountry = !!country && SPANISH_COUNTRIES.has(country.toUpperCase());
  if (langs.length === 0) return fromSpanishCountry ? 'es' : 'en';
  if (langs[0].lang === 'es') return 'es';
  if (fromSpanishCountry && langs.some((l) => l.lang === 'es')) return 'es';
  return 'en';
}

/** Crawlers and link previews always get the URL they asked for, never a language redirect */
export function isBot(userAgent: string | null): boolean {
  return /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|whatsapp|telegram|discord|lighthouse|inspectiontool|ahrefs|semrush/i.test(userAgent || '');
}

const OG_LOCALE: Record<Locale, string> = { en: 'en_US', es: 'es_LA' };

/** Title, description, canonical URL and hreflang alternates for one marketing page in one language */
export function pageMetadata(locale: Locale, page: SitePage, title: string, description: string, opts: { absoluteTitle?: boolean } = {}): Metadata {
  const url = localePath(locale, page);
  return {
    title: opts.absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: url,
      languages: { en: localePath('en', page), es: localePath('es', page), 'x-default': localePath('en', page) },
    },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title,
      description,
      url,
      locale: OG_LOCALE[locale],
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}
