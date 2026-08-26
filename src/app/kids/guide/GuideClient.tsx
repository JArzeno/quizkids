'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ICONS } from '@/components/ui/Icons';
import { Avatar } from '@/components/ui/Avatar';
import { Btn } from '@/components/ui/Btn';
import { ImgPlaceholder } from '@/components/ui/Stars';
import { BarChart, LineChart } from '@/components/ui/Charts';
import { StudyTimerBadge } from '@/components/ui/SessionPill';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';
import { useAutoStudySession } from '@/lib/session';
import type { Guide, GuideExtra, Lang } from '@/types';

const FALLBACK: Guide = {
  intro: 'Our solar system is a giant family. The Sun sits in the middle, and 8 planets travel around it in big circles called orbits.',
  sections: [
    { title: 'The Sun is a star', body: 'The Sun is a huge ball of glowing gas. It gives us light and warmth. Without it, plants couldn\'t grow!', tone: 'honey', key: 'The Sun is a star — not a planet.' },
    { title: 'The 8 planets', body: 'In order from the Sun: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune. The first four are small and rocky. The last four are big balls of gas.', tone: 'primary', key: '8 planets orbit the Sun.' },
    { title: 'Earth is our home', body: 'Earth is the third planet from the Sun. It is the only one we know that has plants, animals, and people.', tone: 'sky', key: 'Earth is the only planet with life that we know of.' },
    { title: "Saturn's rings", body: "Saturn has thousands of rings made of ice and rock. Other gas planets have rings too, but Saturn's are the easiest to see.", tone: 'coral', key: "Saturn's rings are made of ice and rock." },
  ],
  fact: 'If you could drive a car to the Moon at highway speed, it would take you about 5 months without stopping!',
};

/** One "Learn more" block: deeper text, examples, new words, and a graph. */
function ExtraCard({ extra, index, lang, t }: { extra: GuideExtra; index: number; lang: Lang; t: (k: string) => string }) {
  const chart = extra.chart;
  const points = (chart?.points || [])
    .filter((p) => p && typeof p.value === 'number' && isFinite(p.value))
    .slice(0, 8)
    .map((p) => ({ label: String(p.label ?? ''), value: Math.round(p.value), hint: `${p.label}: ${p.value}${chart?.unit ? ' ' + chart.unit : ''}` }));

  return (
    <section className="qk-card qk-slide-up" style={{ padding: 24, borderColor: 'var(--sky)' }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 14, background: 'var(--sky-l)', color: 'var(--sky)', display: 'grid', placeItems: 'center', fontSize: 20 }}>🔎</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sky)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            {t('deepDive')} · {index + 1}
          </div>
          <h2 className="qk-h2" style={{ marginTop: 4 }}>{extra.title}</h2>
          <p style={{ marginTop: 10, fontSize: 17, lineHeight: 1.55, color: 'var(--ink)' }}>{extra.body}</p>
        </div>
      </div>

      {(extra.examples?.length || extra.vocab?.length) ? (
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: extra.examples?.length && extra.vocab?.length ? '1fr 1fr' : '1fr', gap: 12 }}>
          {!!extra.examples?.length && (
            <div style={{ padding: 14, borderRadius: 14, background: 'var(--surface-2)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{t('examples')}</div>
              <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)' }}>
                {extra.examples.slice(0, 4).map((ex, i) => <li key={i}>{ex}</li>)}
              </ul>
            </div>
          )}
          {!!extra.vocab?.length && (
            <div style={{ padding: 14, borderRadius: 14, background: 'var(--honey-l)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#7C5410', textTransform: 'uppercase', letterSpacing: '.06em' }}>{t('newWords')}</div>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {extra.vocab.slice(0, 4).map((v, i) => (
                  <div key={i} style={{ fontSize: 14, color: 'var(--ink)' }}>
                    <strong style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{v.term}</strong>
                    <span style={{ color: 'var(--ink-2)' }}> — {v.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {points.length >= 2 && (
        <div style={{ marginTop: 16, padding: 16, borderRadius: 16, background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{t('graphExample')}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, margin: '4px 0 12px' }}>
            {chart?.title}
            {chart?.unit ? <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500 }}> ({chart.unit})</span> : null}
          </div>
          {chart?.kind === 'line'
            ? <LineChart points={points} unit={chart?.unit ? ' ' + chart.unit : ''} toneName="sky" yMax={0} />
            : <BarChart points={points} toneName="sky" height={150} />}
          {chart?.caption && <div style={{ marginTop: 10, fontSize: 13, color: 'var(--ink-2)' }}>{chart.caption}</div>}
        </div>
      )}
    </section>
  );
}

export default function GuideClient() {
  const { lang, kids, activeKidId, studyParams, setMode, isDemo } = useStore();
  const t = useT(lang);
  const router = useRouter();
  const kid = kids.find((k) => k.id === activeKidId) || kids[0];

  React.useEffect(() => { setMode('kid'); }, []);

  // Opening a study starts the clock on its own — no button to remember.
  const timer = useAutoStudySession({
    kidId: kid?.id,
    subject: studyParams.subject,
    topic: studyParams.topic,
    activity: 'guide',
  });

  const [guide, setGuide] = React.useState<Guide | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [active, setActive] = React.useState(0);

  const [extras, setExtras] = React.useState<GuideExtra[]>([]);
  const [extraLoading, setExtraLoading] = React.useState(false);
  const [extraError, setExtraError] = React.useState(false);
  const [extraExhausted, setExtraExhausted] = React.useState(false);
  const extrasRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const fetchGuide = async () => {
      setLoading(true);
      setExtras([]);
      setExtraError(false);
      setExtraExhausted(false);
      try {
        // If we have a cached contentId, load from Supabase directly
        if (studyParams.contentId && !isDemo) {
          try {
            const supabase = createClient();
            const { data } = await supabase
              .from('generated_content')
              .select('content')
              .eq('id', studyParams.contentId)
              .single();
            if (data?.content) {
              setGuide(data.content as Guide);
              setLoading(false);
              return;
            }
          } catch (e) {
            console.warn('Could not load cached guide:', e);
          }
        }

        // Call API (which also checks cache server-side)
        const res = await fetch('/api/generate/guide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: studyParams.topic,
            grade: studyParams.grade,
            lang,
            subject: studyParams.subject,
          }),
        });
        if (res.ok) setGuide(await res.json());
        else setGuide(FALLBACK);
      } catch {
        setGuide(FALLBACK);
      }
      setLoading(false);
    };
    fetchGuide();
  }, [studyParams.topic, studyParams.grade, studyParams.contentId, lang]);

  /**
   * "Learn more" — pulls extra information for the whole topic, or for one section
   * when the kid taps it from inside that section.
   */
  const learnMore = async (focus?: string) => {
    if (extraLoading) return;
    setExtraLoading(true);
    setExtraError(false);
    try {
      const res = await fetch('/api/generate/learn-more', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: studyParams.topic,
          grade: studyParams.grade,
          lang,
          subject: studyParams.subject,
          focus,
        }),
      });
      if (!res.ok) throw new Error('learn-more failed');
      const data = await res.json();
      const incoming: GuideExtra[] = Array.isArray(data.extras) ? data.extras : [];
      const fresh = incoming.filter((e) => e?.title && e?.body && !extras.some((x) => x.title === e.title));
      if (!fresh.length) setExtraExhausted(true);
      else setExtras((prev) => [...prev, ...fresh]);
      requestAnimationFrame(() => extrasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch (e) {
      console.warn(e);
      setExtraError(true);
    }
    setExtraLoading(false);
  };

  /** Next whole-topic round focuses on a section we haven't deep-dived yet. */
  const nextFocus = (): string | undefined => {
    const covered = new Set(extras.map((e) => e.title.toLowerCase()));
    const section = (guide?.sections || []).find((s) => !covered.has(s.title.toLowerCase()));
    return section?.title;
  };

  if (loading) return (
    <AppShell>
      <div className="qk-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
        <div className="qk-progress" style={{ width: 280 }}><span style={{ width: '60%', animation: 'qk-pulse 1.2s ease infinite' }} /></div>
        <div style={{ fontSize: 16, color: 'var(--ink-3)', fontFamily: 'var(--font-display)' }}>{t('generating')}</div>
      </div>
    </AppShell>
  );
  if (!guide) return null;

  return (
    <AppShell>
      <div className="qk-screen qk-page-enter" style={{ padding: 0, minHeight: 'calc(100dvh - 65px)' }}>
        {/* kid bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px 0', maxWidth: 1100, margin: '0 auto', width: '100%', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={() => router.push('/kids/home')} className="qk-btn qk-btn-ghost" style={{ padding: '8px 12px' }}>{ICONS.back} <span>{t('back')}</span></button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <StudyTimerBadge lang={lang} timer={timer} onTogglePause={timer.toggle} />
            {kid && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 12px 4px 4px', borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--line)' }}>
                <Avatar id={kid.avatar} size={32} />
                <div>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{kid.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--ink-3)', marginLeft: 6 }}>
                    {lang === 'es' ? 'Grado ' : 'Gr.'}{studyParams.grade}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '24px auto 0', padding: '0 22px 64px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <span className="qk-eyebrow">{t(studyParams.subject)} · {lang === 'es' ? 'Grado ' : 'Grade '}{studyParams.grade}</span>
              <h1 className="qk-h1" style={{ marginTop: 10 }}>{studyParams.topic}</h1>
              <p className="qk-sub">{guide.intro}</p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Btn kind="ghost" icon={ICONS.speaker}>{t('listen')}</Btn>
              <Btn kind="ghost" icon={ICONS.printer} onClick={() => router.push('/kids/pdf')}>{t('print')}</Btn>
            </div>
          </div>

          <div className="qk-kid-guide-grid" style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24 }}>
            {/* TOC */}
            <aside style={{ position: 'sticky', top: 0, alignSelf: 'flex-start' }}>
              <div className="qk-label" style={{ marginBottom: 10 }}>{t('onThisPage')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {guide.sections.map((s, idx) => (
                  <button key={idx} onClick={() => setActive(idx)}
                    style={{ appearance: 'none', textAlign: 'left', padding: '10px 12px', borderRadius: 12, background: active === idx ? 'var(--primary-l)' : 'transparent', border: '1.5px solid ' + (active === idx ? 'var(--primary)' : 'transparent'), cursor: 'pointer', fontWeight: 600, fontSize: 14, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 10, transition: 'all .15s ease' }}>
                    <span style={{ width: 24, height: 24, borderRadius: 8, background: active === idx ? 'var(--primary)' : 'var(--surface-2)', color: active === idx ? '#fff' : 'var(--ink-3)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700 }}>{idx + 1}</span>
                    {s.title}
                  </button>
                ))}
                {extras.length > 0 && (
                  <button onClick={() => extrasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    style={{ appearance: 'none', textAlign: 'left', padding: '10px 12px', borderRadius: 12, background: 'var(--sky-l)', border: '1.5px solid var(--sky)', cursor: 'pointer', fontWeight: 700, fontSize: 14, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 24, height: 24, borderRadius: 8, background: 'var(--sky)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 12 }}>+{extras.length}</span>
                    {t('deepDive')}
                  </button>
                )}
              </div>
              <div style={{ marginTop: 18, padding: 14, background: 'var(--honey-l)', borderRadius: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#7C5410', textTransform: 'uppercase', letterSpacing: '.06em' }}>{t('didYouKnow')}</div>
                <div style={{ marginTop: 6, fontSize: 14, color: 'var(--ink)' }}>{guide.fact}</div>
              </div>
            </aside>

            {/* content */}
            <article className="qk-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {guide.sections.map((s, idx) => {
                const toneBg = `var(--${s.tone === 'primary' ? 'primary-l' : s.tone + '-l'})`;
                const toneFg = `var(--${s.tone === 'primary' ? 'primary' : s.tone})`;
                return (
                  <section key={idx} className="qk-card" style={{ padding: 24 }} onMouseEnter={() => setActive(idx)}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 14, background: toneBg, color: toneFg, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>{idx + 1}</div>
                      <div style={{ flex: 1 }}>
                        <h2 className="qk-h2">{s.title}</h2>
                        <p style={{ marginTop: 10, fontSize: 17, lineHeight: 1.55, color: 'var(--ink)' }}>{s.body}</p>
                      </div>
                    </div>
                    <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
                      <ImgPlaceholder label={`[ ${lang === 'es' ? 'ilustración' : 'illustration'}: ${s.title.toLowerCase()} ]`} h={150} tone={s.tone} />
                      <div style={{ padding: 16, borderRadius: 14, background: toneBg, borderLeft: `4px solid ${toneFg}` }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: toneFg, textTransform: 'uppercase', letterSpacing: '.06em' }}>{t('keyIdea')}</div>
                        <div style={{ marginTop: 6, fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 18, lineHeight: 1.3 }}>{s.key}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                      <button onClick={() => learnMore(s.title)} disabled={extraLoading} className="qk-btn qk-btn-ghost"
                        style={{ fontSize: 13, padding: '8px 12px', opacity: extraLoading ? .6 : 1 }}>
                        {React.cloneElement(ICONS.spark as React.ReactElement<{ size?: number }>, { size: 14 })}
                        <span>{extraLoading ? t('learnMoreLoading') : t('learnMore')}</span>
                      </button>
                    </div>
                  </section>
                );
              })}

              {/* learn-more results */}
              <div ref={extrasRef} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {extras.map((e, i) => <ExtraCard key={e.title + i} extra={e} index={i} lang={lang} t={t} />)}
              </div>

              {/* learn more / quiz CTA */}
              <section className="qk-card" style={{ padding: 24, background: 'var(--sky-l)', borderColor: 'var(--sky)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 18, background: 'var(--sky)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 26 }}>🔎</div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <h2 className="qk-h2">{t('learnMore')}</h2>
                    <p style={{ margin: '4px 0 0', fontSize: 15, color: 'var(--ink-2)' }}>
                      {extraError ? t('learnMoreFailed') : extraExhausted ? t('learnMoreDone') : t('learnMoreSub')}
                    </p>
                  </div>
                  <Btn kind="primary" icon={ICONS.spark} disabled={extraLoading} onClick={() => learnMore(nextFocus())}
                    style={{ opacity: extraLoading ? .6 : 1 }}>
                    {extraLoading ? t('learnMoreLoading') : extras.length ? t('learnMoreMore') : t('learnMore')}
                  </Btn>
                </div>
              </section>

              <section className="qk-card" style={{ padding: 24, background: 'var(--primary-l)', borderColor: 'var(--primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 18, background: 'var(--primary)', color: '#fff', display: 'grid', placeItems: 'center' }}>{ICONS.spark}</div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <h2 className="qk-h2">{t('tryIt')}</h2>
                    <p style={{ margin: '4px 0 0', fontSize: 15, color: 'var(--ink-2)' }}>
                      {lang === 'es' ? 'Pon a prueba lo que aprendiste con un quiz de 8 tarjetas.' : 'Test what you just learned with an 8-card quiz.'}
                    </p>
                  </div>
                  <Btn kind="primary" icon={ICONS.cards} onClick={() => router.push('/kids/quiz')}>{t('genQuiz')}</Btn>
                </div>
              </section>
            </article>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
