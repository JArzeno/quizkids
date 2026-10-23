import type { MetadataRoute } from 'next';
import { SITE_PAGES, SITE_URL, localePath } from '@/lib/site';

const PRIORITY: Record<string, number> = { '/': 1, '/features': 0.9, '/how-it-works': 0.8, '/pricing': 0.8, '/faq': 0.7, '/about': 0.5, '/privacy': 0.3, '/terms': 0.3 };

/** Every public page in both languages, each listing its other-language twin */
export default function sitemap(): MetadataRoute.Sitemap {
  return SITE_PAGES.flatMap((page) =>
    (['en', 'es'] as const).map((locale) => ({
      url: SITE_URL + localePath(locale, page),
      changeFrequency: 'monthly' as const,
      priority: PRIORITY[page],
      alternates: { languages: { en: SITE_URL + localePath('en', page), es: SITE_URL + localePath('es', page) } },
    })),
  );
}
