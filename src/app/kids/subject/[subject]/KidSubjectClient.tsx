'use client';
import React from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import { ICONS } from '@/components/ui/Icons';
import { Btn } from '@/components/ui/Btn';
import { AppShell } from '@/components/layout/AppShell';
import LevelPath, { LevelSheet } from '@/components/games/LevelPath';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';
import { subjectInfo, fromRow } from '@/lib/subjects';
import { goalFromRow } from '@/lib/goals';
import { buildLevels, type Level } from '@/lib/levels';
import type { GameMode } from '@/lib/games';
import { loadTopics, subjectTopics, type TopicRow } from '@/lib/topics';
import { daysUntil, examWeakTopics, loadTests } from '@/lib/tests';
import { dateLabel, listProgress, loadWordLists } from '@/lib/words';
import type { KidTest, KidTopic, RecentItem, WordList } from '@/types';

interface QuizRow { subject: string | null; topic: string | null; total: number | null; correct: number | null; stars: number | null; created_at: string; assignment_id?: string | null }
interface AssignmentRow { id: string; subject: string | null; topic: string | null; type: string | null; status: string | null; assigned_at: string; content_id: string | null }

function relativeDate(iso: string, lang: string) {
  const then = new Date(iso);
  const days = Math.floor((Date.now() - then.getTime()) / 86400000);
  if (days <= 0) return lang === 'es' ? 'Hoy' : 'Today';
  if (days === 1) return lang === 'es' ? 'Ayer' : 'Yesterday';
  if (days < 7) return lang === 'es' ? `Hace ${days} días` : `${days} days ago`;
  return then.toLocaleDateString(lang === 'es' ? 'es-DO' : 'en-US', { month: 'short', day: 'numeric' });
}

export default function KidSubjectClient() {
  const params = useParams<{ subject: string }>();
  const subject = decodeURIComponent(typeof params?.subject === 'string' ? params.subject : '');
  const { lang, kids, activeKidId, isDemo, updateKid, customSubjects, studyParams, setStudyParams, setMode, gamification } = useStore();
  const t = useT(lang);
  const L = (en: string, es: string) => (lang === 'es' ? es : en);
  const router = useRouter();
  const kid = kids.find((k) => k.id === activeKidId) || kids[0];
  const ks = kid?.subjects?.find((s) => s.subject === subject);
  const info = subjectInfo(subject, lang, customSubjects, ks);
  const here = `/kids/subject/${encodeURIComponent(subject)}`;

  const [quizzes, setQuizzes] = React.useState<QuizRow[]>([]);
  const [assignments, setAssignments] = React.useState<AssignmentRow[]>([]);
  const [topics, setTopics] = React.useState<KidTopic[]>([]);
  const [tests, setTests] = React.useState<KidTest[]>([]);
  const [wordLists, setWordLists] = React.useState<WordList[]>([]);
  const [loading, setLoading] = React.useState(!isDemo);
  const [openLevel, setOpenLevel] = React.useState<string | null>(null);
  const [showDone, setShowDone] = React.useState(false);
  /** A key was just earned: what the banner says and which level pops in */
  const [won, setWon] = React.useState<{ text: string; n: number | null } | null>(null);

  React.useEffect(() => { setMode('kid'); }, []);

  React.useEffect(() => {
    if (!kid || !subject) { setLoading(false); return; }
    if (isDemo) {
      setQuizzes([
        ...(kid.results || []).filter((r) => r.subject === subject).map((r) => ({ ...r, stars: 0 })),
        ...(kid.recent || []).filter((r) => r.kind === 'quiz' && r.subject === subject).map((r) => ({
          subject, topic: r.title, total: 5, correct: r.score, stars: r.score, created_at: new Date(0).toISOString(),
        })),
      ]);
      setTopics((kid.topics || []).filter((x) => x.subject === subject).reverse());
      setTests((kid.tests || []).filter((x) => x.subject === subject).reverse());
      loadWordLists(kid.id, subject, true).then(setWordLists).catch(() => {});
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const [quizRes, assignRes, subjRes, goalRes] = await Promise.all([
          supabase.from('quiz_results').select('subject, topic, total, correct, stars, created_at, assignment_id')
            .eq('kid_id', kid.id).eq('subject', subject).order('created_at', { ascending: false }).limit(300),
          supabase.from('kid_assignments').select('id, subject, topic, type, status, assigned_at, content_id')
            .eq('kid_id', kid.id).eq('subject', subject).order('assigned_at', { ascending: false }).limit(40),
          supabase.from('kid_subjects').select('*').eq('kid_id', kid.id).order('created_at'),
          supabase.from('kid_goals').select('*').eq('kid_id', kid.id).order('created_at'),
        ]);
        if (cancelled) return;
        if (subjRes.data) updateKid(kid.id, { subjects: subjRes.data.map(fromRow) });
        if (goalRes.data) updateKid(kid.id, { goals: goalRes.data.map(goalFromRow) });
        setQuizzes((quizRes.data as QuizRow[]) || []);
        setAssignments((assignRes.data as AssignmentRow[]) || []);
        const list = await loadTopics(kid, subject, false).catch((e) => { console.warn('Could not load topics:', e); return [] as KidTopic[]; });
        if (!cancelled) setTopics(list);
        const testList = await loadTests(kid, subject, false).catch((e) => { console.warn('Could not load tests:', e); return [] as KidTest[]; });
        if (!cancelled) setTests(testList);
        const words = await loadWordLists(kid.id, subject, false).catch((e) => { console.warn('Could not load word lists:', e); return [] as WordList[]; });
        if (!cancelled) setWordLists(words);
      } catch (e) {
        console.warn('Could not load subject:', e);
      }
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kid?.id, subject, isDemo]);

  // The subject as a path of levels: one per topic the parent added, in the order they were added
  const levels = React.useMemo(
    () => buildLevels(subjectTopics(subject, topics, kid?.goals || [], quizzes)),
    [subject, topics, kid?.goals, quizzes],
  );
  const cleared = levels.filter((l) => l.cleared).length;

  // Coming back with more levels passed than last time: celebrate the new key once
  React.useEffect(() => {
    if (loading || !kid || !levels.length) return;
    const key = `qk-path:${kid.id}:${subject}`;
    let before: number | null = null;
    try {
      const raw = localStorage.getItem(key);
      before = raw == null ? null : Number(raw);
      localStorage.setItem(key, String(cleared));
    } catch { /* private mode: no celebration, the path still works */ }
    if (before == null || !(cleared > before)) return;
    const next = levels.find((l) => l.state === 'current');
    const es = lang === 'es';
    setWon(cleared === levels.length
      ? { text: es ? '¡Completaste todos los niveles!' : 'You finished every level!', n: null }
      : { text: next ? (es ? `¡Ganaste la llave! Nivel ${next.n} abierto` : `You got the key! Level ${next.n} is open`) : (es ? '¡Nivel superado!' : 'Level passed!'), n: next?.n ?? null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, cleared, levels.length, kid?.id, subject]);

  React.useEffect(() => {
    if (!won) return;
    const id = setTimeout(() => setWon(null), 4500);
    return () => clearTimeout(id);
  }, [won]);

  if (!kid) return null;

  const minimal = gamification === 'minimal';
  const starsHere = levels.reduce((a, l) => a + l.stars, 0);
  const current = levels.find((l) => l.state === 'current');
  const sheet = levels.find((l) => l.title === openLevel) || null;
  const starsByAssignment = new Map(quizzes.filter((q) => q.assignment_id).map((q) => [q.assignment_id!, q.stars || 0]));
  const work: RecentItem[] = isDemo
    ? (kid.recent || []).filter((r) => r.subject === subject)
    : assignments.map((a) => ({
      kind: (a.type === 'worksheet' ? 'pdf' : a.type) as RecentItem['kind'],
      title: a.topic || '',
      when: relativeDate(a.assigned_at, lang),
      score: starsByAssignment.get(a.id) || 0,
      subject,
      contentId: a.content_id ?? undefined,
      assignmentId: a.id,
      status: a.status as RecentItem['status'],
    }));
  const pending = work.filter((w) => w.status !== 'completed');
  const finished = work.filter((w) => w.status === 'completed');
  const shownWork = showDone ? work : pending;
  // School tests, the ones still coming first; past ones stay so the grade from school can be added
  const isComing = (x: KidTest) => !x.testDate || daysUntil(x.testDate) >= 0;
  const comingTests = [...tests.filter(isComing), ...tests.filter((x) => !isComing(x))];

  const study = (row: TopicRow, kind: 'guide' | 'quiz' | 'practice') => {
    setStudyParams({
      ...studyParams,
      subject, topic: row.title, grade: kid.grade,
      contentId: undefined, assignmentId: undefined, planItemId: undefined,
      contentLang: ks?.lang, source: row.topic?.notes, returnTo: here, topics: undefined, pairedContentId: undefined, testId: undefined, memory: undefined,
    });
    router.push(kind === 'guide' ? '/kids/guide' : kind === 'quiz' ? '/kids/quiz' : '/kids/test');
  };

  const play = (level: Level, mode: GameMode) => {
    if (mode === 'flip') { study(level.row, 'quiz'); return; }
    router.push(`${here}/play?mode=${mode}&topic=${encodeURIComponent(level.title)}`);
  };

  // Topics a practice test for a school test showed were weak: the subject remembers them
  const weakInTests = new Set(examWeakTopics(tests).map((x) => x.trim().toLowerCase()));

  const testWhen = (date: string) => {
    const d = daysUntil(date);
    if (d === 0) return L('Today!', '¡Hoy!');
    if (d === 1) return L('Tomorrow', 'Mañana');
    if (d > 1) return L(`In ${d} days`, `En ${d} días`);
    return new Date(date + 'T00:00').toLocaleDateString(lang === 'es' ? 'es-DO' : 'en-US', { month: 'short', day: 'numeric' });
  };

  const openWork = (r: RecentItem) => {
    setStudyParams({
      ...studyParams,
      subject, topic: r.title, grade: kid.grade,
      contentId: r.contentId, assignmentId: r.assignmentId, planItemId: undefined,
      contentLang: undefined, source: undefined, returnTo: here, topics: undefined, pairedContentId: undefined, testId: undefined, memory: undefined,
    });
    router.push(r.kind === 'quiz' ? '/kids/quiz' : r.kind === 'guide' ? '/kids/guide' : '/kids/pdf');
  };

  const headline = !levels.length
    ? ''
    : cleared === levels.length
      ? L('You finished every level! 🏆', '¡Completaste todos los niveles! 🏆')
      : current
        ? L(`Level ${current.n} of ${levels.length}`, `Nivel ${current.n} de ${levels.length}`)
        : L(`${cleared} of ${levels.length} levels passed`, `${cleared} de ${levels.length} niveles superados`);

  return (
    <AppShell>
      <div className="qk-screen qk-page-enter" style={{ padding: '24px clamp(16px, 5vw, 56px) 64px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <button className="qk-btn qk-btn-ghost" onClick={() => router.push('/kids/home')}>{ICONS.back} <span>{t('backHome')}</span></button>

          {/* header: where you are on the path, nothing else */}
          <div className="qk-card qk-slide-up" style={{ marginTop: 16, padding: 'clamp(16px, 4vw, 22px)', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 14, background: 'linear-gradient(135deg, var(--primary-l) 0%, var(--sky-l) 100%)', borderColor: 'var(--primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 60, height: 60, borderRadius: 18, background: 'var(--surface)', display: 'grid', placeItems: 'center', fontSize: 32, flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}>{info.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 className="qk-h1" style={{ margin: 0, fontSize: 'clamp(24px, 4vw, 32px)', overflowWrap: 'anywhere' }}>{info.label}</h1>
                {headline && <div style={{ marginTop: 2, fontSize: 15, fontWeight: 700, color: 'var(--ink-2)' }}>{headline}</div>}
              </div>
              {!minimal && levels.length > 0 && (
                <div title={L('Stars won in this subject', 'Estrellas ganadas en esta materia')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: 'var(--surface)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17, color: 'var(--honey-d)', flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}>
                  {React.cloneElement(ICONS.star as React.ReactElement<{ size?: number }>, { size: 18 })}
                  <span key={starsHere} className="qk-num-tick">{starsHere}</span><span style={{ color: 'var(--ink-3)', fontSize: 14 }}>/{levels.length * 3}</span>
                </div>
              )}
            </div>
            {levels.length > 0 && (
              <div className="qk-progress" role="progressbar" aria-valuemin={0} aria-valuemax={levels.length} aria-valuenow={cleared} aria-label={L('Levels passed', 'Niveles superados')} style={{ height: 12, background: 'var(--surface)' }}>
                <span style={{ width: (cleared / levels.length) * 100 + '%' }} />
              </div>
            )}
          </div>

          {/* spelling words a grown-up added: each list opens its games */}
          {wordLists.length > 0 && (
            <section style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 10 }}>
              {wordLists.map((list) => {
                const p = listProgress(list);
                const coming = !!list.testDate && daysUntil(list.testDate) >= 0;
                return (
                  <button key={list.id} onClick={() => router.push(`${here}/words?list=${encodeURIComponent(list.id)}`)} className="qk-card qk-card-interactive"
                    style={{ appearance: 'none', font: 'inherit', color: 'inherit', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, border: '1.5px solid ' + (coming ? 'var(--berry)' : 'var(--line)'), background: coming ? 'var(--berry-l)' : undefined }}>
                    <span aria-hidden style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--surface)', display: 'grid', placeItems: 'center', fontSize: 24, flexShrink: 0 }}>✏️</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, lineHeight: 1.25, overflowWrap: 'anywhere' }}>{list.title}</span>
                      <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-3)' }}>
                        {L(`Practice your words · ${p.known}/${p.total} right`, `Practica tus palabras · ${p.known}/${p.total} bien`)}{p.missed.length ? ` · 🎯 ${p.missed.length}` : ''}
                      </span>
                    </span>
                    {list.testDate && <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: coming ? 'var(--surface)' : 'var(--surface-2)', color: coming ? 'var(--honey-d)' : 'var(--ink-3)', flexShrink: 0 }}>📅 {dateLabel(list.testDate, lang)}</span>}
                  </button>
                );
              })}
            </section>
          )}

          {/* the path */}
          <section style={{ marginTop: 26 }}>
            {loading && levels.length === 0 && <div className="qk-card" style={{ padding: 20, color: 'var(--ink-3)', textAlign: 'center' }}>{L('Loading…', 'Cargando…')}</div>}
            {!loading && levels.length === 0 && wordLists.length === 0 && (
              <div className="qk-card" style={{ padding: 24, textAlign: 'center', color: 'var(--ink-3)' }}>
                <div aria-hidden style={{ fontSize: 40 }}>🗺️</div>
                <div style={{ marginTop: 6, fontFamily: 'var(--font-display)', fontSize: 18 }}>{L('Your path is not ready yet.', 'Tu camino todavía no está listo.')}</div>
                <div style={{ marginTop: 8, fontSize: 14 }}>{L('Ask a grown-up to add what you are learning at school.', 'Pídele a un adulto que agregue lo que estás aprendiendo en la escuela.')}</div>
              </div>
            )}
            {levels.length > 0 && <LevelPath levels={levels} lang={lang} minimal={minimal} unlockedN={won?.n} onOpen={(l) => setOpenLevel(l.title)} />}
          </section>

          {/* school tests: each opens its study kit */}
          {levels.length > 0 && (
            <section style={{ marginTop: 34, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 10 }}>
              {comingTests.map((test) => (
                <button key={test.id} onClick={() => router.push(`/kids/exam/${test.id}`)} className="qk-card qk-card-interactive" style={{ appearance: 'none', font: 'inherit', color: 'inherit', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, border: '1px solid ' + (isComing(test) ? 'var(--honey)' : 'var(--line)') }}>
                  <span aria-hidden style={{ fontSize: 26 }}>📝</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, lineHeight: 1.25, overflowWrap: 'anywhere' }}>{test.title}</span>
                    <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-3)' }}>{test.resultGrade ? `${L('Grade', 'Nota')}: ${test.resultGrade}` : isComing(test) ? L('Get ready for your test', 'Prepárate para tu examen') : L('How did it go? Add your grade', '¿Cómo te fue? Agrega tu nota')}</span>
                  </span>
                  {test.testDate && <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: isComing(test) ? 'var(--honey-l)' : 'var(--surface-2)', color: isComing(test) ? 'var(--honey-d)' : 'var(--ink-3)', flexShrink: 0 }}>{testWhen(test.testDate)}</span>}
                </button>
              ))}
              <Btn kind="ghost" icon={<span aria-hidden style={{ fontSize: 18, lineHeight: 1 }}>📝</span>} onClick={() => router.push(`${here}/exam`)} style={{ justifySelf: 'center' }}>
                {L('Test mode', 'Modo examen')}
              </Btn>
            </section>
          )}

          {/* work a grown-up assigned: what is left to do first */}
          {work.length > 0 && (
            <section style={{ marginTop: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                <h2 className="qk-h2" style={{ margin: 0 }}>{L('My work', 'Mis tareas')}</h2>
                {finished.length > 0 && (
                  <button type="button" onClick={() => setShowDone((v) => !v)} style={{ appearance: 'none', border: 0, background: 'transparent', font: 'inherit', fontSize: 13, fontWeight: 700, color: 'var(--primary-d)', cursor: 'pointer', padding: 4 }}>
                    {showDone ? L('Hide finished', 'Ocultar terminadas') : L(`See finished (${finished.length})`, `Ver terminadas (${finished.length})`)}
                  </button>
                )}
              </div>
              {shownWork.length === 0 && <div style={{ fontSize: 14, color: 'var(--ink-3)' }}>✅ {L('All done. Nice work!', 'Todo listo. ¡Buen trabajo!')}</div>}
              <div style={{ display: 'grid', gap: 10 }}>
                {shownWork.map((r, idx) => {
                  const done = r.status === 'completed';
                  const tone = r.kind === 'guide' ? 'sky' : r.kind === 'pdf' ? 'coral' : 'primary';
                  return (
                    <button key={r.assignmentId || idx} onClick={() => openWork(r)} className="qk-card"
                      style={{ appearance: 'none', textAlign: 'left', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', border: '1px solid var(--line)', opacity: done ? 0.7 : 1 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: `var(--${tone === 'primary' ? 'primary-l' : tone + '-l'})`, color: `var(--${tone})`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        {r.kind === 'guide' ? ICONS.book : r.kind === 'pdf' ? ICONS.pdf : ICONS.cards}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                          {r.kind === 'quiz' ? t('genQuiz') : r.kind === 'guide' ? t('genGuide') : t('genPdf')} · {r.when}
                        </div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, lineHeight: 1.25 }}>{r.title}</div>
                      </div>
                      {done && <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{ICONS.check}</div>}
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>

      {sheet && (
        <LevelSheet level={sheet} lang={lang} minimal={minimal} weak={weakInTests.has(sheet.title.trim().toLowerCase())}
          onLearn={() => study(sheet.row, 'guide')} onPlay={(m) => play(sheet, m)} onPractice={() => study(sheet.row, 'practice')} onClose={() => setOpenLevel(null)} />
      )}

      {won && createPortal(
        <div role="status" className="qk-key-toast">
          <span aria-hidden className="qk-key-spin">{won.n == null ? '🏆' : '🔑'}</span>
          <span>{won.text}</span>
        </div>,
        document.body,
      )}
    </AppShell>
  );
}
