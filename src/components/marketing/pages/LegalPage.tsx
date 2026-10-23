import { LEGAL_UI, type LegalDoc } from '@/content/legal';
import { CONTACT_EMAIL, type Locale, type SitePage } from '@/lib/site';
import { MarketingShell } from '../MarketingShell';
import { PageHero } from '../ui';

const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function LegalPage({ locale, page, doc }: { locale: Locale; page: SitePage; doc: LegalDoc }) {
  const ui = LEGAL_UI[locale];
  return (
    <MarketingShell locale={locale} page={page}>
      <PageHero locale={locale} eyebrow={doc.updated} title={doc.title} sub={doc.intro} crumb={doc.title} />
      <section className="mk-section" style={{ paddingTop: 8 }}>
        <div className="mk-container">
          <div className="mk-col mk-prose">
            <nav aria-label={ui.toc} className="qk-card" style={{ padding: '18px 22px' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{ui.toc}</div>
              <ol style={{ margin: '10px 0 0', paddingLeft: 20, lineHeight: 1.9 }}>
                {doc.sections.map((s) => <li key={s.title}><a href={`#${slug(s.title)}`}>{s.title}</a></li>)}
              </ol>
            </nav>
            {doc.sections.map((s) => (
              <div key={s.title}>
                <h2 id={slug(s.title)}>{s.title}</h2>
                {s.body.map((b) => <p key={b}>{b}</p>)}
              </div>
            ))}
            <p style={{ marginTop: 40 }}>{ui.contact} <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
