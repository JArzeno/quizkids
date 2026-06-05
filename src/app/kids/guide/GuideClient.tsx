'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ICONS } from '@/components/ui/Icons';
import { Avatar } from '@/components/ui/Avatar';
import { Btn } from '@/components/ui/Btn';
import { ImgPlaceholder } from '@/components/ui/Stars';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import type { Guide } from '@/types';

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

export default function GuideClient() {
  const { lang, kids, activeKidId, studyParams, gamification } = useStore();
  const t = useT(lang);
  const router = useRouter();
  const kid = kids.find((k) => k.id === activeKidId) || kids[0];

  const [guide, setGuide] = React.useState<Guide | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    const fetchGuide = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/generate/guide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: studyParams.topic, grade: studyParams.grade, lang }),
        });
        if (res.ok) setGuide(await res.json());
        else setGuide(FALLBACK);
      } catch { setGuide(FALLBACK); }
      setLoading(false);
    };
    fetchGuide();
  }, [studyParams.topic, studyParams.grade, lang]);

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px 0', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          <button onClick={() => router.push('/kids/home')} className="qk-btn qk-btn-ghost" style={{ padding: '8px 12px' }}>{ICONS.back} <span>{t('back')}</span></button>
          {kid && <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 12px 4px 4px', borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--line)' }}><Avatar id={kid.avatar} size={32} /><span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{kid.name}</span></div>}
        </div>

        <div style={{ maxWidth: 1100, margin: '24px auto 0', padding: '0 22px 64px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <span className="qk-eyebrow">{t(studyParams.subject)} · {lang === 'es' ? 'Grado ' : 'Grade '}{studyParams.grade}</span>
              <h1 className="qk-h1" style={{ marginTop: 10 }}>{studyParams.topic}</h1>
              <p className="qk-sub">{guide.intro}</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn kind="ghost" icon={ICONS.speaker}>{t('listen')}</Btn>
              <Btn kind="ghost" icon={ICONS.printer} onClick={() => router.push('/kids/pdf')}>{t('print')}</Btn>
            </div>
          </div>

          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24 }}>
            {/* TOC */}
            <aside style={{ position: 'sticky', top: 0, alignSelf: 'flex-start' }}>
              <div className="qk-label" style={{ marginBottom: 10 }}>{t('onThisPage')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {guide.sections.map((s, idx) => (
                  <button key={idx} onClick={() => setActive(idx)} style={{ appearance: 'none', textAlign: 'left', padding: '10px 12px', borderRadius: 12, background: active === idx ? 'var(--primary-l)' : 'transparent', border: '1.5px solid ' + (active === idx ? 'var(--primary)' : 'transparent'), cursor: 'pointer', fontWeight: 600, fontSize: 14, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 10, transition: 'all .15s ease' }}>
                    <span style={{ width: 24, height: 24, borderRadius: 8, background: active === idx ? 'var(--primary)' : 'var(--surface-2)', color: active === idx ? '#fff' : 'var(--ink-3)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700 }}>{idx + 1}</span>
                    {s.title}
                  </button>
                ))}
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
                  </section>
                );
              })}

              <section className="qk-card" style={{ padding: 24, background: 'var(--primary-l)', borderColor: 'var(--primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 18, background: 'var(--primary)', color: '#fff', display: 'grid', placeItems: 'center' }}>{ICONS.spark}</div>
                  <div style={{ flex: 1 }}>
                    <h2 className="qk-h2">{t('tryIt')}</h2>
                    <p style={{ margin: '4px 0 0', fontSize: 15, color: 'var(--ink-2)' }}>{lang === 'es' ? 'Pon a prueba lo que aprendiste con un quiz de 8 tarjetas.' : 'Test what you just learned with an 8-card quiz.'}</p>
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
