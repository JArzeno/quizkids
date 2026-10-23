import { PRICING } from '@/content/pricing';
import { faqItems } from '@/content/faq';
import { SITE_NAME, SITE_URL, localePath, type Locale } from '@/lib/site';
import { PLAN_PRICES, planTotal } from '@/lib/pricing';
import { MarketingShell } from '../MarketingShell';
import { PricingPlan } from '../PricingPlan';
import { Bullets, CtaBand, FaqList, JsonLd, PageHero, SectionHead } from '../ui';

export function PricingPage({ locale }: { locale: Locale }) {
  const pr = PRICING[locale];
  const faqs = faqItems(locale, pr.faqIds);
  return (
    <MarketingShell locale={locale} page="/pricing">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: `${SITE_NAME} Family plan`,
        description: pr.metaDescription,
        brand: { '@type': 'Brand', name: SITE_NAME },
        offers: [
          { '@type': 'Offer', name: pr.monthly, price: PLAN_PRICES.monthly.base, priceCurrency: 'USD', url: SITE_URL + localePath(locale, '/pricing') },
          { '@type': 'Offer', name: pr.yearly, price: PLAN_PRICES.yearly.base, priceCurrency: 'USD', url: SITE_URL + localePath(locale, '/pricing') },
        ],
      }} />
      <PageHero locale={locale} eyebrow={pr.eyebrow} title={pr.title} sub={pr.sub} crumb={pr.eyebrow} />

      <section className="mk-section" style={{ paddingTop: 24 }}>
        <div className="mk-container mk-split" style={{ alignItems: 'start' }}>
          <PricingPlan locale={locale} />
          <div>
            <h2 className="qk-h1 mk-h2" style={{ marginTop: 0 }}>{pr.includedTitle}</h2>
            <Bullets items={pr.included} />
          </div>
        </div>
      </section>

      <section className="mk-section mk-section-alt">
        <div className="mk-narrow">
          <SectionHead title={pr.tableTitle} sub={pr.tableSub} />
          <table className="mk-table">
            <thead>
              <tr><th scope="col">{pr.kids}</th><th scope="col">{pr.monthly}</th><th scope="col">{pr.yearly}</th></tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4].map((n) => (
                <tr key={n}>
                  <td>{pr.kidCount(n)}</td>
                  <td>${planTotal('monthly', n)}{pr.perMonth}</td>
                  <td>${planTotal('yearly', n)}{pr.perYear}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ marginTop: 12, fontSize: 13, color: 'var(--ink-3)', textAlign: 'center' }}>{pr.note}</p>
        </div>
      </section>

      <section className="mk-section">
        <div className="mk-narrow">
          <SectionHead title={pr.faqTitle} />
          <FaqList items={faqs} />
        </div>
      </section>

      <CtaBand locale={locale} />
    </MarketingShell>
  );
}
