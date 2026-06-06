'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ICONS } from '@/components/ui/Icons';
import { Avatar } from '@/components/ui/Avatar';
import { Btn } from '@/components/ui/Btn';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';

export default function GenerateClient() {
  const { lang, kids, activeKidId, studyParams, difficulty, setMode, updateKid } = useStore();
  const t = useT(lang);
  const router = useRouter();
  const kid = kids.find((k) => k.id === activeKidId) || kids[0];
  const [genState, setGenState] = React.useState<'quiz' | 'guide' | 'pdf' | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [done, setDone] = React.useState<'quiz' | 'guide' | 'pdf' | null>(null);

  React.useEffect(() => {
    if (!genState) return;
    setProgress(0);
    let p = 0;
    const i = setInterval(() => {
      p += Math.random() * 18 + 6;
      if (p >= 100) {
        p = 100;
        clearInterval(i);
        setTimeout(() => {
          if (kid) {
            const newItem = { kind: genState, title: studyParams.topic, when: 'Today', score: 0 };
            updateKid(kid.id, { recent: [newItem, ...(kid.recent || [])].slice(0, 6) });
          }
          setDone(genState);
          setGenState(null);
          setProgress(0);
        }, 380);
      }
      setProgress(p);
    }, 220);
    return () => clearInterval(i);
  }, [genState]);

  const difficultyLabel = { easy: lang === 'es' ? 'Fácil' : 'Easy', medium: lang === 'es' ? 'Medio' : 'Medium', hard: lang === 'es' ? 'Difícil' : 'Hard' }[difficulty];

  return (
    <AppShell>
      <div className="qk-screen qk-page-enter">
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <button className="qk-btn qk-btn-ghost" onClick={() => { setDone(null); router.push('/dashboard/picker'); }}>{ICONS.back} <span>{t('back')}</span></button>

          <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span className="qk-eyebrow">{t(studyParams.subject)} · {lang === 'es' ? 'Grado ' : 'Grade '}{studyParams.grade}</span>
              <h1 className="qk-h1" style={{ marginTop: 10 }}>{studyParams.topic}</h1>
              <p className="qk-sub">{t('genSub')}</p>
            </div>
            {kid && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px 8px 8px', borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--line)' }}>
                <Avatar id={kid.avatar} size={36} ring={kid.color} />
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{kid.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{lang === 'es' ? 'Dificultad' : 'Difficulty'}: {difficultyLabel}</div>
                </div>
              </div>
            )}
          </div>

          {done && kid && (
            <div className="qk-card qk-slide-up" style={{ marginTop: 20, padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', background: 'linear-gradient(135deg, var(--primary-l) 0%, var(--honey-l) 100%)', borderColor: 'var(--primary)' }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--primary)', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                {ICONS.check}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 }}>
                  {lang === 'es' ? `¡Listo para ${kid.name}!` : `Ready for ${kid.name}!`}
                </div>
                <div style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 4 }}>
                  {lang === 'es' ? `Aparecerá en el feed de ${kid.name}.` : `Added to ${kid.name}'s feed.`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                <Btn kind="primary" icon={ICONS.cards} onClick={() => { setMode('kid'); router.push(`/kids/${done}`); }}>
                  {lang === 'es' ? `Abrir como ${kid.name}` : `Open as ${kid.name}`}
                </Btn>
                <button className="qk-btn qk-btn-ghost" onClick={() => { setDone(null); router.push('/dashboard'); }}>
                  {lang === 'es' ? 'Volver' : 'Back to dashboard'}
                </button>
              </div>
            </div>
          )}

          <div className="qk-stagger" style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18, opacity: done ? 0.45 : 1, pointerEvents: done ? 'none' : undefined }}>
            {[
              { id: 'quiz' as const, title: t('genQuiz'), sub: t('genQuizSub'), tone: 'primary', icon: ICONS.cards },
              { id: 'guide' as const, title: t('genGuide'), sub: t('genGuideSub'), tone: 'sky', icon: ICONS.book },
              { id: 'pdf' as const, title: t('genPdf'), sub: t('genPdfSub'), tone: 'coral', icon: ICONS.pdf },
            ].map((opt) => {
              const bg = `var(--${opt.tone === 'primary' ? 'primary-l' : opt.tone + '-l'})`;
              const fg = `var(--${opt.tone === 'primary' ? 'primary' : opt.tone})`;
              const loading = genState === opt.id;
              return (
                <div key={opt.id} className="qk-card qk-card-interactive" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ height: 110, borderRadius: 16, background: bg, color: fg, display: 'grid', placeItems: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, opacity: .15, backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
                    <div style={{ position: 'relative', transform: 'scale(2.5)' }}>{opt.icon}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20 }}>{opt.title}</div>
                    <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--ink-2)' }}>{opt.sub}</p>
                  </div>
                  {loading ? (
                    <div style={{ marginTop: 'auto' }}>
                      <div className="qk-progress"><span style={{ width: progress + '%' }} /></div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>{t('generating')}</div>
                    </div>
                  ) : (
                    <Btn kind="primary" disabled={!!genState} onClick={() => setGenState(opt.id)} icon={ICONS.spark} style={{ marginTop: 'auto', opacity: genState && genState !== opt.id ? .5 : 1 }}>{t('generate')}</Btn>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 24, padding: 18, background: 'var(--surface-2)', borderRadius: 18, border: '1px dashed var(--line)', display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--honey-l)', color: 'var(--honey)', display: 'grid', placeItems: 'center' }}>{ICONS.spark}</div>
            <div style={{ flex: 1, fontSize: 14, color: 'var(--ink-2)' }}>
              <strong style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--ink)' }}>{lang === 'es' ? 'Consejo:' : 'Tip:'}</strong>{' '}
              {lang === 'es' ? 'Genera la guía primero y luego el quiz para reforzar lo aprendido.' : 'Generate the guide first, then the quiz to reinforce what they learned.'}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
