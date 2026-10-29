'use client';
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ICONS } from '@/components/ui/Icons';
import { Btn } from '@/components/ui/Btn';
import { AppShell } from '@/components/layout/AppShell';
import { kitPartCopy } from '@/components/exam/ExamSetup';
import { useStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { subjectInfo } from '@/lib/subjects';
import { loadTopics } from '@/lib/topics';
import { PRACTICE_PASS } from '@/lib/practice';
import { KIT_PARTS, KIT_ROUTES, daysUntil, examMemory, gradeToPct, loadTest, loadTests, testIsOver, testStudyParams, updateTest, type KitPart } from '@/lib/tests';
import type { KidTest, KidTopic } from '@/types';

interface QuizRow { total: number | null; correct: number | null; difficulty: string | null; created_at: string }

const norm = (x: string) => x.trim().toLowerCase();

/** One school test: its study kit, how ready the kid is, and the grade they got once it is over */
export default function ExamClient() {
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === 'string' ? params.id : '';
  const { lang, kids, activeKidId, isDemo, updateKid, customSubjects, studyParams, setStudyParams, setMode } = useStore();
  const L = (en: string, es: string) => (lang === 'es' ? es : en);
  const router = useRouter();
  const kid = kids.find((k) => k.id === activeKidId) || kids[0];
  const here = `/kids/exam/${id}`;

  const [test, setTest] = React.useState<KidTest | null | undefined>(undefined);
  const [topics, setTopics] = React.useState<KidTopic[]>([]);
  const [others, setOthers] = React.useState<KidTest[]>([]);
  const [quizzes, setQuizzes] = React.useState<QuizRow[]>([]);
  const [gradeForm, setGradeForm] = React.useState<{ grade: string; note: string } | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => { setMode('kid'); }, []);

  React.useEffect(() => {
    if (!kid || !id) return;
    let cancelled = false;
    (async () => {
      try {
        const t = await loadTest(kid, id, isDemo);
        if (cancelled) return;
        setTest(t);
        if (!t) return;
        const [topicList, testList, quizRes] = await Promise.all([
          loadTopics(kid, t.subject, isDemo).catch(() => [] as KidTopic[]),
          loadTests(kid, t.subject, isDemo).catch(() => [] as KidTest[]),
          isDemo ? Promise.resolve({ data: [] as QuizRow[] }) : createClient().from('quiz_results').select('total, correct, difficulty, created_at')
            .eq('kid_id', kid.id).eq('subject', t.subject).eq('topic', t.title).order('created_at', { ascending: false }).limit(50),
        ]);
        if (cancelled) return;
        setTopics(topicList);
        setOthers(testList.filter((x) => x.id !== t.id));
        setQuizzes((quizRes.data as QuizRow[]) || []);
      } catch (e) {
        console.warn('Could not load test:', e);
        if (!cancelled) setTest(null);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kid?.id, id, isDemo]);

  if (!kid) return null;

  if (test === undefined || test === null) {
    return (
      <AppShell>
        <div className="qk-screen qk-page-enter" style={{ padding: '32px clamp(16px, 5vw, 56px) 64px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <button className="qk-btn qk-btn-ghost" onClick={() => router.push('/kids/home')}>{ICONS.back} <span>{L('Home', 'Inicio')}</span></button>
            <div className="qk-card" style={{ marginTop: 18, padding: 24, color: 'var(--ink-3)' }}>
              {test === undefined ? L('Loading…', 'Cargando…') : L("We couldn't find this test.", 'No encontramos este examen.')}
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const ks = kid.subjects?.find((s) => s.subject === test.subject);
  const info = subjectInfo(test.subject, lang, customSubjects, ks);
  const subjectPage = `/kids/subject/${encodeURIComponent(test.subject)}`;
  const days = test.testDate ? daysUntil(test.testDate) : null;
  const over = testIsOver(test);
  const flash = quizzes.filter((q) => q.difficulty !== 'test' && (q.total || 0) > 0);
  const flashPct = flash[0] ? Math.round(((flash[0].correct || 0) / (flash[0].total || 1)) * 100) : null;
  const practice = test.practice;
  const memory = examMemory(others);

  const open = (part: KitPart) => {
    setStudyParams(testStudyParams(studyParams, kid, test, part, topics, ks, here, memory));
    router.push(KIT_ROUTES[part]);
  };

  // Guide on one topic of the test, to go over what the practice test showed was weak
  const review = (title: string) => {
    const topic = topics.find((x) => norm(x.title) === norm(title));
    setStudyParams({
      ...studyParams,
      subject: test.subject, topic: title, grade: kid.grade,
      contentId: undefined, assignmentId: undefined, planItemId: undefined, pairedContentId: undefined, topics: undefined, testId: undefined, memory: undefined,
      contentLang: ks?.lang, source: topic?.notes, returnTo: here,
    });
    router.push('/kids/guide');
  };

  const saveGrade = async () => {
    if (!gradeForm || !gradeForm.grade.trim()) return;
    setSaving(true); setError(null);
    const grade = gradeForm.grade.trim().slice(0, 20);
    const saved = await updateTest(kid.id, test, { resultGrade: grade, resultPct: gradeToPct(grade), resultNote: gradeForm.note.trim().slice(0, 300) || undefined, resultAt: new Date().toISOString() }, isDemo);
    if (saved) {
      setTest(saved);
      if (isDemo) updateKid(kid.id, { tests: (useStore.getState().kids.find((k) => k.id === kid.id)?.tests || []).map((x) => (x.id === saved.id ? saved : x)) });
      setGradeForm(null);
    } else setError(L("Couldn't save your grade. Please try again.", 'No pudimos guardar tu nota. Intenta de nuevo.'));
    setSaving(false);
  };

  const when = () => {
    if (days == null) return null;
    if (days === 0) return L('Today!', '¡Hoy!');
    if (days === 1) return L('Tomorrow', 'Mañana');
    if (days > 1) return L(`In ${days} days`, `En ${days} días`);
    return new Date(test.testDate + 'T00:00').toLocaleDateString(lang === 'es' ? 'es-DO' : 'en-US', { month: 'short', day: 'numeric' });
  };

  const partStatus = (part: KitPart): string | null => {
    if (part === 'quiz' && flashPct != null) return `${L('Last', 'Último')}: ${flashPct}%`;
    if (part === 'practice' && practice) return `${L('Best', 'Mejor')}: ${practice.best}% · ${practice.attempts} ${practice.attempts === 1 ? L('try', 'intento') : L('tries', 'intentos')}`;
    return null;
  };
  const steps: Record<KitPart, string> = {
    guide: L('Read it first', 'Léela primero'),
    quiz: L('Warm up', 'Calienta'),
    practice: L('Check yourself', 'Ponte a prueba'),
    pdf: L('Extra practice', 'Práctica extra'),
  };

  const topicScores = test.topics.map((title) => ({ title, pct: practice?.byTopic[title] ?? null }));
  const ready = practice ? practice.best >= PRACTICE_PASS && practice.weak.length === 0 : false;
  const resultTone = test.resultPct == null ? 'var(--ink)' : test.resultPct >= PRACTICE_PASS ? 'var(--primary-d)' : 'var(--coral)';

  return (
    <AppShell>
      <div className="qk-screen qk-page-enter" style={{ padding: '32px clamp(16px, 5vw, 56px) 64px' }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <button className="qk-btn qk-btn-ghost" onClick={() => router.push(subjectPage)}>{ICONS.back} <span>{info.label}</span></button>

          {/* hero */}
          <div className="qk-card qk-slide-up" style={{ marginTop: 18, padding: 'clamp(20px, 4vw, 30px)', background: 'linear-gradient(135deg, var(--honey-l) 0%, var(--primary-l) 100%)', borderColor: 'var(--honey)', position: 'relative', overflow: 'hidden' }}>
            <div aria-hidden style={{ position: 'absolute', inset: 0, opacity: .14, backgroundImage: 'radial-gradient(var(--honey) 1.5px, transparent 1.5px)', backgroundSize: '22px 22px' }} />
            <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ width: 72, height: 72, borderRadius: 22, background: 'var(--surface)', display: 'grid', placeItems: 'center', fontSize: 38, flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}>📝</div>
              <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                <span className="qk-eyebrow">{info.icon} {info.label} · {L('Test mode', 'Modo examen')}</span>
                <h1 className="qk-h1" style={{ margin: '6px 0 0', fontSize: 'clamp(26px, 4vw, 38px)', overflowWrap: 'anywhere' }}>{test.title}</h1>
                <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {test.topics.map((name) => <span key={name} style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: 'var(--surface)', border: '1px solid var(--line)' }}>{name}</span>)}
                </div>
              </div>
              {when() && (
                <div style={{ padding: '10px 14px', borderRadius: 16, background: 'var(--surface)', textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>📅 {days != null && days < 0 ? L('Was on', 'Fue el') : L('Test day', 'Día del examen')}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: days != null && days >= 0 && days <= 2 ? 'var(--coral)' : 'var(--ink)' }}>{when()}</div>
                </div>
              )}
            </div>
          </div>

          {error && <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 12, background: 'var(--coral-l)', color: 'var(--coral)', fontWeight: 600, fontSize: 13 }}>{error}</div>}

          {/* how did it go (once the test day comes) */}
          {(over || gradeForm) && (
            <section className="qk-card" style={{ marginTop: 20, padding: 20, display: 'grid', gap: 12, borderColor: test.resultGrade ? 'var(--line)' : 'var(--primary)' }}>
              {test.resultGrade && !gradeForm ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: resultTone, flexShrink: 0 }}>{test.resultGrade}</div>
                  <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18 }}>
                      {test.resultPct == null ? L('Your grade', 'Tu nota') : test.resultPct >= 90 ? L('Amazing work! 🎉', '¡Increíble! 🎉') : test.resultPct >= PRACTICE_PASS ? L('Nice job! 👏', '¡Buen trabajo! 👏') : L('Good try. Let’s fix what was hard 💪', 'Buen intento. Arreglemos lo difícil 💪')}
                    </div>
                    {test.resultNote && <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 4 }}>“{test.resultNote}”</div>}
                    <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>🧠 {L(`Saved to ${info.label}, so your next test focuses on what was hard.`, `Guardado en ${info.label}, para que tu próximo examen se enfoque en lo difícil.`)}</div>
                  </div>
                  <button className="qk-btn qk-btn-ghost" style={{ fontSize: 13, padding: '6px 12px' }} onClick={() => setGradeForm({ grade: test.resultGrade || '', note: test.resultNote || '' })}>{ICONS.pencil}<span>{L('Edit', 'Editar')}</span></button>
                </div>
              ) : (
                <>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 19 }}>{L('How did the test go?', '¿Cómo te fue en el examen?')}</div>
                    <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>{L('Add the grade you got (optional). It helps us know what to practice next.', 'Agrega la nota que sacaste (opcional). Nos ayuda a saber qué practicar después.')}</div>
                  </div>
                  {gradeForm ? (
                    <form onSubmit={(e) => { e.preventDefault(); void saveGrade(); }} style={{ display: 'grid', gap: 10 }}>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <label style={{ flex: '0 1 160px', fontSize: 12, color: 'var(--ink-3)' }}>{L('My grade', 'Mi nota')}
                          <input className="qk-input" autoFocus value={gradeForm.grade} maxLength={20} onChange={(e) => setGradeForm({ ...gradeForm, grade: e.target.value })} placeholder={L('e.g. 92, B+, 8/10', 'ej. 92, B+, 8/10')} style={{ marginTop: 4, fontSize: 15 }} />
                        </label>
                        <label style={{ flex: '1 1 260px', fontSize: 12, color: 'var(--ink-3)' }}>{L('What was hard? (optional)', '¿Qué fue difícil? (opcional)')}
                          <input className="qk-input" value={gradeForm.note} maxLength={300} onChange={(e) => setGradeForm({ ...gradeForm, note: e.target.value })} placeholder={L('e.g. The word problems', 'ej. Los problemas escritos')} style={{ marginTop: 4, fontSize: 15 }} />
                        </label>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Btn kind="primary" type="submit" icon={ICONS.check} disabled={saving || !gradeForm.grade.trim()}>{saving ? L('Saving…', 'Guardando…') : L('Save my grade', 'Guardar mi nota')}</Btn>
                        <button type="button" className="qk-btn qk-btn-ghost" onClick={() => setGradeForm(null)} disabled={saving}>{L('Cancel', 'Cancelar')}</button>
                      </div>
                    </form>
                  ) : (
                    <div><Btn kind="primary" icon={ICONS.plus} onClick={() => setGradeForm({ grade: '', note: '' })}>{L('Add my grade', 'Agregar mi nota')}</Btn></div>
                  )}
                </>
              )}
            </section>
          )}

          {/* readiness */}
          <section className="qk-card" style={{ marginTop: 20, padding: 20, display: 'grid', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>🎯 {L('How ready am I?', '¿Qué tan listo estoy?')}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, marginTop: 2 }}>
                  {!practice ? L('Take the practice test to find out', 'Haz el examen de práctica para saberlo') : ready ? L('You’re ready! Keep it fresh 🌟', '¡Estás listo! Sigue repasando 🌟') : L('Almost there: review the topics in orange', 'Ya casi: repasa los temas en naranja')}
                </div>
              </div>
              {practice && <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 30, color: practice.best >= PRACTICE_PASS ? 'var(--primary-d)' : 'var(--coral)' }}>{practice.best}%</div>}
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {topicScores.map(({ title, pct }) => {
                const weak = pct != null && pct < PRACTICE_PASS;
                return (
                  <div key={title} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 160px', minWidth: 0, fontSize: 14, fontWeight: 600, overflowWrap: 'anywhere' }}>{title}</div>
                    <div style={{ flex: '2 1 180px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="qk-progress" style={{ flex: 1 }}><span style={{ width: (pct ?? 0) + '%', background: weak ? 'var(--coral)' : undefined }} /></div>
                      <span style={{ width: 42, textAlign: 'right', fontSize: 13, fontWeight: 700, color: pct == null ? 'var(--ink-3)' : weak ? 'var(--coral)' : 'var(--primary-d)' }}>{pct == null ? '—' : pct + '%'}</span>
                    </div>
                    {weak && <button className="qk-btn qk-btn-ghost" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => review(title)}>{ICONS.book}<span>{L('Review', 'Repasar')}</span></button>}
                  </div>
                );
              })}
            </div>
            {practice && practice.missed.length > 0 && (
              <div style={{ fontSize: 13, color: 'var(--ink-2)', background: 'var(--surface-2)', borderRadius: 12, padding: '10px 12px' }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{L('Things to go over again', 'Cosas para repasar')}</div>
                <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 2 }}>
                  {practice.missed.map((m) => <li key={m}>{m}</li>)}
                </ul>
              </div>
            )}
          </section>

          {/* study kit */}
          <section style={{ marginTop: 28 }}>
            <h2 className="qk-h2" style={{ margin: '0 0 14px' }}>{L('My study kit', 'Mi kit de estudio')}</h2>
            <div className="qk-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))', gap: 14 }}>
              {KIT_PARTS.map((part, i) => {
                const c = kitPartCopy(part, lang);
                const status = partStatus(part);
                return (
                  <button key={part} onClick={() => open(part)} className="qk-card" style={{ appearance: 'none', textAlign: 'left', padding: 16, display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer', border: '1px solid ' + (part === 'practice' ? 'var(--berry)' : 'var(--line)'), font: 'inherit', color: 'inherit' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: `var(--${c.tone === 'primary' ? 'primary-l' : c.tone + '-l'})`, color: `var(--${c.tone})`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{c.icon}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{L('Step', 'Paso')} {i + 1} · {steps[part]}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, lineHeight: 1.2 }}>{c.title}</div>
                      <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>{c.sub}</div>
                    </div>
                    {status && <div style={{ marginTop: 'auto', fontSize: 12, fontWeight: 700, color: 'var(--primary-d)' }}>{status}</div>}
                  </button>
                );
              })}
            </div>
          </section>

          {!over && !gradeForm && (
            <div style={{ marginTop: 22, textAlign: 'center' }}>
              <button onClick={() => setGradeForm({ grade: '', note: '' })} style={{ appearance: 'none', border: 0, background: 'transparent', color: 'var(--ink-3)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>{L('Already took the test? Add your grade', '¿Ya hiciste el examen? Agrega tu nota')}</button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
