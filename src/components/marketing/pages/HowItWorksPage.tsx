import { Avatar } from '@/components/ui/Avatar';
import { HOW } from '@/content/howItWorks';
import type { Locale } from '@/lib/site';
import { MarketingShell } from '../MarketingShell';
import { CtaBand, PageHero, Screenshot, SectionHead, icon } from '../ui';
import { FEATURES } from '@/content/features';

export function HowItWorksPage({ locale }: { locale: Locale }) {
  const h = HOW[locale];
  const kidAlt = FEATURES[locale].rows.find((r) => r.visual === 'shot:kidhome')?.alt || '';
  return (
    <MarketingShell locale={locale} page="/how-it-works">
      <PageHero locale={locale} eyebrow={h.eyebrow} title={h.title} sub={h.sub} crumb={h.eyebrow} />

      <section className="mk-section" style={{ paddingTop: 32 }}>
        <div className="mk-container mk-split" style={{ alignItems: 'start' }}>
          <div>
            <span className="qk-eyebrow">{h.parentLabel}</span>
            <ol className="mk-timeline" style={{ marginTop: 24 }}>
              {h.parentSteps.map((s, i) => (
                <li key={s.title}>
                  <span className="mk-timeline-n" aria-hidden>{i + 1}</span>
                  <div className="qk-card" style={{ padding: 20 }}>
                    <div className="mk-row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <h2 className="mk-h3" style={{ fontSize: 20 }}>{s.title}</h2>
                      {s.time && <span className="mk-pill" style={{ fontSize: 12 }}>{icon('clock', 13)}{s.time}</span>}
                    </div>
                    <p className="mk-body" style={{ fontSize: 15, marginTop: 8 }}>{s.body}</p>
                    {s.bullets.length > 0 && (
                      <ul style={{ margin: '10px 0 0', paddingLeft: 18, color: 'var(--ink-2)', fontSize: 14.5, lineHeight: 1.6 }}>
                        {s.bullets.map((b) => <li key={b}>{b}</li>)}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div style={{ position: 'sticky', top: 96 }}>
            <span className="qk-eyebrow">{h.kidLabel}</span>
            <div style={{ marginTop: 24 }}>
              <Screenshot name="kidhome" locale={locale} alt={kidAlt} />
            </div>
            <div className="mk-grid" style={{ marginTop: 24, gap: 14 }}>
              {h.kidSteps.map((s, i) => (
                <div key={s.title} className="mk-row" style={{ alignItems: 'flex-start', gap: 14 }}>
                  <Avatar id={['fox', 'sprout', 'bee'][i]} size={40} />
                  <div>
                    <h2 className="mk-h3" style={{ fontSize: 17 }}>{s.title}</h2>
                    <p className="mk-body" style={{ fontSize: 15, marginTop: 4 }}>{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mk-section mk-section-alt">
        <div className="mk-narrow">
          <SectionHead title={h.dayTitle} sub={h.daySub} />
          <ol className="mk-timeline">
            {h.day.map((d) => (
              <li key={d.time} style={{ gridTemplateColumns: '84px 1fr', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--primary-d)' }}>{d.time}</span>
                <p className="qk-card mk-body" style={{ padding: '14px 18px', fontSize: 15.5 }}>{d.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div style={{ height: 56 }} />
      <CtaBand locale={locale} />
    </MarketingShell>
  );
}
