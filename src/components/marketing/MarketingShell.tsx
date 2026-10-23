import React from 'react';
import '@/app/marketing.css';
import type { Locale, SitePage } from '@/lib/site';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import { LangSync } from './LangSync';

const SKIP: Record<Locale, string> = { en: 'Skip to content', es: 'Saltar al contenido' };

/** Header, footer and language plumbing around every public page */
export function MarketingShell({ locale, page, children }: { locale: Locale; page: SitePage; children: React.ReactNode }) {
  return (
    <div className="mk-page" lang={locale}>
      {/* The root layout renders <html lang="en">; fix it before paint for /es pages (LangSync keeps it right after client navigation) */}
      {locale !== 'en' && <script dangerouslySetInnerHTML={{ __html: `document.documentElement.lang=${JSON.stringify(locale)}` }} />}
      <LangSync locale={locale} />
      <a href="#main" className="qk-btn qk-btn-primary mk-skip">{SKIP[locale]}</a>
      <SiteHeader locale={locale} page={page} />
      <main id="main">{children}</main>
      <SiteFooter locale={locale} page={page} />
    </div>
  );
}
