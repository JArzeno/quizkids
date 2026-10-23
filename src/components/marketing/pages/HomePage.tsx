import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Avatar } from '@/components/ui/Avatar';
import { COMMON } from '@/content/common';
import { HOME } from '@/content/home';
import { FEATURES } from '@/content/features';
import { HOME_FAQ_IDS, faqItems } from '@/content/faq';
import { CONTACT_EMAIL, SITE_NAME, SITE_URL, localePath, type Locale } from '@/lib/site';
import { PLAN_PRICES } from '@/lib/pricing';
import { MarketingShell } from '../MarketingShell';
import { DemoButton } from '../DemoButton';
import { PricingPlan } from '../PricingPlan';
import { HeroArt, PlanMock, SchoolMock } from '../Mockups';
import { Bullets, CtaBand, FaqList, JsonLd, LeafIcon, Screenshot, SectionHead, icon, tone } from '../ui';

/** Zoom each full-screen capture in on the part that matters, so it reads at card size */
const FOCUS: Record<string, React.CSSProperties> = {
  quiz: { transform: 'scale(1.9)', transformOrigin: '44% 50%' },
  guide: { transform: 'scale(1.65)', transformOrigin: '12% 28%' },
  worksheet: { transform: 'scale(1.75)', transformOrigin: '50% 64%' },
};

export function HomePage({ locale }: { locale: Locale }) {
  const h = HOME[locale];
  const c = COMMON[locale];
  const p = (path: string) => localePath(locale, path);
  const faqs = faqItems(locale, HOME_FAQ_IDS);
  const shotAlt = Object.fromEntries(FEATURES[locale].rows.map((r) => [r.visual, r.alt]));

  return (
    <MarketingShell locale={locale} page="/">
      <JsonLd data={homeJsonLd(locale, h.metaDescription)} />

      {/* HERO */}
      <section className="mk-hero">
        <div className="mk-container mk-hero-grid">
          <div>
            <span className="qk-eyebrow"><LeafIcon /> {h.hero.eyebrow}</span>
            <h1 className="qk-h1">
              {h.hero.titleStart}<span className="qk-underline">{h.hero.titleMark}</span>{h.hero.titleEnd}
            </h1>
            <p className="qk-sub">{h.hero.sub}</p>
            <div className="mk-ctas">
              <Link href="/auth" className="qk-btn qk-btn-primary">{c.startTrial}</Link>
              <DemoButton locale={locale} className="qk-btn qk-btn-ghost">{c.seeDemo}</DemoButton>
            </div>
            <p className="mk-trial-note">{c.trialNote}</p>
            <div className="mk-stats">
              {h.hero.stats.map((s) => (
                <div key={s.label}>
                  <div className="mk-stat-v">{s.value}</div>
                  <div className="mk-stat-l">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <HeroArt locale={locale} />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="mk-section mk-section-alt">
        <div className="mk-container">
          <SectionHead eyebrow={h.how.eyebrow} title={h.how.title} sub={h.how.sub} />
          <ol className="mk-grid mk-grid-3" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {h.how.steps.map((s, i) => {
              const t = tone(['primary', 'sky', 'honey'][i]);
              return (
                <li key={s.title} className="qk-card mk-step">
                  <span className="mk-step-n" aria-hidden>{i + 1}</span>
                  <div className="mk-icon" style={{ background: t.bg, color: t.fg, marginTop: 8 }}>{icon(['users', 'book', 'spark'][i], 24)}</div>
                  <h3 className="mk-h3" style={{ margin: '16px 0 8px' }}>{s.title}</h3>
                  <p className="mk-body" style={{ fontSize: 15 }}>{s.body}</p>
                </li>
              );
            })}
          </ol>
          <div style={{ textAlign: 'center' }}>
            <Link href={p('/how-it-works')} className="mk-more">{h.how.link} {icon('arrow', 16)}</Link>
          </div>
        </div>
      </section>

      {/* 3-IN-1 FORMATS */}
      <section id="formats" className="mk-section">
        <div className="mk-container">
          <SectionHead eyebrow={h.formats.eyebrow} title={h.formats.title} sub={h.formats.sub} />
          <div className="mk-grid mk-grid-3">
            {h.formats.items.map((f) => (
              <article key={f.key} className="qk-card mk-format-card qk-card-interactive">
                <div className="mk-format-img">
                  <Image src={`/images/app/${f.key}-${locale}.webp`} alt={shotAlt[`shot:${f.key}`]} width={2560} height={1600} sizes="(max-width: 600px) 180vw, 720px" style={FOCUS[f.key]} />
                </div>
                <div className="mk-format-body">
                  <h3 className="mk-h3">{f.title}</h3>
                  <p className="mk-body" style={{ fontSize: 15 }}>{f.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FOLLOWS THEIR SCHOOL + DAILY PLAN + PROGRESS */}
      <section className="mk-section mk-section-alt">
        <div className="mk-container">
          <div className="mk-split">
            <div>
              <span className="qk-eyebrow">{h.school.eyebrow}</span>
              <h2 className="qk-h1 mk-h2">{h.school.title}</h2>
              <p className="mk-lead">{h.school.body}</p>
              <Bullets items={h.school.bullets} />
            </div>
            <SchoolMock locale={locale} />
          </div>
          <div className="mk-split mk-split-reverse">
            <div>
              <span className="qk-eyebrow">{h.plan.eyebrow}</span>
              <h2 className="qk-h1 mk-h2">{h.plan.title}</h2>
              <p className="mk-lead">{h.plan.body}</p>
              <Bullets items={h.plan.bullets} />
            </div>
            <PlanMock locale={locale} />
          </div>
          <div className="mk-split">
            <div>
              <span className="qk-eyebrow">{h.progress.eyebrow}</span>
              <h2 className="qk-h1 mk-h2">{h.progress.title}</h2>
              <p className="mk-lead">{h.progress.body}</p>
              <Link href={p('/features') + '#progress'} className="mk-more">{c.nav.features} {icon('arrow', 16)}</Link>
            </div>
            <Screenshot name="dashboard" locale={locale} alt={h.progress.imageAlt} tilt />
          </div>
        </div>
      </section>

      {/* SUBJECTS & GRADES */}
      <section id="subjects" className="mk-section">
        <div className="mk-container">
          <SectionHead eyebrow={h.subjects.eyebrow} title={h.subjects.title} sub={h.subjects.sub} />
          <div className="mk-grid mk-grid-4">
            {h.subjects.grades.map((g) => {
              const t = tone(g.tone);
              return (
                <div key={g.range} className="qk-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="mk-row" style={{ justifyContent: 'space-between' }}>
                    <span style={{ padding: '4px 12px', borderRadius: 999, background: t.bg, color: t.fg, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>{g.range}</span>
                    <Avatar id={g.avatar} size={42} />
                  </div>
                  <p className="mk-body" style={{ fontSize: 14.5 }}>{g.body}</p>
                </div>
              );
            })}
          </div>
          <ul className="mk-chips" style={{ listStyle: 'none', padding: 0 }}>
            {h.subjects.list.map((s) => (
              <li key={s.name} className="mk-chip"><span aria-hidden style={{ fontSize: 18 }}>{s.icon}</span>{s.name}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* SAFE BY DESIGN */}
      <section id="parents" className="mk-section mk-section-alt">
        <div className="mk-container">
          <SectionHead eyebrow={h.parents.eyebrow} title={h.parents.title} />
          <div className="mk-grid mk-grid-3" style={{ gap: 28 }}>
            {h.parents.items.map((it) => {
              const t = tone(it.tone);
              return (
                <div key={it.title} className="mk-tile">
                  <div className="mk-icon" style={{ background: t.bg, color: t.fg, width: 44, height: 44, borderRadius: 14 }}>{icon(it.icon, 21)}</div>
                  <h3 className="mk-h3" style={{ fontSize: 18 }}>{it.title}</h3>
                  <p className="mk-body" style={{ fontSize: 15 }}>{it.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mk-section">
        <div className="mk-container">
          <SectionHead eyebrow={h.pricing.eyebrow} title={h.pricing.title} sub={h.pricing.sub} />
          <PricingPlan locale={locale} />
          <div style={{ textAlign: 'center' }}>
            <Link href={p('/pricing')} className="mk-more">{h.pricing.link} {icon('arrow', 16)}</Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mk-section mk-section-alt">
        <div className="mk-narrow">
          <SectionHead title={h.faq.title} />
          <FaqList items={faqs} />
          <div style={{ textAlign: 'center' }}>
            <Link href={p('/faq')} className="mk-more">{h.faq.link} {icon('arrow', 16)}</Link>
          </div>
        </div>
      </section>

      <div style={{ height: 32 }} />
      <CtaBand locale={locale} />
    </MarketingShell>
  );
}

/** Organization, site and app markup. The FAQ markup lives on /faq only, so the same questions aren't marked up twice. */
function homeJsonLd(locale: Locale, description: string) {
  const url = SITE_URL + localePath(locale, '/');
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/apple-icon`,
        email: CONTACT_EMAIL,
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        inLanguage: ['en', 'es'],
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
      {
        '@type': 'SoftwareApplication',
        name: SITE_NAME,
        url,
        description,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web browser',
        inLanguage: ['en', 'es'],
        audience: { '@type': 'EducationalAudience', educationalRole: ['student', 'parent'] },
        offers: {
          '@type': 'Offer',
          price: PLAN_PRICES.monthly.base,
          priceCurrency: 'USD',
          url: SITE_URL + localePath(locale, '/pricing'),
        },
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
    ],
  };
}
