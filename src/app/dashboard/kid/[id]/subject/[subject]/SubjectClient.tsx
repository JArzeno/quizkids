'use client';
import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ICONS } from '@/components/ui/Icons';
import { Btn } from '@/components/ui/Btn';
import { Stars, StatCard } from '@/components/ui/Stars';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';
import { subjectInfo, levelLabel, fromRow } from '@/lib/subjects';
import { goalFromRow } from '@/lib/goals';
import { addTopic, loadTopics, removeTopic, subjectTopics, type TopicRow } from '@/lib/topics';
import { MAX_TEST_TOPICS, createTest, daysUntil, defaultTestTopics, loadTests, removeTest, testStudyParams, topicsInTests } from '@/lib/tests';
import GoalsSection from '../../GoalsSection';
import type { Kid, KidSubject, KidTest, KidTopic } from '@/types';

interface QuizRow { subject: string | null; topic: string | null; total: number | null; correct: number | null; stars: number | null; created_at: string }
interface AssignmentRow { id: string; subject: string | null; topic: string | null; type: string | null; status: string | null; assigned_at: string }

function relativeDate(iso: string, lang: string) {
  const then = new Date(iso);
  const days = Math.floor((Date.now() - then.getTime()) / 86400000);
  if (days <= 0) return lang === 'es' ? 'Hoy' : 'Today';
  if (days === 1) return lang === 'es' ? 'Ayer' : 'Yesterday';
  if (days < 7) return lang === 'es' ? `Hace ${days} días` : `${days} days ago`;
  return then.toLocaleDateString(lang === 'es' ? 'es-DO' : 'en-US', { month: 'short', day: 'numeric' });
}

function Section({ title, sub, action, children }: { title: string; sub?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="qk-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>{title}</div>
          {sub && <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function SubjectClient() {
  const params = useParams<{ id: string; subject: string }>();
  const kidId = typeof params?.id === 'string' ? params.id : '';
  const subject = decodeURIComponent(typeof params?.subject === 'string' ? params.subject : '');
  const { lang, kids, gamification, isDemo, updateKid, customSubjects, difficulty, setActiveKidId, setMode, setStudyParams } = useStore();
  const t = useT(lang);
  const L = (en: string, es: string) => (lang === 'es' ? es : en);
  const router = useRouter();

  const kid: Kid | undefined = kids.find((k) => k.id === kidId);
  const info = subjectInfo(subject, lang, customSubjects);
  const ks: KidSubject | undefined = kid?.subjects?.find((s) => s.subject === subject);

  const [quizzes, setQuizzes] = React.useState<QuizRow[]>([]);
  const [assignments, setAssignments] = React.useState<AssignmentRow[]>([]);
  const [topics, setTopics] = React.useState<KidTopic[]>([]);
  const [tests, setTests] = React.useState<KidTest[]>([]);
  const [testForm, setTestForm] = React.useState<{ title: string; picked: string[]; date: string } | null>(null);
  const [creatingTest, setCreatingTest] = React.useState(false);
  const [loading, setLoading] = React.useState(!isDemo);
  const [error, setError] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState('');
  const [adding, setAdding] = React.useState(false);
  const [editingFocus, setEditingFocus] = React.useState(false);
  const [focusDraft, setFocusDraft] = React.useState('');

  React.useEffect(() => {
    if (!kidId || !subject) { setLoading(false); return; }
    if (isDemo) {
      // Demo mode has no Supabase rows: use the sample activity that ships with the demo kid
      const k = useStore.getState().kids.find((x) => x.id === kidId);
      setQuizzes((k?.recent || []).filter((r) => r.kind === 'quiz' && r.subject === subject).map((r) => {
        const at = new Date();
        at.setDate(at.getDate() - (r.when === 'Today' ? 0 : r.when === 'Yesterday' ? 1 : 3));
        return { subject: r.subject || null, topic: r.title, total: 5, correct: r.score, stars: r.score, created_at: at.toISOString() };
      }));
      setTopics((k?.topics || []).filter((x) => x.subject === subject).reverse());
      setTests((k?.tests || []).filter((x) => x.subject === subject).reverse());
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const [quizRes, assignRes, subjRes, goalRes] = await Promise.all([
          supabase.from('quiz_results').select('subject, topic, total, correct, stars, created_at')
            .eq('kid_id', kidId).eq('subject', subject).order('created_at', { ascending: false }).limit(300),
          supabase.from('kid_assignments').select('id, subject, topic, type, status, assigned_at')
            .eq('kid_id', kidId).eq('subject', subject).order('assigned_at', { ascending: false }).limit(60),
          supabase.from('kid_subjects').select('*').eq('kid_id', kidId).order('created_at'),
          supabase.from('kid_goals').select('*').eq('kid_id', kidId).order('created_at'),
        ]);
        if (cancelled) return;
        if (subjRes.data) updateKid(kidId, { subjects: subjRes.data.map(fromRow) });
        if (goalRes.data) updateKid(kidId, { goals: goalRes.data.map(goalFromRow) });
        setQuizzes((quizRes.data as QuizRow[]) || []);
        setAssignments((assignRes.data as AssignmentRow[]) || []);
        try {
          const list = await loadTopics({ id: kidId }, subject, false);
          if (!cancelled) setTopics(list);
          const testList = await loadTests({ id: kidId }, subject, false).catch((e) => { console.warn('Could not load tests:', e); return [] as KidTest[]; });
          if (!cancelled) setTests(testList);
        } catch (e) {
          console.warn('Could not load topics:', e);
          if (!cancelled) setError(L("Couldn't load the topics of this subject.", 'No pudimos cargar los temas de esta materia.'));
        }
      } catch (e) {
        console.warn('Could not load subject:', e);
      }
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kidId, subject, isDemo]);

  const rows = subjectTopics(subject, topics, kid?.goals || [], quizzes);
  const accuracy = quizzes.length ? Math.round(quizzes.reduce((a, q) => a + ((q.total || 0) > 0 ? ((q.correct || 0) / (q.total || 1)) * 100 : 0), 0) / quizzes.length) : 0;
  const lastAt = [quizzes[0]?.created_at, assignments[0]?.assigned_at].filter(Boolean).sort().pop();
  // Every topic of the subject as a KidTopic (topics that only come from a goal have no notes)
  const rowTopics: KidTopic[] = rows.map((r) => r.topic ?? { id: 'goal-' + r.title, subject, title: r.title, source: 'manual' as const });
  const usedInTests = topicsInTests(tests);
  const norm = (x: string) => x.trim().toLowerCase();

  // Demo mode keeps topics on the kid; the store is the source of truth there
  const saveDemoTopics = (next: KidTopic[]) => {
    if (!kid) return;
    const others = (useStore.getState().kids.find((k) => k.id === kid.id)?.topics || []).filter((x) => x.subject !== subject);
    updateKid(kid.id, { topics: [...others, ...[...next].reverse()] });
  };

  const add = async (title: string) => {
    if (!kid || !title.trim()) return;
    setAdding(true); setError(null);
    const saved = await addTopic(kid.id, subject, { title }, isDemo, topics);
    if (saved) {
      const next = [saved, ...topics.filter((x) => x.id !== saved.id)];
      setTopics(next);
      if (isDemo) saveDemoTopics(next);
      setDraft('');
    } else setError(L("Couldn't add that topic. Please try again.", 'No pudimos agregar ese tema. Intenta de nuevo.'));
    setAdding(false);
  };

  const remove = async (topic: KidTopic) => {
    setError(null);
    if (!(await removeTopic(topic.id, isDemo))) { setError(L("Couldn't remove that topic.", 'No pudimos quitar ese tema.')); return; }
    const next = topics.filter((x) => x.id !== topic.id);
    setTopics(next);
    if (isDemo) saveDemoTopics(next);
  };

  // Guide, quiz or worksheet for one topic of this subject
  const create = (row: TopicRow) => {
    if (!kid) return;
    setActiveKidId(kid.id);
    setStudyParams({
      subject, topic: row.title, grade: kid.grade, difficulty, lang,
      contentLang: ks?.lang, source: row.topic?.notes,
      contentId: undefined, assignmentId: undefined, planItemId: undefined, returnTo: undefined, topics: undefined, pairedContentId: undefined,
    });
    router.push('/dashboard/generate');
  };

  // ---- test prep ------------------------------------------------------------
  const openTestForm = () => setTestForm({ title: '', picked: defaultTestTopics(rowTopics, tests), date: '' });

  const saveDemoTests = (next: KidTest[]) => {
    if (!kid) return;
    const others = (useStore.getState().kids.find((k) => k.id === kid.id)?.tests || []).filter((x) => x.subject !== subject);
    updateKid(kid.id, { tests: [...others, ...[...next].reverse()] });
  };

  const submitTest = async () => {
    if (!kid || !testForm || testForm.picked.length === 0) return;
    setCreatingTest(true); setError(null);
    try {
      const picked = rowTopics.filter((x) => testForm.picked.some((n) => norm(n) === norm(x.title)));
      const test = await createTest(kid, subject, { title: testForm.title, topics: picked, testDate: testForm.date || undefined }, { lang: ks?.lang ?? lang, difficulty, existing: tests, isDemo });
      const next = [test, ...tests];
      setTests(next);
      if (isDemo) saveDemoTests(next);
      setTestForm(null);
    } catch (e) {
      console.warn('Could not create test:', e);
      setError(L("Couldn't create the test. Please try again.", 'No pudimos crear el examen. Intenta de nuevo.'));
    }
    setCreatingTest(false);
  };

  const deleteTest = async (test: KidTest) => {
    if (!window.confirm(L(`Delete "${test.title}"?`, `¿Eliminar "${test.title}"?`))) return;
    setError(null);
    if (!(await removeTest(test.id, isDemo))) { setError(L("Couldn't delete that test.", 'No pudimos eliminar ese examen.')); return; }
    const next = tests.filter((x) => x.id !== test.id);
    setTests(next);
    if (isDemo) saveDemoTests(next);
  };

  // Opens the guide or the quiz of a test (in the kid view, like studying from the subject page)
  const openTest = (test: KidTest, kind: 'guide' | 'quiz') => {
    if (!kid) return;
    setActiveKidId(kid.id);
    setMode('kid');
    setStudyParams(testStudyParams(useStore.getState().studyParams, kid, test, kind, topics, ks, `/kids/subject/${encodeURIComponent(subject)}`));
    router.push(kind === 'guide' ? '/kids/guide' : '/kids/quiz');
  };

  const testWhen = (date: string) => {
    const d = daysUntil(date);
    if (d === 0) return L('Today', 'Hoy');
    if (d === 1) return L('Tomorrow', 'Mañana');
    if (d > 1) return L(`In ${d} days`, `En ${d} días`);
    return new Date(date + 'T00:00').toLocaleDateString(lang === 'es' ? 'es-DO' : 'en-US', { month: 'short', day: 'numeric' });
  };

  const importClass = () => {
    if (!kid) return;
    setActiveKidId(kid.id);
    router.push(`/dashboard/import?subject=${encodeURIComponent(subject)}`);
  };

  const openKidView = () => {
    if (!kid) return;
    setActiveKidId(kid.id);
    setMode('kid');
    router.push(`/kids/subject/${encodeURIComponent(subject)}`);
  };

  // ---- subject settings (moved here from the kid page) -----------------------
  const patchSubject = async (patch: Record<string, unknown>, local: Partial<KidSubject>) => {
    if (!kid) return false;
    setError(null);
    if (!isDemo) {
      const { error: e } = await createClient().from('kid_subjects').update(patch).eq('kid_id', kid.id).eq('subject', subject);
      if (e) { setError(t('placeError')); return false; }
    }
    updateKid(kid.id, { subjects: (kid.subjects || []).map((s) => (s.subject === subject ? { ...s, ...local } : s)) });
    return true;
  };

  const addSubject = async () => {
    if (!kid || ks) return;
    setError(null);
    if (!isDemo) {
      const { error: e } = await createClient().from('kid_subjects').insert({ kid_id: kid.id, subject });
      if (e) { setError(t('placeError')); return; }
    }
    updateKid(kid.id, { subjects: [...(kid.subjects || []), { subject }] });
  };

  const removeSubject = async () => {
    if (!kid) return;
    if (!window.confirm(L(`Remove ${info.label} from ${kid.name}'s subjects? Their quiz history stays.`, `¿Quitar ${info.label} de las materias de ${kid.name}? Su historial de quizzes se mantiene.`))) return;
    setError(null);
    if (!isDemo) {
      const { error: e } = await createClient().from('kid_subjects').delete().eq('kid_id', kid.id).eq('subject', subject);
      if (e) { setError(t('placeError')); return; }
    }
    updateKid(kid.id, { subjects: (kid.subjects || []).filter((s) => s.subject !== subject) });
    router.push(`/dashboard/kid/${kid.id}`);
  };

  const saveFocus = async () => {
    const focus = focusDraft.trim();
    if (await patchSubject({ focus: focus || null }, { focus: focus || undefined })) setEditingFocus(false);
  };

  const startPlacement = () => {
    if (!kid) return;
    setActiveKidId(kid.id);
    router.push(`/kids/placement/${encodeURIComponent(subject)}`);
  };

  if (!kid) {
    return (
      <AppShell>
        <div className="qk-screen qk-page-enter">
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <Link href="/dashboard" className="qk-btn qk-btn-ghost">{ICONS.back}<span>{t('backToDash')}</span></Link>
            <p className="qk-sub" style={{ marginTop: 20 }}>{t('kidNotFound')}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const placed = !!ks?.placedAt;
  const smallBtn: React.CSSProperties = { fontSize: 12, padding: '6px 10px' };

  return (
    <AppShell>
      <div className="qk-screen qk-page-enter">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Link href={`/dashboard/kid/${kid.id}`} className="qk-btn qk-btn-ghost" style={{ marginBottom: 18 }}>
            {ICONS.back}<span>{kid.name}</span>
          </Link>

          {/* header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
              <div style={{ width: 72, height: 72, borderRadius: 22, background: 'var(--primary-l)', display: 'grid', placeItems: 'center', fontSize: 38, flexShrink: 0 }}>{info.icon}</div>
              <div style={{ minWidth: 0 }}>
                <span className="qk-eyebrow">{kid.name} · {t('subject')}</span>
                <h1 className="qk-h1" style={{ marginTop: 8, fontSize: 'clamp(28px, 6vw, 38px)' }}>{info.label}</h1>
                <p className="qk-sub" style={{ fontSize: 14, marginTop: 4 }}>
                  {placed && ks?.level != null ? `${t('placeEstLevel')} ${levelLabel(ks.level, lang)}` : t('placeNotTaken')}
                  {ks?.paused ? ` · ⏸ ${L('Paused', 'En pausa')}` : ''}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="qk-btn qk-btn-ghost" onClick={openKidView}>{t('kidView')}</button>
            </div>
          </div>

          {!ks && !loading && (
            <div style={{ marginTop: 20, padding: '12px 16px', borderRadius: 14, background: 'var(--honey-l)', color: '#7C5410', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{L(`${info.label} isn't on ${kid.name}'s subject list yet.`, `${info.label} aún no está en las materias de ${kid.name}.`)}</span>
              <Btn kind="primary" icon={ICONS.plus} onClick={addSubject}>{t('addSubject')}</Btn>
            </div>
          )}

          {/* stats */}
          <div className="qk-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(130px, 100%), 1fr))', gap: 14, marginTop: 24 }}>
            <StatCard tone="sky" icon={ICONS.book} value={rows.length} label={L('topics', 'temas')} />
            <StatCard tone="primary" icon={ICONS.cards} value={quizzes.length} label={t('quizzesTaken')} />
            <StatCard tone="berry" icon={ICONS.check} value={accuracy + '%'} label={t('accuracy')} />
            <StatCard tone="honey" icon={ICONS.clock} value={lastAt ? relativeDate(lastAt, lang) : '—'} label={L('last studied', 'último estudio')} />
          </div>

          {loading && (
            <div style={{ marginTop: 20 }}>
              <div className="qk-progress"><span style={{ width: '60%', animation: 'qk-pulse 1.2s ease infinite' }} /></div>
            </div>
          )}

          {error && <div style={{ marginTop: 20, padding: '10px 14px', borderRadius: 12, background: 'var(--coral-l)', color: 'var(--coral)', fontWeight: 600, fontSize: 13 }}>{error}</div>}

          {/* topics */}
          <div style={{ marginTop: 24 }}>
            <Section
              title={L('Topics & classes', 'Temas y clases')}
              sub={L(`What ${kid.name} is learning in ${info.label}. Add a topic, then create a guide, quiz or worksheet for it.`, `Lo que ${kid.name} está aprendiendo en ${info.label}. Agrega un tema y crea una guía, quiz u hoja para él.`)}
              action={<button className="qk-btn qk-btn-ghost" style={smallBtn} onClick={importClass}>{ICONS.pdf}<span>{L('Import a class', 'Importar una clase')}</span></button>}
            >
              <form onSubmit={(e) => { e.preventDefault(); void add(draft); }} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input className="qk-input" value={draft} maxLength={100} onChange={(e) => setDraft(e.target.value)}
                  placeholder={L('Add a topic or class, e.g. Ancient Egypt', 'Agrega un tema o clase, ej. Antiguo Egipto')} style={{ flex: '1 1 220px', width: 'auto', minWidth: 0 }} />
                <Btn kind="primary" icon={ICONS.plus} type="submit" className="qk-full-sm" disabled={adding || !draft.trim()}>{L('Add topic', 'Agregar tema')}</Btn>
              </form>
              {rows.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{L(`No topics yet. Add the first thing ${kid.name} is learning in ${info.label}.`, `Aún no hay temas. Agrega lo primero que ${kid.name} está aprendiendo en ${info.label}.`)}</div>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {rows.map((r) => {
                    const tone = r.lastPct == null ? 'var(--ink-3)' : r.mastered ? 'var(--primary-d)' : r.lastPct >= 50 ? '#7C5410' : 'var(--coral)';
                    return (
                      <div key={r.title} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 12, flexWrap: 'wrap' }}>
                        <div style={{ width: 30, height: 30, borderRadius: 9, background: r.mastered ? 'var(--primary)' : 'var(--surface)', color: r.mastered ? '#fff' : 'var(--ink-3)', display: 'grid', placeItems: 'center', flexShrink: 0, border: r.mastered ? 'none' : '1px solid var(--line)' }}>
                          {r.mastered ? ICONS.check : r.topic?.source === 'import' ? ICONS.pdf : ICONS.book}
                        </div>
                        <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--ink-3)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {r.topic?.source === 'import' && <span>📎 {L('Imported class', 'Clase importada')}</span>}
                            {r.inGoal && <span>🎯 {L('Goal', 'Meta')}</span>}
                            {r.lastPct == null
                              ? <span>{L('Not quizzed yet', 'Sin quiz todavía')}</span>
                              : <span style={{ color: tone, fontWeight: 700 }}>{r.lastPct}% · {r.attempts} {r.attempts === 1 ? t('attemptLabel') : t('attemptsLabel')}{r.lastAt ? ' · ' + relativeDate(r.lastAt, lang) : ''}</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <Btn kind="primary" icon={ICONS.spark} style={smallBtn} onClick={() => create(r)}>{L('Create', 'Crear')}</Btn>
                          {r.topic && (
                            <button aria-label={t('removeSubject')} title={t('removeSubject')} onClick={() => remove(r.topic!)} style={{ appearance: 'none', border: 0, background: 'transparent', color: 'var(--ink-3)', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 6 }}>{ICONS.trash}</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>
          </div>

          {/* test prep */}
          <div style={{ marginTop: 24 }}>
            <Section
              title={L('Test prep', 'Preparar un examen')}
              sub={L(`Pick the topics a school test covers and get one quiz and one study guide for all of them. Topics from earlier tests are marked, so each test can cover new ones.`, `Elige los temas que cubre un examen de la escuela y recibe un quiz y una guía de estudio para todos. Los temas de exámenes anteriores quedan marcados, para que cada examen cubra temas nuevos.`)}
              action={!testForm && <Btn kind="primary" icon={ICONS.plus} style={smallBtn} onClick={openTestForm} disabled={rows.length === 0}>{L('New test', 'Nuevo examen')}</Btn>}
            >
              {testForm && (
                <div style={{ display: 'grid', gap: 12, padding: 14, background: 'var(--surface-2)', borderRadius: 14 }}>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <label style={{ flex: '2 1 220px', fontSize: 12, color: 'var(--ink-3)' }}>{L('Test name (optional)', 'Nombre del examen (opcional)')}
                      <input className="qk-input" value={testForm.title} maxLength={80} onChange={(e) => setTestForm({ ...testForm, title: e.target.value })} placeholder={L('e.g. Unit 3 test', 'ej. Examen de la unidad 3')} style={{ marginTop: 4, fontSize: 13 }} />
                    </label>
                    <label style={{ flex: '1 1 150px', fontSize: 12, color: 'var(--ink-3)' }}>{L('Test date (optional)', 'Fecha del examen (opcional)')}
                      <input className="qk-input" type="date" value={testForm.date} onChange={(e) => setTestForm({ ...testForm, date: e.target.value })} style={{ marginTop: 4, fontSize: 13 }} />
                    </label>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 6 }}>
                      {L('What does the test cover?', '¿Qué cubre el examen?')} · {testForm.picked.length}/{MAX_TEST_TOPICS}
                    </div>
                    <div style={{ display: 'grid', gap: 6 }}>
                      {rowTopics.map((x) => {
                        const on = testForm.picked.some((n) => norm(n) === norm(x.title));
                        const before = usedInTests.get(norm(x.title));
                        return (
                          <label key={x.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: 'var(--surface)', border: '1px solid ' + (on ? 'var(--primary)' : 'var(--line)'), cursor: 'pointer', flexWrap: 'wrap' }}>
                            <input type="checkbox" checked={on} disabled={!on && testForm.picked.length >= MAX_TEST_TOPICS}
                              onChange={() => setTestForm({ ...testForm, picked: on ? testForm.picked.filter((n) => norm(n) !== norm(x.title)) : [...testForm.picked, x.title] })} />
                            <span style={{ flex: '1 1 160px', minWidth: 0, fontSize: 14, fontWeight: 600, overflowWrap: 'anywhere' }}>{x.title}</span>
                            {before && <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: 'var(--honey-l)', color: '#7C5410' }}>{L('In earlier test: ', 'En examen anterior: ')}{before.title}</span>}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Btn kind="primary" icon={ICONS.spark} onClick={submitTest} disabled={creatingTest || testForm.picked.length === 0}>
                      {creatingTest ? L('Creating the quiz and guide…', 'Creando el quiz y la guía…') : L('Create quiz and study guide', 'Crear quiz y guía de estudio')}
                    </Btn>
                    <button className="qk-btn qk-btn-ghost" onClick={() => setTestForm(null)} disabled={creatingTest}>{t('cancel')}</button>
                  </div>
                  {creatingTest && <div className="qk-progress"><span style={{ width: '60%', animation: 'qk-pulse 1.2s ease infinite' }} /></div>}
                </div>
              )}

              {tests.length === 0 && !testForm && (
                <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
                  {rows.length === 0
                    ? L('Add the topics or classes first, then create a test from them.', 'Agrega primero los temas o clases y luego crea un examen con ellos.')
                    : L(`No tests yet. Create one when ${kid.name} has a test at school.`, `Aún no hay exámenes. Crea uno cuando ${kid.name} tenga un examen en la escuela.`)}
                </div>
              )}

              {tests.length > 0 && (
                <div style={{ display: 'grid', gap: 8 }}>
                  {tests.map((test) => {
                    const last = quizzes.find((q) => q.topic && norm(q.topic) === norm(test.title) && (q.total || 0) > 0);
                    const pct = last ? Math.round(((last.correct || 0) / (last.total || 1)) * 100) : null;
                    const upcoming = test.testDate ? daysUntil(test.testDate) >= 0 : false;
                    return (
                      <div key={test.id} style={{ padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 12, display: 'grid', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <div style={{ flex: '1 1 180px', minWidth: 0, fontSize: 14, fontWeight: 700, overflowWrap: 'anywhere' }}>{test.title}</div>
                          {test.testDate && <span style={{ padding: '2px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: upcoming ? 'var(--honey-l)' : 'var(--surface)', color: upcoming ? '#7C5410' : 'var(--ink-3)' }}>📅 {testWhen(test.testDate)}</span>}
                          <span style={{ padding: '2px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: pct == null ? 'var(--surface)' : pct >= 70 ? 'var(--primary-l)' : 'var(--coral-l)', color: pct == null ? 'var(--ink-3)' : pct >= 70 ? 'var(--primary-d)' : 'var(--coral)' }}>
                            {pct == null ? L('Quiz not taken', 'Quiz sin hacer') : `${L('Last quiz', 'Último quiz')}: ${pct}%`}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {test.topics.map((name) => <span key={name} style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink-2)' }}>{name}</span>)}
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <Btn kind="ghost" icon={ICONS.book} style={smallBtn} onClick={() => openTest(test, 'guide')}>{L('Study guide', 'Guía de estudio')}</Btn>
                          <Btn kind="primary" icon={ICONS.cards} style={smallBtn} onClick={() => openTest(test, 'quiz')}>{L('Practice quiz', 'Quiz de práctica')}</Btn>
                          <button aria-label={t('removeSubject')} title={t('removeSubject')} onClick={() => deleteTest(test)} style={{ appearance: 'none', border: 0, background: 'transparent', color: 'var(--ink-3)', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 6, marginLeft: 'auto' }}>{ICONS.trash}</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>
          </div>

          {/* goal */}
          {ks && !loading && (
            <div style={{ marginTop: 24 }}>
              <GoalsSection kid={kid} quizzes={quizzes} only={subject} topics={topics} />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: 16, marginTop: 24, alignItems: 'start' }}>
            {/* recent quizzes */}
            <Section title={t('recentQuizzes')}>
              {quizzes.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{t('nothingHereYet')}</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {quizzes.slice(0, 10).map((q, i) => {
                    const pct = (q.total || 0) > 0 ? Math.round(((q.correct || 0) / (q.total || 1)) * 100) : 0;
                    return (
                      <div key={`${q.created_at}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', background: 'var(--surface-2)', borderRadius: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.topic || '—'}</div>
                          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{relativeDate(q.created_at, lang)} · {q.correct || 0}/{q.total || 0} · {pct}%</div>
                        </div>
                        {gamification !== 'minimal' && <Stars count={q.stars || 0} of={5} size={13} />}
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>

            {/* assigned work */}
            <Section title={t('assignedWork')}>
              {assignments.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{t('nothingHereYet')}</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {assignments.slice(0, 10).map((a) => {
                    const done = a.status === 'completed';
                    return (
                      <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', background: 'var(--surface-2)', borderRadius: 12 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--sky-l)', color: 'var(--sky)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                          {a.type === 'quiz' ? ICONS.cards : a.type === 'guide' ? ICONS.book : ICONS.pdf}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.topic || '—'}</div>
                          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{relativeDate(a.assigned_at, lang)}</div>
                        </div>
                        <span style={{ padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700, flexShrink: 0, background: done ? 'var(--primary-l)' : 'var(--honey-l)', color: done ? 'var(--primary-d)' : '#7C5410' }}>
                          {done ? t('statusDone') : t('statusPending')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>
          </div>

          {/* subject settings */}
          {ks && (
            <div style={{ marginTop: 24 }}>
              <Section title={L('Subject settings', 'Ajustes de la materia')}>
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200, fontSize: 13, color: placed ? 'var(--primary-d)' : 'var(--ink-3)', fontWeight: placed ? 700 : 400 }}>
                      {placed && ks.level != null ? `${t('placeEstLevel')} ${levelLabel(ks.level, lang)} · ${ks.placementAccuracy ?? 0}%` : t('placeNotTaken')}
                    </div>
                    <Btn kind={placed ? 'ghost' : 'primary'} icon={ICONS.spark} onClick={startPlacement}>{placed ? t('placeRetake') : t('placeTake')}</Btn>
                  </div>
                  {placed && ((ks.strongTopics?.length || 0) > 0 || (ks.weakTopics?.length || 0) > 0) && (
                    <div style={{ fontSize: 12, color: 'var(--ink-2)', display: 'grid', gap: 2 }}>
                      {(ks.strongTopics?.length || 0) > 0 && <div>💪 {ks.strongTopics!.join(', ')}</div>}
                      {(ks.weakTopics?.length || 0) > 0 && <div>🎯 {ks.weakTopics!.join(', ')}</div>}
                    </div>
                  )}
                  {editingFocus ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input className="qk-input" value={focusDraft} maxLength={120} placeholder={t('focusPh')} onChange={(e) => setFocusDraft(e.target.value)} style={{ fontSize: 13 }} />
                      <button className="qk-btn qk-btn-ghost" style={{ fontSize: 13 }} onClick={saveFocus}>{t('saveFocus')}</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingFocus(true); setFocusDraft(ks.focus || ''); }} style={{ appearance: 'none', border: 0, background: 'transparent', padding: 0, textAlign: 'left', cursor: 'pointer', fontSize: 13, color: 'var(--ink-3)' }}>
                      {ks.focus ? `🎯 ${ks.focus}` : t('editFocus')}
                    </button>
                  )}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <label style={{ fontSize: 13, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {t('subjectLang')}
                      <select value={ks.lang || 'en'} onChange={(e) => { const l = e.target.value as 'en' | 'es' | 'fr'; void patchSubject({ lang: l }, { lang: l }); }} style={{ fontSize: 13, padding: '4px 8px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)' }}>
                        <option value="en">English</option><option value="es">Español</option><option value="fr">Français</option>
                      </select>
                    </label>
                    <button className="qk-btn qk-btn-ghost" style={smallBtn} onClick={() => patchSubject({ paused: !ks.paused }, { paused: !ks.paused })} title={L('Paused subjects are left out of the daily plan', 'Las materias en pausa no entran al plan diario')}>
                      {ks.paused ? L('▶ Resume', '▶ Reanudar') : L('⏸ Pause', '⏸ Pausar')}
                    </button>
                    <button className="qk-btn qk-btn-ghost" style={{ ...smallBtn, color: 'var(--coral)' }} onClick={removeSubject}>{ICONS.trash}<span>{L('Remove subject', 'Quitar materia')}</span></button>
                  </div>
                </div>
              </Section>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
