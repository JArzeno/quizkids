import Link from 'next/link';
import { COMMON } from '@/content/common';
import { localePath, type Locale, type SitePage } from '@/lib/site';
import { Brand } from './ui';
import { HeaderActions } from './HeaderActions';
import { MobileMenu } from './MobileMenu';

export function SiteHeader({ locale, page }: { locale: Locale; page: SitePage }) {
  const c = COMMON[locale];
  const links = [
    { page: '/features', label: c.nav.features },
    { page: '/how-it-works', label: c.nav.how },
    { page: '/pricing', label: c.nav.pricing },
    { page: '/faq', label: c.nav.faq },
  ].map((l) => ({ ...l, href: localePath(locale, l.page) }));

  return (
    <header className="mk-header">
      <div className="mk-container mk-header-inner">
        <Brand locale={locale} />
        <nav className="mk-nav" aria-label={c.menu}>
          {links.map((l) => (
            <Link key={l.page} href={l.href} aria-current={l.page === page ? 'page' : undefined}>{l.label}</Link>
          ))}
        </nav>
        <HeaderActions signIn={c.signIn} start={c.startTrial} dashboard={c.dashboard} />
        <MobileMenu label={c.menu} links={links} signIn={c.signIn} />
      </div>
    </header>
  );
}
