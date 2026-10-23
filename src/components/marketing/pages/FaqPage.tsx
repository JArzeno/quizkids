import { FAQ, faqItems } from '@/content/faq';
import { CONTACT_EMAIL, type Locale } from '@/lib/site';
import { MarketingShell } from '../MarketingShell';
import { CtaBand, FaqList, JsonLd, PageHero } from '../ui';

export function FaqPage({ locale }: { locale: Locale }) {
  const f = FAQ[locale];
  return (
    <MarketingShell locale={locale} page="/faq">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems(locale).map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } })),
      }} />
      <PageHero locale={locale} eyebrow={f.eyebrow} title={f.title} sub={f.sub} crumb={f.eyebrow} />
      <section className="mk-section" style={{ paddingTop: 24 }}>
        <div className="mk-container">
          <div className="mk-col">
            {f.groups.map((g) => (
              <div key={g.title} className="mk-faq-group">
                <h2 className="qk-h2">{g.title}</h2>
                <FaqList items={g.items} />
              </div>
            ))}
            <p className="mk-body" style={{ marginTop: 40 }}>
              {f.contact} <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--primary-d)', fontWeight: 700 }}>{CONTACT_EMAIL}</a>
            </p>
          </div>
        </div>
      </section>
      <CtaBand locale={locale} />
    </MarketingShell>
  );
}
