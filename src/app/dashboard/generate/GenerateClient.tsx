'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ICONS } from '@/components/ui/Icons';
import { Avatar } from '@/components/ui/Avatar';
import { Btn } from '@/components/ui/Btn';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';

type GenType = 'quiz' | 'guide' | 'pdf';

interface GenResult {
  contentId: string | null;
  cached: boolean;
  type: GenType;
}

export default function GenerateClient() {
  const { lang, kids, activeKidId, studyParams, difficulty, setMode, updateKid, isDemo, setStudyParams } = useStore();
  const t = useT(lang);
  const router = useRouter();
  const kid = kids.find((k) => k.id === activeKidId) || kids[0];

  const [genState, setGenState] = React.useState<GenType | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [done, setDone] = React.useState<GenResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const difficultyLabel = { easy: lang === 'es' ? 'Fácil' : 'Easy', medium: lang === 'es' ? 'Medio' : 'Medium', hard: lang === 'es' ? 'Difícil' : 'Hard' }[difficulty];

  const gradeLabel = () => {
    const g = studyParams.grade.toUpperCase();
    if (g === 'K') return lang === 'es' ? 'Kínder' : 'Kindergarten';
    return (lang === 'es' ? 'Grado ' : 'Grade ') + studyParams.grade;
  };

  const generate = async (type: GenType) => {
    setGenState(type);
    setError(null);
    setProgress(10);

    // Animate progress while waiting
    let p = 10;
    const interval = setInterval(() => {
      p = Math.min(p + Math.random() * 12 + 4, 88);
      setProgress(p);
    }, 300);

    try {
      const apiPath = type === 'quiz' ? '/api/generate/quiz'
        : type === 'guide' ? '/api/generate/guide'
        : '/api/generate/worksheet';

      const body: Record<string, string> = {
        topic: studyParams.topic,
        grade: studyParams.grade,
        lang,
        subject: studyParams.subject,
      };
      if (type === 'quiz') body.difficulty = difficulty;

      const res = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      clearInterval(interval);

      if (!res.ok) throw new Error('Generation failed');

      const data = await res.json();
      const contentId: string | null = data.contentId ?? null;

      setProgress(100);

      // Save assignment to Supabase (if not demo and kid exists)
      let assignmentId: string | null = null;
      if (!isDemo && kid && contentId) {
        try {
          const supabase = createClient();
          const { data: assignment } = await supabase
            .from('kid_assignments')
            .insert({
              kid_id: kid.id,
              content_id: contentId,
              subject: studyParams.subject,
              topic: studyParams.topic,
              grade: studyParams.grade,
              type: type === 'pdf' ? 'pdf' : type,
              status: 'pending',
            })
            .select('id')
            .single();
          assignmentId = assignment?.id ?? null;
        } catch (e) {
          console.warn('Could not save assignment:', e);
        }
      }

      // Update kid's recent in Zustand (local state)
      if (kid) {
        const newItem = {
          kind: type,
          title: studyParams.topic,
          when: 'Today',
          score: 0,
          subject: studyParams.subject,
          contentId: contentId ?? undefined,
          assignmentId: assignmentId ?? undefined,
          status: 'pending' as const,
        };
        updateKid(kid.id, { recent: [newItem, ...(kid.recent || [])].slice(0, 20) });
      }

      setTimeout(() => {
        setGenState(null);
        setDone({ contentId, cached: data.cached ?? false, type });
        setProgress(0);
      }, 400);
    } catch (err) {
      clearInterval(interval);
      console.error(err);
      setError(lang === 'es' ? 'Error al generar. Intenta de nuevo.' : 'Generation failed. Please try again.');
      setGenState(null);
      setProgress(0);
    }
  };

  const openContent = (d: GenResult) => {
    if (d.contentId) {
      setStudyParams({ ...studyParams, contentId: d.contentId });
    }
    setMode('kid');
    if (d.type === 'quiz') router.push('/kids/quiz');
    else if (d.type === 'guide') router.push('/kids/guide');
    else router.push('/kids/pdf');
  };

  return (
    <AppShell>
      <div className="qk-screen qk-page-enter">
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <button className="qk-btn qk-btn-ghost" onClick={() => { setDone(null); router.push('/dashboard/picker'); }}>
            {ICONS.back} <span>{t('back')}</span>
          </button>

          <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span className="qk-eyebrow">{t(studyParams.subject)} · {gradeLabel()}</span>
              <h1 className="qk-h1" style={{ marginTop: 10 }}>{studyParams.topic}</h1>
              <p className="qk-sub">{t('genSub')}</p>
            </div>
            {kid && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px 8px 8px', borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--line)' }}>
                <Avatar id={kid.avatar} size={36} ring={kid.color} />
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{kid.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                    {gradeLabel()} · {lang === 'es' ? 'Dificultad' : 'Difficulty'}: {difficultyLabel}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 14, background: 'var(--coral-l)', color: 'var(--coral)', fontWeight: 600 }}>
              {error}
            </div>
          )}

          {/* Success banner */}
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
                  {done.cached
                    ? (lang === 'es' ? 'Contenido guardado encontrado · sin créditos usados.' : 'Saved content found · no credits used.')
                    : (lang === 'es' ? `Aparecerá en el feed de ${kid.name}.` : `Added to ${kid.name}'s feed.`)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
                <Btn kind="primary" icon={ICONS.cards} onClick={() => openContent(done)}>
                  {lang === 'es' ? `Abrir como ${kid.name}` : `Open as ${kid.name}`}
                </Btn>
                <button className="qk-btn qk-btn-ghost" onClick={() => { setDone(null); router.push('/dashboard'); }}>
                  {lang === 'es' ? 'Volver' : 'Back to dashboard'}
                </button>
              </div>
            </div>
          )}

          {/* Cards */}
          <div className="qk-stagger" style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18, opacity: done ? 0.45 : 1, pointerEvents: done ? 'none' : undefined }}>
            {([
              { id: 'quiz' as GenType, title: t('genQuiz'), sub: t('genQuizSub'), tone: 'primary', icon: ICONS.cards },
              { id: 'guide' as GenType, title: t('genGuide'), sub: t('genGuideSub'), tone: 'sky', icon: ICONS.book },
              { id: 'pdf' as GenType, title: t('genPdf'), sub: t('genPdfSub'), tone: 'coral', icon: ICONS.pdf },
            ]).map((opt) => {
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
                      <div className="qk-progress"><span style={{ width: progress + '%', transition: 'width .3s ease' }} /></div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>{t('generating')}</div>
                    </div>
                  ) : (
                    <Btn kind="primary" disabled={!!genState} onClick={() => generate(opt.id)} icon={ICONS.spark} style={{ marginTop: 'auto', opacity: genState && genState !== opt.id ? .5 : 1 }}>
                      {t('generate')}
                    </Btn>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 24, padding: 18, background: 'var(--surface-2)', borderRadius: 18, border: '1px dashed var(--line)', display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--honey-l)', color: 'var(--honey)', display: 'grid', placeItems: 'center' }}>{ICONS.spark}</div>
            <div style={{ flex: 1, fontSize: 14, color: 'var(--ink-2)' }}>
              <strong style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--ink)' }}>{lang === 'es' ? 'Consejo:' : 'Tip:'}</strong>{' '}
              {lang === 'es'
                ? `El contenido se adapta automáticamente al ${gradeLabel()} de ${kid?.name || 'tu hijo'}. Una vez generado, se guarda para reutilizarlo.`
                : `Content adapts automatically to ${kid?.name || 'your child'}'s ${gradeLabel()} level. Once generated, it's saved so you won't need to regenerate.`}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
