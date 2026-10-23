'use client';
import { LANG_COOKIE, type Locale } from '@/lib/site';

const NAMES: Record<Locale, string> = { en: 'English', es: 'Español' };

/**
 * Footer language picker. Plain links to the same page in each language (crawlable, full page load);
 * clicking one also saves the choice, which then wins over browser/location detection in middleware.
 */
export function LanguageSwitcher({ locale, hrefs, label }: { locale: Locale; hrefs: Record<Locale, string>; label: string }) {
  const remember = (l: Locale) => {
    document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; SameSite=Lax`;
  };
  return (
    <nav className="mk-langs" aria-label={label}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
      </svg>
      {(Object.keys(NAMES) as Locale[]).map((l) => (
        <a key={l} href={hrefs[l]} hrefLang={l} lang={l} aria-current={l === locale ? 'true' : undefined} onClick={() => remember(l)}>
          {NAMES[l]}
        </a>
      ))}
    </nav>
  );
}
