'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ICONS } from '@/components/ui/Icons';
import { Avatar } from '@/components/ui/Avatar';
import { Btn, Chip } from '@/components/ui/Btn';
import { ImgPlaceholder } from '@/components/ui/Stars';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/store';
import { completePlanItem } from '@/lib/plan';
import { useT } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';
import type { Guide, GuideSection } from '@/types';

const FALLBACK_EN: Guide = {
  intro: 'Our solar system is a giant family. The Sun sits in the middle, and 8 planets travel around it in big circles called orbits.',
  sections: [
    { title: 'The Sun is a star', body: 'The Sun is a huge ball of glowing gas. It gives us light and warmth. Without it, plants couldn\'t grow!', tone: 'honey', key: 'The Sun is a star — not a planet.' },
    { title: 'The 8 planets', body: 'In order from the Sun: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune. The first four are small and rocky. The last four are big balls of gas.', tone: 'primary', key: '8 planets orbit the Sun.' },
    { title: 'Earth is our home', body: 'Earth is the third planet from the Sun. It is the only one we know that has plants, animals, and people.', tone: 'sky', key: 'Earth is the only planet with life that we know of.' },
    { title: "Saturn's rings", body: "Saturn has thousands of rings made of ice and rock. Other gas planets have rings too, but Saturn's are the easiest to see.", tone: 'coral', key: "Saturn's rings are made of ice and rock." },
  ],
  fact: 'If you could drive a car to the Moon at highway speed, it would take you about 5 months without stopping!',
};

const FALLBACK_ES: Guide = {
  intro: 'Nuestro sistema solar es una gran familia. El Sol está en el centro y 8 planetas viajan a su alrededor en grandes círculos llamados órbitas.',
  sections: [
    { title: 'El Sol es una estrella', body: 'El Sol es una enorme bola de gas brillante. Nos da luz y calor. ¡Sin él, las plantas no podrían crecer!', tone: 'honey', key: 'El Sol es una estrella, no un planeta.' },
    { title: 'Los 8 planetas', body: 'En orden desde el Sol: Mercurio, Venus, Tierra, Marte, Júpiter, Saturno, Urano y Neptuno. Los primeros cuatro son pequeños y rocosos. Los últimos cuatro son grandes bolas de gas.', tone: 'primary', key: '8 planetas giran alrededor del Sol.' },
    { title: 'La Tierra es nuestro hogar', body: 'La Tierra es el tercer planeta desde el Sol. Es el único que conocemos que tiene plantas, animales y personas.', tone: 'sky', key: 'La Tierra es el único planeta con vida que conocemos.' },
    { title: 'Los anillos de Saturno', body: 'Saturno tiene miles de anillos hechos de hielo y roca. Otros planetas de gas también tienen anillos, pero los de Saturno son los más fáciles de ver.', tone: 'coral', key: 'Los anillos de Saturno son de hielo y roca.' },
  ],
  fact: '¡Si pudieras ir en carro a la Luna a velocidad de autopista, tardarías unos 5 meses sin parar!',
};

/** Cap on "keep learning" sections per visit */
const MAX_EXTRA = 6;

export default function GuideClient() {
  const { lang, kids, activeKidId, studyParams, setStudyParams, gamification, setMode, isDemo } = useStore();
  const contentLang = studyParams.contentLang ?? lang;
  const [marked, setMarked] = React.useState(false);
  const t = useT(lang);
  const FALLBACK = lang === 'es' ? FALLBACK_ES : FALLBACK_EN;
  const router = useRouter();
  const kid = kids.find((k) => k.id === activeKidId) || kids[0];

  React.useEffect(() => { setMode('kid'); }, []);

  const [guide, setGuide] = React.useState<Guide | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [active, setActive] = React.useState(0);
  // Sections the kid asked for with "keep learning", appended after the guide
  const [extra, setExtra] = React.useState<GuideSection[]>([]);
  const [related, setRelated] = React.useState<string[]>([]);
  const [moreLoading, setMoreLoading] = React.useState<string | null>(null);
  const [moreError, setMoreError] = React.useState(false);

  React.useEffect(() => {
    setExtra([]);
    setRelated(guide?.related || []);
    setMoreError(false);
  }, [guide]);

  React.useEffect(() => {
    const fetchGuide = async () => {
      setLoading(true);
      try {
        // If we have a cached contentId, load from Supabase directly
        if (studyParams.contentId && !isDemo) {
          try {
            const supabase = createClient();
            const { data } = await supabase
              .from('generated_content')
              .select('content, lang')
              .eq('id', studyParams.contentId)
              .single();
            // Only reuse assigned content if it is in the account's current language
            if (data?.content && (data.lang || 'en') === contentLang) {
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
            lang: contentLang,
            subject: studyParams.subject,
            source: studyParams.source,
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
  }, [studyParams.topic, studyParams.grade, studyParams.contentId, lang, contentLang]);

  if (loading) return (
    <AppShell>
      <div className="qk-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
        <div className="qk-progress" style={{ width: 'min(280px, 100%)' }}><span style={{ width: '60%', animation: 'qk-pulse 1.2s ease infinite' }} /></div>
        <div style={{ fontSize: 16, color: 'var(--ink-3)', fontFamily: 'var(--font-display)' }}>{t('generating')}</div>
      </div>
    </AppShell>
  );
  if (!guide) return null;

  const allSections = [...guide.sections, ...extra];
  const goTo = (idx: number) => {
    setActive(idx);
    document.getElementById(`guide-sec-${idx}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const askMore = async (focus?: string) => {
    if (moreLoading != null) return;
    setMoreLoading(focus ?? '');
    setMoreError(false);
    try {
      const res = await fetch('/api/generate/guide/more', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: studyParams.topic,
          grade: studyParams.grade,
          lang: contentLang,
          source: studyParams.source,
          focus,
          covered: allSections.map((x) => x.title),
        }),
      });
      if (!res.ok) throw new Error('more failed');
      const data = (await res.json()) as { sections?: GuideSection[]; related?: string[] };
      if (!data.sections?.length) throw new Error('no sections');
      const first = allSections.length;
      setExtra((e) => [...e, ...data.sections!]);
      setRelated((r) => {
        const left = r.filter((x) => x !== focus);
        return [...left, ...(data.related || []).filter((x) => !left.includes(x))].slice(0, 4);
      });
      setTimeout(() => goTo(first), 60);
    } catch {
      setMoreError(true);
    }
    setMoreLoading(null);
  };

  const renderSection = (s: GuideSection, idx: number, isNew: boolean) => {
    const toneBg = `var(--${s.tone === 'primary' ? 'primary-l' : s.tone + '-l'})`;
    const toneFg = `var(--${s.tone === 'primary' ? 'primary' : s.tone})`;
    return (
      <section key={idx} id={`guide-sec-${idx}`} className="qk-card" style={{ padding: 'clamp(18px, 4vw, 24px)', scrollMarginTop: 16 }} onMouseEnter={() => setActive(idx)}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 14, background: toneBg, color: toneFg, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>{idx + 1}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="qk-h2">
              {s.title}
              {isNew && <span style={{ marginLeft: 10, verticalAlign: 'middle', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: toneBg, color: toneFg, textTransform: 'uppercase', letterSpacing: '.06em' }}>{t('guideMoreNew')}</span>}
            </h2>
            {s.body.split(/\n\s*\n/).map((para, pi) => (
              <p key={pi} style={{ marginTop: pi === 0 ? 10 : 12, marginBottom: 0, fontSize: 17, lineHeight: 1.55, color: 'var(--ink)' }}>{para.trim()}</p>
            ))}
          </div>
        </div>
        {s.example && (
          <div style={{ marginTop: 16, padding: 16, borderRadius: 14, background: 'var(--surface-2)', border: '1.5px dashed var(--line)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: toneFg, textTransform: 'uppercase', letterSpacing: '.06em' }}>{t('guideExample')}</div>
            <div style={{ marginTop: 6, fontSize: 16, lineHeight: 1.5, color: 'var(--ink)', whiteSpace: 'pre-line' }}>{s.example}</div>
          </div>
        )}
        <div className="qk-stack-sm" style={{ marginTop: 18, display: 'grid', gridTemplateColumns: s.key ? '1.4fr 1fr' : '1fr', gap: 14 }}>
          <ImgPlaceholder label={`[ ${lang === 'es' ? 'ilustración' : 'illustration'}: ${s.title.toLowerCase()} ]`} h={150} tone={s.tone} />
          {s.key && (
            <div style={{ padding: 16, borderRadius: 14, background: toneBg, borderLeft: `4px solid ${toneFg}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: toneFg, textTransform: 'uppercase', letterSpacing: '.06em' }}>{t('keyIdea')}</div>
              <div style={{ marginTop: 6, fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 18, lineHeight: 1.3 }}>{s.key}</div>
            </div>
          )}
        </div>
      </section>
    );
  };

  return (
    <AppShell>
      <div className="qk-screen qk-page-enter" style={{ padding: 0, minHeight: 'calc(100dvh - 65px)' }}>
        {/* kid bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '14px clamp(16px, 4vw, 22px) 0', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          <button onClick={() => router.push('/kids/home')} className="qk-btn qk-btn-ghost" style={{ padding: '8px 12px' }}>{ICONS.back} <span>{t('back')}</span></button>
          {kid && (
            <div className="qk-hide-xs" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 12px 4px 4px', borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--line)', whiteSpace: 'nowrap' }}>
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

        <div style={{ maxWidth: 1100, margin: '24px auto 0', padding: '0 clamp(16px, 4vw, 22px) 64px' }}>
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

          <div className="qk-stack-md" style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '260px minmax(0, 1fr)', gap: 24 }}>
            {/* TOC */}
            <aside style={{ position: 'sticky', top: 0, alignSelf: 'flex-start' }}>
              <div className="qk-label qk-hide-md" style={{ marginBottom: 10 }}>{t('onThisPage')}</div>
              <div className="qk-hide-md" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {allSections.map((s, idx) => (
                  <button key={idx} onClick={() => goTo(idx)}
                    style={{ appearance: 'none', textAlign: 'left', padding: '10px 12px', borderRadius: 12, background: active === idx ? 'var(--primary-l)' : 'transparent', border: '1.5px solid ' + (active === idx ? 'var(--primary)' : 'transparent'), cursor: 'pointer', fontWeight: 600, fontSize: 14, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 10, transition: 'all .15s ease' }}>
                    <span style={{ width: 24, height: 24, flexShrink: 0, borderRadius: 8, background: active === idx ? 'var(--primary)' : 'var(--surface-2)', color: active === idx ? '#fff' : 'var(--ink-3)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700 }}>{idx + 1}</span>
                    {s.title}
                  </button>
                ))}
              </div>
              <div className="qk-guide-fact" style={{ marginTop: 18, padding: 14, background: 'var(--honey-l)', borderRadius: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#7C5410', textTransform: 'uppercase', letterSpacing: '.06em' }}>{t('didYouKnow')}</div>
                <div style={{ marginTop: 6, fontSize: 14, color: 'var(--ink)' }}>{guide.fact}</div>
              </div>
            </aside>

            {/* content */}
            <article className="qk-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {guide.sections.map((s, idx) => renderSection(s, idx, false))}

              {!!guide.vocab?.length && (
                <section className="qk-card" style={{ padding: 'clamp(18px, 4vw, 24px)' }}>
                  <h2 className="qk-h2">{t('guideVocab')}</h2>
                  <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))', gap: 10 }}>
                    {guide.vocab.map((v, vi) => (
                      <div key={vi} style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--surface-2)' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16 }}>{v.term}</div>
                        <div style={{ marginTop: 4, fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.45 }}>{v.def}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {!!guide.recap?.length && (
                <section className="qk-card" style={{ padding: 'clamp(18px, 4vw, 24px)', background: 'var(--sky-l)' }}>
                  <h2 className="qk-h2">{t('guideRecap')}</h2>
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {guide.recap.map((r, ri) => (
                      <div key={ri} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 16, lineHeight: 1.45 }}>
                        <span style={{ color: 'var(--sky)', flexShrink: 0, marginTop: 1 }}>{ICONS.check}</span>
                        <span style={{ minWidth: 0 }}>{r}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {extra.map((s, i) => renderSection(s, guide.sections.length + i, true))}

              {extra.length < MAX_EXTRA && (
                <section className="qk-card" style={{ padding: 'clamp(18px, 4vw, 24px)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 16, background: 'var(--honey-l)', color: '#7C5410', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{ICONS.book}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h2 className="qk-h2">{t('guideMoreTitle')}</h2>
                      <p style={{ margin: '4px 0 0', fontSize: 15, color: 'var(--ink-2)' }}>{t('guideMoreSub')}</p>
                    </div>
                  </div>
                  <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {related.map((r) => (
                      <Chip key={r} on={moreLoading === r} onClick={() => askMore(r)}>{moreLoading === r ? t('generating') : r}</Chip>
                    ))}
                    <Btn kind="soft" icon={ICONS.plus} disabled={moreLoading != null} onClick={() => askMore()}>{moreLoading === '' ? t('generating') : t('guideMoreBtn')}</Btn>
                  </div>
                  {moreError && <div style={{ marginTop: 10, fontSize: 14, color: 'var(--coral)' }}>{t('guideMoreError')}</div>}
                </section>
              )}

              {studyParams.planItemId && (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <Btn kind="primary" icon={ICONS.check} disabled={marked} onClick={() => { setMarked(true); void completePlanItem(studyParams.planItemId!, isDemo); router.push('/kids/home'); }}>{t('planMarkDone')}</Btn>
                </div>
              )}

              <section className="qk-card" style={{ padding: 'clamp(18px, 4vw, 24px)', background: 'var(--primary-l)', borderColor: 'var(--primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                  <div style={{ width: 56, height: 56, flexShrink: 0, borderRadius: 18, background: 'var(--primary)', color: '#fff', display: 'grid', placeItems: 'center' }}>{ICONS.spark}</div>
                  <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                    <h2 className="qk-h2">{t('tryIt')}</h2>
                    <p style={{ margin: '4px 0 0', fontSize: 15, color: 'var(--ink-2)' }}>
                      {lang === 'es' ? 'Pon a prueba lo que aprendiste con un quiz de 8 tarjetas.' : 'Test what you just learned with an 8-card quiz.'}
                    </p>
                  </div>
                  <Btn kind="primary" icon={ICONS.cards} className="qk-full-sm" onClick={() => { setStudyParams({ ...studyParams, contentId: undefined, planItemId: undefined }); router.push('/kids/quiz'); }}>{t('genQuiz')}</Btn>
                </div>
              </section>
            </article>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
