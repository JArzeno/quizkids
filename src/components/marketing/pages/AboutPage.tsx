import { Avatar } from '@/components/ui/Avatar';
import { ABOUT } from '@/content/about';
import { CONTACT_EMAIL, type Locale } from '@/lib/site';
import { MarketingShell } from '../MarketingShell';
import { CtaBand, PageHero, SectionHead, icon, tone } from '../ui';

export function AboutPage({ locale }: { locale: Locale }) {
  const a = ABOUT[locale];
  return (
    <MarketingShell locale={locale} page="/about">
      <PageHero locale={locale} eyebrow={a.eyebrow} title={a.title} sub={a.lead} crumb={a.eyebrow} />

      <section className="mk-section" style={{ paddingTop: 24 }}>
        <div className="mk-container mk-split">
          <div>
            <h2 className="qk-h1 mk-h2" style={{ marginTop: 0 }}>{a.missionTitle}</h2>
            {a.mission.map((m) => <p key={m} className="mk-lead">{m}</p>)}
          </div>
          <div className="mk-mock" aria-hidden style={{ minHeight: 320, display: 'grid', placeItems: 'center' }}>
            <div className="mk-mock-bg" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: 14 }}>
              {['sprout', 'acorn', 'bee', 'fox', 'bear', 'owl', 'frog', 'mush'].map((id, i) => (
                <div key={id} style={{ transform: `rotate(${(i % 2 ? 1 : -1) * (3 + (i % 3) * 2)}deg) translateY(${i % 2 ? 10 : 0}px)` }}>
                  <Avatar id={id} size={72} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mk-section mk-section-alt">
        <div className="mk-container">
          <SectionHead title={a.principlesTitle} />
          <div className="mk-grid mk-grid-2" style={{ gap: 20 }}>
            {a.principles.map((p) => {
              const t = tone(p.tone);
              return (
                <div key={p.title} className="qk-card mk-tile" style={{ padding: 24 }}>
                  <div className="mk-icon" style={{ background: t.bg, color: t.fg }}>{icon(p.icon, 22)}</div>
                  <h3 className="mk-h3">{p.title}</h3>
                  <p className="mk-body" style={{ fontSize: 15 }}>{p.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mk-section">
        <div className="mk-container">
          <SectionHead title={a.forTitle} />
          <div className="mk-grid mk-grid-3">
            {a.forWho.map((w) => (
              <div key={w.title} className="mk-tile">
                <h3 className="mk-h3" style={{ fontSize: 19 }}>{w.title}</h3>
                <p className="mk-body" style={{ fontSize: 15 }}>{w.body}</p>
              </div>
            ))}
          </div>
          <div className="qk-card" style={{ marginTop: 56, padding: 28, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div>
              <h2 className="mk-h3">{a.contactTitle}</h2>
              <p className="mk-body" style={{ marginTop: 6 }}>{a.contactBody}</p>
            </div>
            <a href={`mailto:${CONTACT_EMAIL}`} className="qk-btn qk-btn-ghost">{icon('mail', 18)}{CONTACT_EMAIL}</a>
          </div>
        </div>
      </section>

      <CtaBand locale={locale} />
    </MarketingShell>
  );
}
