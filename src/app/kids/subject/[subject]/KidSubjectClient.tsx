'use client';
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ICONS } from '@/components/ui/Icons';
import { Btn } from '@/components/ui/Btn';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';
import { subjectInfo, fromRow } from '@/lib/subjects';
import { goalFromRow, goalProgress } from '@/lib/goals';
import { loadTopics, subjectTopics, type TopicRow } from '@/lib/topics';
import { daysUntil, loadTests, testStudyParams } from '@/lib/tests';
import type { KidTest, KidTopic, RecentItem } from '@/types';

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
  const info = subjectInfo(subject, lang, customSubjects);
  const ks = kid?.subjects?.find((s) => s.subject === subject);
  const here = `/kids/subject/${encodeURIComponent(subject)}`;

  const [quizzes, setQuizzes] = React.useState<QuizRow[]>([]);
  const [assignments, setAssignments] = React.useState<AssignmentRow[]>([]);
  const [topics, setTopics] = React.useState<KidTopic[]>([]);
  const [tests, setTests] = React.useState<KidTest[]>([]);
  const [loading, setLoading] = React.useState(!isDemo);

  React.useEffect(() => { setMode('kid'); }, []);

  React.useEffect(() => {
    if (!kid || !subject) { setLoading(false); return; }
    if (isDemo) {
      setQuizzes((kid.recent || []).filter((r) => r.kind === 'quiz' && r.subject === subject).map((r) => ({
        subject, topic: r.title, total: 5, correct: r.score, stars: r.score, created_at: new Date().toISOString(),
      })));
      setTopics((kid.topics || []).filter((x) => x.subject === subject).reverse());
      setTests((kid.tests || []).filter((x) => x.subject === subject).reverse());
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
      } catch (e) {
        console.warn('Could not load subject:', e);
      }
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kid?.id, subject, isDemo]);

  if (!kid) return null;

  const rows = subjectTopics(subject, topics, kid.goals || [], quizzes);
  const goal = (kid.goals || []).find((g) => g.subject === subject && g.status === 'active');
  const prog = goal ? goalProgress(goal, quizzes) : null;
  const accuracy = quizzes.length ? Math.round(quizzes.reduce((a, q) => a + ((q.total || 0) > 0 ? ((q.correct || 0) / (q.total || 1)) * 100 : 0), 0) / quizzes.length) : 0;
  const starsHere = quizzes.reduce((a, q) => a + (q.stars || 0), 0);
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

  const study = (row: TopicRow, kind: 'guide' | 'quiz') => {
    setStudyParams({
      ...studyParams,
      subject, topic: row.title, grade: kid.grade,
      contentId: undefined, assignmentId: undefined, planItemId: undefined,
      contentLang: ks?.lang, source: row.topic?.notes, returnTo: here, topics: undefined, pairedContentId: undefined,
    });
    router.push(kind === 'guide' ? '/kids/guide' : '/kids/quiz');
  };

  const openTest = (test: KidTest, kind: 'guide' | 'quiz') => {
    setStudyParams(testStudyParams(studyParams, kid, test, kind, topics, ks, here));
    router.push(kind === 'guide' ? '/kids/guide' : '/kids/quiz');
  };

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
      contentLang: undefined, source: undefined, returnTo: here, topics: undefined, pairedContentId: undefined,
    });
    router.push(r.kind === 'quiz' ? '/kids/quiz' : r.kind === 'guide' ? '/kids/guide' : '/kids/pdf');
  };

  return (
    <AppShell>
      <div className="qk-screen qk-page-enter" style={{ padding: '32px clamp(20px, 5vw, 56px) 64px' }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <button className="qk-btn qk-btn-ghost" onClick={() => router.push('/kids/home')}>{ICONS.back} <span>{t('backHome')}</span></button>

          {/* hero */}
          <div className="qk-card qk-slide-up" style={{ marginTop: 18, padding: 'clamp(20px, 4vw, 32px)', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', background: 'linear-gradient(135deg, var(--primary-l) 0%, var(--sky-l) 100%)', borderColor: 'var(--primary)', position: 'relative', overflow: 'hidden' }}>
            <div aria-hidden style={{ position: 'absolute', inset: 0, opacity: .16, backgroundImage: 'radial-gradient(var(--primary) 1.5px, transparent 1.5px)', backgroundSize: '22px 22px' }} />
            <div style={{ position: 'relative', width: 84, height: 84, borderRadius: 24, background: 'var(--surface)', display: 'grid', placeItems: 'center', fontSize: 44, flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}>{info.icon}</div>
            <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
              <h1 className="qk-h1" style={{ margin: 0, fontSize: 'clamp(28px, 4vw, 40px)' }}>{info.label}</h1>
              <div style={{ marginTop: 12, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{L('Topics', 'Temas')}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22 }}>{rows.length}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Quizzes</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22 }}>{quizzes.length}</div>
                </div>
                {quizzes.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{t('accuracy')}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22 }}>{accuracy}%</div>
                  </div>
                )}
                {gamification !== 'minimal' && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{t('starsEarned')}</div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22, color: '#7C5410' }}>
                      {React.cloneElement(ICONS.star as React.ReactElement<{ size?: number }>, { size: 20 })}<span>{starsHere}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* goal */}
          {goal && prog && (
            <section className="qk-card" style={{ marginTop: 20, padding: 20, display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>🎯 {L('My goal', 'Mi meta')}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 19 }}>{goal.title}</div>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--primary-d)' }}>{prog.pct}%</div>
              </div>
              <div className="qk-progress"><span style={{ width: prog.pct + '%' }} /></div>
              <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{prog.mastered.length}/{goal.topics.length} {t('goalTopicsDone')}</div>
            </section>
          )}

          {/* tests to get ready for */}
          {tests.length > 0 && (
            <section style={{ marginTop: 28 }}>
              <h2 className="qk-h2" style={{ margin: '0 0 14px' }}>{L('Get ready for a test', 'Prepárate para un examen')}</h2>
              <div className="qk-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', gap: 14 }}>
                {tests.map((test) => {
                  const last = quizzes.find((q) => q.topic && q.topic.trim().toLowerCase() === test.title.trim().toLowerCase() && (q.total || 0) > 0);
                  const pct = last ? Math.round(((last.correct || 0) / (last.total || 1)) * 100) : null;
                  const upcoming = test.testDate ? daysUntil(test.testDate) >= 0 : false;
                  return (
                    <div key={test.id} className="qk-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, border: '1px solid ' + (pct != null && pct >= 70 ? 'var(--primary)' : 'var(--line)') }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17, lineHeight: 1.25, overflowWrap: 'anywhere' }}>{test.title}</div>
                        {test.testDate && upcoming && <span style={{ padding: '2px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: 'var(--honey-l)', color: '#7C5410', flexShrink: 0 }}>📅 {testWhen(test.testDate)}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                        {test.topics.join(' · ')}
                      </div>
                      <div style={{ fontSize: 12, color: pct == null ? 'var(--ink-3)' : pct >= 70 ? 'var(--primary-d)' : 'var(--coral)', fontWeight: pct == null ? 400 : 700 }}>
                        {pct == null ? L('Read the guide, then try the quiz.', 'Lee la guía y luego prueba el quiz.') : `${L('Last quiz', 'Último quiz')}: ${pct}%`}
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                        <Btn kind="ghost" icon={ICONS.book} style={{ flex: 1, fontSize: 13, padding: '8px 10px' }} onClick={() => openTest(test, 'guide')}>{L('Study guide', 'Guía')}</Btn>
                        <Btn kind="primary" icon={ICONS.cards} style={{ flex: 1, fontSize: 13, padding: '8px 10px' }} onClick={() => openTest(test, 'quiz')}>Quiz</Btn>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* topics */}
          <section style={{ marginTop: 28 }}>
            <h2 className="qk-h2" style={{ margin: '0 0 14px' }}>{L('What I’m learning', 'Lo que estoy aprendiendo')}</h2>
            {loading && rows.length === 0 && <div className="qk-card" style={{ padding: 20, color: 'var(--ink-3)' }}>{L('Loading…', 'Cargando…')}</div>}
            {!loading && rows.length === 0 && (
              <div className="qk-card" style={{ padding: 24, textAlign: 'center', color: 'var(--ink-3)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>{L('No topics here yet.', 'Todavía no hay temas aquí.')}</div>
                <div style={{ marginTop: 8, fontSize: 14 }}>{L('Ask a grown-up to add one.', 'Pídele a un adulto que agregue uno.')}</div>
              </div>
            )}
            {rows.length > 0 && (
              <div className="qk-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))', gap: 14 }}>
                {rows.map((r) => (
                  <div key={r.title} className="qk-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, border: '1px solid ' + (r.mastered ? 'var(--primary)' : 'var(--line)') }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17, lineHeight: 1.25 }}>{r.title}</div>
                      {r.mastered && <div title={L('Mastered', 'Dominado')} style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{ICONS.check}</div>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                      {r.lastPct == null ? L('New! Start with the guide.', '¡Nuevo! Empieza con la guía.') : `${L('Last quiz', 'Último quiz')}: ${r.lastPct}%`}
                      {r.topic?.source === 'import' ? ` · 📎 ${L('From your class', 'De tu clase')}` : ''}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                      <Btn kind="ghost" icon={ICONS.book} style={{ flex: 1, fontSize: 13, padding: '8px 10px' }} onClick={() => study(r, 'guide')}>{L('Learn', 'Aprender')}</Btn>
                      <Btn kind="primary" icon={ICONS.cards} style={{ flex: 1, fontSize: 13, padding: '8px 10px' }} onClick={() => study(r, 'quiz')}>Quiz</Btn>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* work assigned in this subject */}
          {work.length > 0 && (
            <section style={{ marginTop: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                <h2 className="qk-h2" style={{ margin: 0 }}>{L('My work', 'Mis tareas')}</h2>
                {pending.length > 0 && <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-3)' }}>{pending.length} {t('statusPending').toLowerCase()}</span>}
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {work.map((r, idx) => {
                  const done = r.status === 'completed';
                  const tone = r.kind === 'guide' ? 'sky' : r.kind === 'pdf' ? 'coral' : 'primary';
                  return (
                    <button key={r.assignmentId || idx} onClick={() => openWork(r)} className="qk-card"
                      style={{ appearance: 'none', textAlign: 'left', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', border: '1px solid var(--line)', opacity: done ? 0.7 : 1 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: `var(--${tone === 'primary' ? 'primary-l' : tone + '-l'})`, color: `var(--${tone})`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        {r.kind === 'guide' ? ICONS.book : r.kind === 'pdf' ? ICONS.pdf : ICONS.cards}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                          {r.kind === 'quiz' ? t('genQuiz') : r.kind === 'guide' ? t('genGuide') : t('genPdf')} · {r.when}
                        </div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, lineHeight: 1.25 }}>{r.title}</div>
                      </div>
                      {r.score > 0 && <span style={{ fontSize: 12, color: 'var(--honey)', fontWeight: 700, flexShrink: 0 }}>{'⭐'.repeat(Math.min(r.score, 5))}</span>}
                      {done && <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{ICONS.check}</div>}
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </AppShell>
  );
}
