import { FEATURES, type FeatureVisual } from '@/content/features';
import type { Locale } from '@/lib/site';
import { MarketingShell } from '../MarketingShell';
import { PlacementMock, PlanMock, SchoolMock, TestMock } from '../Mockups';
import { Bullets, CtaBand, PageHero, Screenshot, SectionHead, icon, tone, type ShotName } from '../ui';

function Visual({ visual, locale, alt }: { visual: FeatureVisual; locale: Locale; alt: string }) {
  const [kind, name] = visual.split(':');
  if (kind === 'shot') return <Screenshot name={name as ShotName} locale={locale} alt={alt} />;
  if (name === 'school') return <SchoolMock locale={locale} />;
  if (name === 'plan') return <PlanMock locale={locale} />;
  if (name === 'placement') return <PlacementMock locale={locale} />;
  return <TestMock locale={locale} />;
}

export function FeaturesPage({ locale }: { locale: Locale }) {
  const f = FEATURES[locale];
  return (
    <MarketingShell locale={locale} page="/features">
      <PageHero locale={locale} eyebrow={f.eyebrow} title={f.title} sub={f.sub} crumb={f.eyebrow}>
        <nav className="mk-jump" aria-label={f.jump}>
          <span>{f.jump}:</span>
          {f.rows.map((r) => <a key={r.id} href={`#${r.id}`} className="qk-chip">{r.eyebrow}</a>)}
        </nav>
      </PageHero>

      <section className="mk-section" style={{ paddingTop: 40 }}>
        <div className="mk-container">
          {f.rows.map((r, i) => (
            <article key={r.id} id={r.id} className={`mk-split${i % 2 ? ' mk-split-reverse' : ''}`} style={{ scrollMarginTop: 96 }}>
              <div>
                <span className="qk-eyebrow">{r.eyebrow}</span>
                <h2 className="qk-h1 mk-h2">{r.title}</h2>
                <p className="mk-lead">{r.body}</p>
                <Bullets items={r.bullets} />
              </div>
              <Visual visual={r.visual} locale={locale} alt={r.alt} />
            </article>
          ))}
        </div>
      </section>

      <section className="mk-section mk-section-alt">
        <div className="mk-container">
          <SectionHead title={f.moreTitle} />
          <div className="mk-grid mk-grid-3">
            {f.more.map((m) => {
              const t = tone(m.tone);
              return (
                <div key={m.title} className="qk-card mk-tile" style={{ padding: 22 }}>
                  <div className="mk-icon" style={{ background: t.bg, color: t.fg, width: 44, height: 44, borderRadius: 14 }}>{icon(m.icon, 21)}</div>
                  <h3 className="mk-h3" style={{ fontSize: 18 }}>{m.title}</h3>
                  <p className="mk-body" style={{ fontSize: 15 }}>{m.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div style={{ height: 56 }} />
      <CtaBand locale={locale} />
    </MarketingShell>
  );
}
