import Link from 'next/link';
import { COMMON } from '@/content/common';
import { CONTACT_EMAIL, localePath, type Locale, type SitePage } from '@/lib/site';
import { Brand } from './ui';
import { LanguageSwitcher } from './LanguageSwitcher';

export function SiteFooter({ locale, page }: { locale: Locale; page: SitePage }) {
  const c = COMMON[locale];
  const f = c.footer;
  const p = (path: string) => localePath(locale, path);
  const cols = [
    { title: f.product, links: [
      { href: p('/features'), label: c.nav.features },
      { href: p('/how-it-works'), label: c.nav.how },
      { href: p('/') + '#subjects', label: f.subjects },
      { href: p('/pricing'), label: c.nav.pricing },
      { href: p('/faq'), label: c.nav.faq },
    ] },
    { title: f.company, links: [
      { href: p('/about'), label: f.about },
      { href: `mailto:${CONTACT_EMAIL}`, label: f.contact },
    ] },
    { title: f.legal, links: [
      { href: p('/privacy'), label: f.privacy },
      { href: p('/terms'), label: f.terms },
    ] },
  ];

  return (
    <footer className="mk-footer">
      <div className="mk-container">
        <div className="mk-footer-grid">
          <div>
            <Brand locale={locale} />
            <p className="mk-body" style={{ marginTop: 12, fontSize: 14.5, maxWidth: 300 }}>{f.tagline}</p>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <h2>{col.title}</h2>
              <ul>
                {col.links.map((l) => (
                  <li key={l.href}>
                    {l.href.startsWith('mailto:') ? <a href={l.href}>{l.label}</a> : <Link href={l.href}>{l.label}</Link>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mk-footer-bottom">
          <span>{f.copy}</span>
          <LanguageSwitcher locale={locale} label={f.language} hrefs={{ en: localePath('en', page), es: localePath('es', page) }} />
        </div>
      </div>
    </footer>
  );
}
