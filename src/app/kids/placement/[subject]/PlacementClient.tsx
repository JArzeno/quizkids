'use client';
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ICONS } from '@/components/ui/Icons';
import { Avatar } from '@/components/ui/Avatar';
import { Btn } from '@/components/ui/Btn';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';
import { subjectInfo, subjectPromptName, levelLabel } from '@/lib/subjects';
import { requestGoalDraft, saveGoal } from '@/lib/goals';
import { scorePlacement, type PlacementOutcome } from '@/lib/placement';
import type { PlacementQuestion } from '@/types';

type Phase = 'intro' | 'loading' | 'quiz' | 'saving' | 'done';

export default function PlacementClient() {
  const params = useParams<{ subject: string }>();
  const subject = decodeURIComponent(typeof params?.subject === 'string' ? params.subject : '');
  const { lang, kids, activeKidId, customSubjects, updateKid, isDemo } = useStore();
  const t = useT(lang);
  const router = useRouter();
  const kid = kids.find((k) => k.id === activeKidId) || kids[0];
  const info = subjectInfo(subject, lang, customSubjects);
  const kidSubject = kid?.subjects?.find((s) => s.subject === subject);
  const focus = kidSubject?.focus;
  const subjectLang = kidSubject?.lang || lang;

  const [phase, setPhase] = React.useState<Phase>('intro');
  const [questions, setQuestions] = React.useState<PlacementQuestion[]>([]);
  const [i, setI] = React.useState(0);
  const [picks, setPicks] = React.useState<Record<number, number>>({});
  const [outcome, setOutcome] = React.useState<PlacementOutcome | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [saveFailed, setSaveFailed] = React.useState(false);

  const backToKid = () => router.push(kid ? `/dashboard/kid/${kid.id}` : '/dashboard');

  const start = async () => {
    if (!kid) return;
    setPhase('loading');
    setError(null);
    try {
      const res = await fetch('/api/generate/placement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subjectPromptName(subject, customSubjects), focus, grade: kid.grade, lang: subjectLang }),
      });
      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      setQuestions(data.questions as PlacementQuestion[]);
      setI(0);
      setPicks({});
      setPhase('quiz');
    } catch (e) {
      console.error(e);
      setError(t('placeError'));
      setPhase('intro');
    }
  };

  const finish = async (finalPicks: Record<number, number>) => {
    if (!kid) return;
    setPhase('saving');
    const result = scorePlacement(questions, finalPicks, kid.grade);
    const placedAt = new Date().toISOString();

    let saved = true;
    if (!isDemo) {
      try {
        const { error: dbErr } = await createClient().from('kid_subjects').upsert({
          kid_id: kid.id,
          subject,
          lang: subjectLang,
          focus: focus ?? null,
          level: result.level,
          strong_topics: result.strongTopics,
          weak_topics: result.weakTopics,
          placement_accuracy: result.accuracy,
          placed_at: placedAt,
        }, { onConflict: 'kid_id,subject' });
        if (dbErr) throw dbErr;
      } catch (e) {
        console.warn('Could not save placement:', e);
        saved = false;
      }
    }

    if (saved) {
      const entry = { subject, lang: subjectLang, focus, level: result.level, strongTopics: result.strongTopics, weakTopics: result.weakTopics, placementAccuracy: result.accuracy, placedAt };
      const others = (kid.subjects || []).filter((s) => s.subject !== subject);
      const nextSubjects = [...others, entry];
      updateKid(kid.id, { subjects: nextSubjects });

      // Suggest a first goal (the parent approves it on the kid page); skip if the subject already has one
      const goals = kid.goals || [];
      if (!goals.some((g) => g.subject === subject && (g.status === 'active' || g.status === 'proposed'))) {
        const draft = await requestGoalDraft({ ...kid, subjects: nextSubjects }, subject, lang, customSubjects);
        const goal = draft && await saveGoal(kid.id, subject, draft, 'proposed', isDemo, goals);
        if (goal) updateKid(kid.id, { goals: [...goals, goal] });
      }
    }
    setSaveFailed(!saved);
    setOutcome(result);
    setPhase('done');
  };

  const cur = questions[i];
  const pick = picks[i];

  const next = () => {
    if (pick == null) return;
    if (i + 1 >= questions.length) finish(picks);
    else setI(i + 1);
  };

  if (!kid) return null;

  const header = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 720, margin: '0 auto', width: '100%' }}>
      <button className="qk-btn qk-btn-ghost" onClick={backToKid}>{ICONS.back} <span>{t('back')}</span></button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 12px 4px 4px', borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--line)' }}>
        <Avatar id={kid.avatar} size={32} />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{kid.name}</span>
      </div>
    </div>
  );

  return (
    <AppShell>
      <div className="qk-screen qk-page-enter">
        {header}
        <div style={{ maxWidth: 720, margin: '24px auto 0' }}>
          {(phase === 'intro' || phase === 'loading') && (
            <div className="qk-card" style={{ padding: 32, textAlign: 'center' }}>
              <div style={{ fontSize: 48 }}>{info.icon}</div>
              <span className="qk-eyebrow" style={{ marginTop: 10, display: 'inline-block' }}>{info.label}</span>
              <h1 className="qk-h1" style={{ marginTop: 8 }}>{t('placeTake')}</h1>
              <p className="qk-sub" style={{ maxWidth: 480, margin: '10px auto 0' }}>{t('placeIntro')}</p>
              {focus && <p style={{ marginTop: 10, fontSize: 13, color: 'var(--ink-3)' }}>{focus}</p>}
              {error && <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 14, background: 'var(--coral-l)', color: 'var(--coral)', fontWeight: 600 }}>{error}</div>}
              {phase === 'loading' ? (
                <div style={{ marginTop: 24 }}>
                  <div className="qk-progress" style={{ maxWidth: 280, margin: '0 auto' }}><span style={{ width: '60%', animation: 'qk-pulse 1.2s ease infinite' }} /></div>
                  <div style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 10 }}>{t('placeBuilding')}</div>
                </div>
              ) : (
                <div style={{ marginTop: 24 }}><Btn kind="primary" icon={ICONS.spark} onClick={start}>{t('placeStart')}</Btn></div>
              )}
            </div>
          )}

          {phase === 'quiz' && cur && (
            <div className="qk-card qk-slide-up" key={i} style={{ padding: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--ink-3)', fontWeight: 700, marginBottom: 10 }}>
                <span>{info.icon} {info.label}</span>
                <span>{i + 1} / {questions.length}</span>
              </div>
              <div className="qk-progress" style={{ marginBottom: 22 }}><span style={{ width: `${((i + 1) / questions.length) * 100}%` }} /></div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 'clamp(20px, 3vw, 26px)', lineHeight: 1.25, marginBottom: 20 }}>{cur.q}</div>
              <div style={{ display: 'grid', gap: 10 }}>
                {cur.choices.map((c, ci) => {
                  const on = pick === ci;
                  return (
                    <button key={ci} onClick={() => setPicks({ ...picks, [i]: ci })} style={{ appearance: 'none', textAlign: 'left', padding: '12px 14px', background: on ? 'var(--primary-l)' : 'var(--surface)', border: '2px solid ' + (on ? 'var(--primary)' : 'var(--line)'), borderRadius: 14, cursor: 'pointer', fontWeight: 600, fontSize: 15, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 24, height: 24, borderRadius: 8, background: on ? 'var(--primary)' : 'var(--surface-2)', color: on ? '#fff' : 'var(--ink-3)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>{String.fromCharCode(65 + ci)}</span>
                      <span style={{ flex: 1 }}>{c}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end' }}>
                <Btn kind="primary" disabled={pick == null} onClick={next} iconRight={ICONS.next} style={{ opacity: pick == null ? .5 : 1 }}>
                  {i + 1 >= questions.length ? t('placeSubmit') : t('next')}
                </Btn>
              </div>
            </div>
          )}

          {phase === 'saving' && (
            <div className="qk-card" style={{ padding: 32, textAlign: 'center' }}>
              <div className="qk-progress" style={{ maxWidth: 280, margin: '0 auto' }}><span style={{ width: '80%', animation: 'qk-pulse 1.2s ease infinite' }} /></div>
            </div>
          )}

          {phase === 'done' && outcome && (
            <div className="qk-card qk-bounce-in" style={{ padding: 32 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48 }}>{info.icon}</div>
                <h1 className="qk-h1" style={{ marginTop: 8 }}>{t('placeDone')}</h1>
                <p className="qk-sub" style={{ marginTop: 6 }}>
                  {info.label} · {t('placeEstLevel')} <strong>{levelLabel(outcome.level, lang)}</strong> · {outcome.accuracy}%
                </p>
              </div>
              {saveFailed && <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 14, background: 'var(--coral-l)', color: 'var(--coral)', fontWeight: 600 }}>{t('placeSaveWarn')}</div>}
              <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 14 }}>
                <div style={{ padding: 16, borderRadius: 16, background: 'var(--primary-l)' }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>💪 {t('placeStrong')}</div>
                  {outcome.strongTopics.length ? outcome.strongTopics.map((x) => <div key={x} style={{ fontSize: 14 }}>· {x}</div>) : <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{t('placeNone')}</div>}
                </div>
                <div style={{ padding: 16, borderRadius: 16, background: 'var(--honey-l)' }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>🎯 {t('placeWeak')}</div>
                  {outcome.weakTopics.length ? outcome.weakTopics.map((x) => <div key={x} style={{ fontSize: 14 }}>· {x}</div>) : <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{t('placeNone')}</div>}
                </div>
              </div>
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
                <Btn kind="primary" onClick={backToKid}>{t('placeBackKid')}</Btn>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
