'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ICONS } from '@/components/ui/Icons';
import { LoadingBar } from '@/components/ui/LoadingBar';
import { Btn } from '@/components/ui/Btn';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';
import { subjectInfo } from '@/lib/subjects';
import { PRACTICE_ORDER, PRACTICE_PASS, answered, fallbackGrade, gradeLocally, itemPoints, practiceStats, scorePractice, toPractice, type PracticeAnswer } from '@/lib/practice';
import { loadTest, updateTest } from '@/lib/tests';
import type { GradedAnswer, KidTest, PracticeItem, PracticeItemType, PracticeTest } from '@/types';

const FALLBACK_EN: PracticeTest = {
  items: [
    { type: 'mc', q: 'Which planet is closest to the Sun?', choices: ['Mercury', 'Venus', 'Earth', 'Mars'], a: 0 },
    { type: 'mc', q: 'What is the Sun?', choices: ['A planet', 'A star', 'A moon', 'A comet'], a: 1 },
    { type: 'mc', q: 'Which is the largest planet?', choices: ['Saturn', 'Jupiter', 'Neptune', 'Earth'], a: 1 },
    { type: 'tf', s: 'The Moon makes its own light.', a: false, fix: 'The Moon reflects light from the Sun.' },
    { type: 'tf', s: 'Earth goes around the Sun.', a: true },
    { type: 'tf', s: 'Mars is called the Blue Planet.', a: false, fix: 'Mars is called the Red Planet.' },
    { type: 'fill', s: 'The path a planet follows around the Sun is called an ___.', a: 'orbit' },
    { type: 'fill', s: 'Earth takes one ___ to go around the Sun.', a: 'year' },
    { type: 'short', q: 'What is a planet?', a: 'A planet is a large, round object in space that travels around a star, like Earth goes around the Sun. It does not make its own light.', points: ['large round object in space', 'orbits a star', 'does not make its own light'] },
    { type: 'short', q: 'Why do we have day and night?', a: 'Because Earth spins on its axis. The side facing the Sun has day, and the side facing away has night.', points: ['Earth spins (rotates)', 'side facing the Sun has day', 'side away from the Sun has night'] },
  ],
};

const FALLBACK_ES: PracticeTest = {
  items: [
    { type: 'mc', q: '¿Qué planeta está más cerca del Sol?', choices: ['Mercurio', 'Venus', 'Tierra', 'Marte'], a: 0 },
    { type: 'mc', q: '¿Qué es el Sol?', choices: ['Un planeta', 'Una estrella', 'Una luna', 'Un cometa'], a: 1 },
    { type: 'mc', q: '¿Cuál es el planeta más grande?', choices: ['Saturno', 'Júpiter', 'Neptuno', 'Tierra'], a: 1 },
    { type: 'tf', s: 'La Luna produce su propia luz.', a: false, fix: 'La Luna refleja la luz del Sol.' },
    { type: 'tf', s: 'La Tierra gira alrededor del Sol.', a: true },
    { type: 'tf', s: 'A Marte lo llaman el Planeta Azul.', a: false, fix: 'A Marte lo llaman el Planeta Rojo.' },
    { type: 'fill', s: 'El camino que sigue un planeta alrededor del Sol se llama ___.', a: 'órbita' },
    { type: 'fill', s: 'La Tierra tarda un ___ en dar la vuelta al Sol.', a: 'año' },
    { type: 'short', q: '¿Qué es un planeta?', a: 'Un planeta es un objeto grande y redondo en el espacio que gira alrededor de una estrella, como la Tierra alrededor del Sol. No produce su propia luz.', points: ['objeto grande y redondo en el espacio', 'gira alrededor de una estrella', 'no produce su propia luz'] },
    { type: 'short', q: '¿Por qué hay día y noche?', a: 'Porque la Tierra gira sobre su eje. El lado que mira al Sol tiene día y el lado contrario tiene noche.', points: ['la Tierra gira (rota)', 'el lado que mira al Sol tiene día', 'el lado contrario tiene noche'] },
  ],
};

const PART_COPY: Record<PracticeItemType, { en: [string, string]; es: [string, string] }> = {
  mc: { en: ['Multiple choice', 'Pick the right answer.'], es: ['Opción múltiple', 'Elige la respuesta correcta.'] },
  tf: { en: ['True or false', 'Is it true or false?'], es: ['Verdadero o falso', '¿Es verdadero o falso?'] },
  fill: { en: ['Complete the sentence', 'Write the missing word.'], es: ['Completa la oración', 'Escribe la palabra que falta.'] },
  short: { en: ['Answer in your own words', 'Write a complete answer. The more you explain, the better.'], es: ['Responde con tus palabras', 'Escribe una respuesta completa. Mientras más expliques, mejor.'] },
};

const VERDICT = {
  correct: { en: 'Correct', es: 'Correcto', bg: 'var(--primary-l)', fg: 'var(--primary-d)', mark: '✓' },
  partial: { en: 'Almost', es: 'Casi', bg: 'var(--honey-l)', fg: '#7C5410', mark: '½' },
  wrong: { en: 'Not yet', es: 'Todavía no', bg: 'var(--coral-l)', fg: 'var(--coral)', mark: '✗' },
};

const draftKey = (k: string) => `qk-practice-draft:${k}`;
const starsFor = (pct: number) => (pct >= 90 ? 5 : pct >= 75 ? 4 : pct >= 60 ? 3 : pct >= 40 ? 2 : 1);

/** Practice test the kid fills in on screen. Choices are checked right away; written answers are read by the AI. */
export default function PracticeClient() {
  const { lang, kids, activeKidId, studyParams, gamification, isDemo, updateKid, customSubjects, setMode } = useStore();
  const t = useT(lang);
  const L = (en: string, es: string) => (lang === 'es' ? es : en);
  const router = useRouter();
  const kid = kids.find((k) => k.id === activeKidId) || kids[0];
  const contentLang = studyParams.contentLang ?? lang;
  const ks = kid?.subjects?.find((s) => s.subject === studyParams.subject);
  const info = subjectInfo(studyParams.subject, lang, customSubjects, ks);
  const backTo = studyParams.returnTo || '/kids/home';

  const [test, setTest] = React.useState<PracticeTest | null>(null);
  const [sample, setSample] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [round, setRound] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<number, PracticeAnswer>>({});
  const [phase, setPhase] = React.useState<'answering' | 'grading' | 'done'>('answering');
  const [graded, setGraded] = React.useState<GradedAnswer[]>([]);
  const [exam, setExam] = React.useState<KidTest | null>(null);
  const contentIdRef = React.useRef<string | undefined>(undefined);
  const keyRef = React.useRef('');
  const topRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => { setMode('kid'); }, []);

  // The school test this practice belongs to (only when it really is that test's practice)
  React.useEffect(() => {
    if (!kid || !studyParams.testId) { setExam(null); return; }
    loadTest(kid, studyParams.testId, isDemo)
      .then((x) => setExam(x && x.title === studyParams.topic ? x : null))
      .catch(() => setExam(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kid?.id, studyParams.testId, studyParams.topic, isDemo]);

  React.useEffect(() => {
    let cancelled = false;
    const previous = round > 0 && test ? test.items.map((x) => (x.type === 'tf' || x.type === 'fill' ? x.s : x.q)) : [];
    const show = (p: PracticeTest, contentId: string | undefined, isSample = false) => {
      if (cancelled) return;
      const topics = studyParams.topics?.length ? studyParams.topics : [studyParams.topic];
      // Sample questions have no topics; spread them over the test's topics so the per-topic view still works
      setTest(isSample ? { items: p.items.map((it, i) => ({ ...it, topic: topics[i % topics.length] })) } : p);
      setSample(isSample);
      contentIdRef.current = contentId;
      keyRef.current = draftKey(contentId || `${studyParams.subject}:${studyParams.topic}:${round}`);
      let saved: Record<number, PracticeAnswer> = {};
      try { saved = JSON.parse(localStorage.getItem(keyRef.current) || '{}'); } catch { /* no saved draft */ }
      setAnswers(saved && typeof saved === 'object' ? saved : {});
      setGraded([]);
      setPhase('answering');
      setLoading(false);
    };
    (async () => {
      setLoading(true);
      if (studyParams.contentId && !isDemo && round === 0) {
        try {
          const { data } = await createClient().from('generated_content').select('content, lang').eq('id', studyParams.contentId).single();
          const p = data && (data.lang || 'en') === contentLang ? toPractice(data.content) : null;
          if (p) { show(p, studyParams.contentId); return; }
        } catch (e) {
          console.warn('Could not load saved practice test:', e);
        }
      }
      try {
        const res = await fetch('/api/generate/practice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: studyParams.topic, grade: studyParams.grade, lang: contentLang, subject: studyParams.subject, source: studyParams.source,
            ...(studyParams.topics ? { topics: studyParams.topics } : {}),
            ...(studyParams.memory?.length ? { context: { memory: studyParams.memory } } : {}),
            ...(studyParams.testId ? { variant: 'test' } : {}),
            ...(previous.length ? { variant: 'more', exclude: previous } : {}),
          }),
        });
        const data = res.ok ? await res.json() : null;
        const p = data ? toPractice(data) : null;
        if (p) {
          show(p, data.contentId ?? undefined);
          return;
        }
      } catch (e) {
        console.warn('Could not make practice test:', e);
      }
      show(lang === 'es' ? FALLBACK_ES : FALLBACK_EN, undefined, true);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyParams.topic, studyParams.grade, studyParams.contentId, contentLang, round]);

  // Remember the first practice test made for a school test, so it opens the same questions next time
  React.useEffect(() => {
    if (!kid || !exam || exam.practiceContentId || round > 0 || !contentIdRef.current) return;
    const id = contentIdRef.current;
    void updateTest(kid.id, exam, { practiceContentId: id }, isDemo).then((saved) => { if (saved) setExam(saved); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam?.id, test]);

  if (!kid) return null;

  const setAnswer = (i: number, v: PracticeAnswer) => {
    setAnswers((a) => {
      const next = { ...a, [i]: v };
      try { localStorage.setItem(keyRef.current, JSON.stringify(next)); } catch { /* storage unavailable */ }
      return next;
    });
  };

  const items = test?.items || [];
  const done = items.filter((it, i) => answered(it, answers[i])).length;

  const submit = async () => {
    if (!test) return;
    const blank = items.length - done;
    if (blank > 0 && !window.confirm(L(`You left ${blank} question${blank === 1 ? '' : 's'} blank. Hand in your test anyway?`, `Dejaste ${blank} pregunta${blank === 1 ? '' : 's'} sin responder. ¿Entregar el examen de todos modos?`))) return;
    setPhase('grading');
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const result: (GradedAnswer | null)[] = items.map((it, i) => gradeLocally(it, answers[i]));
    const toAI = result.map((g, i) => (g ? -1 : i)).filter((i) => i >= 0);
    const ask = toAI.map((i) => {
      const it = items[i] as Extract<PracticeItem, { type: 'fill' | 'short' }>;
      return { kind: it.type === 'fill' ? 'fill' as const : 'short' as const, q: it.type === 'fill' ? it.s : it.q, expected: it.a, points: it.type === 'short' ? it.points : [], answer: String(answers[i] || '') };
    });
    if (ask.length) {
      let fromAI: GradedAnswer[] | null = null;
      try {
        const res = await fetch('/api/grade', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: ask, grade: studyParams.grade, lang: contentLang, subject: info.label }) });
        if (res.ok) fromAI = ((await res.json()) as { results?: GradedAnswer[] }).results ?? null;
      } catch (e) {
        console.warn('Could not grade answers:', e);
      }
      toAI.forEach((i, n) => { result[i] = fromAI?.[n] ?? fallbackGrade(ask[n].expected, ask[n].points, ask[n].answer, contentLang, ask[n].kind); });
    }
    const final = result as GradedAnswer[];
    setGraded(final);
    setPhase('done');
    try { localStorage.removeItem(keyRef.current); } catch { /* storage unavailable */ }

    // Sample questions are not about the real topics: nothing to save
    if (sample && !isDemo) return;
    const score = scorePractice(items, final);
    const stars = starsFor(score.pct);
    updateKid(kid.id, { stars: (kid.stars || 0) + stars, lastSubject: studyParams.subject });
    if (exam) {
      const saved = await updateTest(kid.id, exam, { practice: practiceStats(exam.practice, items, final) }, isDemo);
      if (saved) {
        setExam(saved);
        if (isDemo) updateKid(kid.id, { tests: (useStore.getState().kids.find((k) => k.id === kid.id)?.tests || []).map((x) => (x.id === saved.id ? saved : x)) });
      }
    }
    if (!isDemo) {
      const supabase = createClient();
      // Saved like a quiz under the same topic (difficulty 'test' tells it apart from the flashcards)
      supabase.from('quiz_results').insert({
        kid_id: kid.id, subject: studyParams.subject, topic: studyParams.topic, grade: studyParams.grade,
        difficulty: 'test', total: score.max, correct: Math.round(score.points), stars, lang: contentLang,
      }).then(({ error }) => { if (error) console.warn('Could not save practice result:', error); });
      supabase.from('kids').update({ stars: (kid.stars || 0) + stars, last_subject: studyParams.subject }).eq('id', kid.id).then(() => {});
    }
  };

  const retry = () => {
    setAnswers({});
    setGraded([]);
    setPhase('answering');
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) return (
    <AppShell>
      <div className="qk-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
        <LoadingBar expectedMs={20000} style={{ width: 'min(280px, 100%)' }} />
        <div style={{ fontSize: 16, color: 'var(--ink-3)', fontFamily: 'var(--font-display)', textAlign: 'center' }}>{L('Writing your practice test…', 'Escribiendo tu examen de práctica…')}</div>
      </div>
    </AppShell>
  );

  const score = phase === 'done' ? scorePractice(items, graded) : null;
  const parts = PRACTICE_ORDER.map((type) => ({ type, idx: items.map((it, i) => (it.type === type ? i : -1)).filter((i) => i >= 0) })).filter((p) => p.idx.length > 0);
  const topicNames = Object.keys(score?.byTopic || {});

  return (
    <AppShell>
      <div ref={topRef} className="qk-screen qk-page-enter" style={{ padding: '14px clamp(16px, 4vw, 22px) 64px', scrollMarginTop: 80 }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <button onClick={() => router.push(backTo)} className="qk-btn qk-btn-ghost" style={{ padding: '8px 12px' }}>{ICONS.back} <span>{t('back')}</span></button>

          <div style={{ marginTop: 14 }}>
            <span className="qk-eyebrow">{info.icon} {info.label} · {L('Practice test', 'Examen de práctica')}</span>
            <h1 className="qk-h1" style={{ margin: '6px 0 0', fontSize: 'clamp(24px, 4vw, 34px)', overflowWrap: 'anywhere' }}>{studyParams.topic}</h1>
          </div>

          {sample && <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 12, background: 'var(--honey-l)', color: '#7C5410', fontWeight: 600, fontSize: 13 }}>{isDemo ? L('Demo: these are sample questions.', 'Demo: estas son preguntas de ejemplo.') : L("These are sample questions: we couldn't write your test right now.", 'Estas son preguntas de ejemplo: no pudimos escribir tu examen ahora.')}</div>}

          {/* answering: progress */}
          {phase === 'answering' && (
            <div style={{ position: 'sticky', top: 72, zIndex: 5, marginTop: 16, padding: '10px 14px', borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="qk-progress" style={{ flex: 1 }}><span style={{ width: (items.length ? (done / items.length) * 100 : 0) + '%' }} /></div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>{done}/{items.length} {L('answered', 'respondidas')}</span>
            </div>
          )}

          {phase === 'grading' && (
            <div className="qk-card" style={{ marginTop: 18, padding: 24, display: 'grid', gap: 14, justifyItems: 'center', textAlign: 'center' }}>
              <div style={{ fontSize: 40 }}>🧑‍🏫</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 19 }}>{L('Checking your answers…', 'Revisando tus respuestas…')}</div>
              <LoadingBar expectedMs={9000} style={{ width: 'min(280px, 100%)' }} />
            </div>
          )}

          {/* results */}
          {phase === 'done' && score && (
            <div className="qk-card qk-slide-up" style={{ marginTop: 18, padding: 'clamp(18px, 4vw, 28px)', display: 'grid', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
                <div style={{ width: 96, height: 96, borderRadius: '50%', display: 'grid', placeItems: 'center', background: `conic-gradient(${score.pct >= PRACTICE_PASS ? 'var(--primary)' : 'var(--coral)'} ${score.pct * 3.6}deg, var(--surface-2) 0)`, flexShrink: 0 }}>
                  <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'var(--surface)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24 }}>{score.pct}%</div>
                </div>
                <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22 }}>
                    {score.pct >= 90 ? L('You’re ready! 🌟', '¡Estás listo! 🌟') : score.pct >= PRACTICE_PASS ? L('Great work! 👏', '¡Muy bien! 👏') : score.pct >= 50 ? L('Getting there! 💪', '¡Vas bien! 💪') : L('Let’s keep practicing 📚', 'Sigamos practicando 📚')}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 4 }}>
                    {Number.isInteger(score.points) ? score.points : score.points.toFixed(1)}/{score.max} {L('points', 'puntos')} · {L('Written answers are worth 2 points.', 'Las respuestas escritas valen 2 puntos.')}
                  </div>
                  {exam && <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>🧠 {L(`Saved to "${exam.title}". Best so far: ${exam.practice?.best ?? score.pct}%`, `Guardado en "${exam.title}". Mejor hasta ahora: ${exam.practice?.best ?? score.pct}%`)}</div>}
                </div>
              </div>

              {topicNames.length > 1 && (
                <div style={{ display: 'grid', gap: 8 }}>
                  {topicNames.map((name) => {
                    const pct = score.byTopic[name];
                    return (
                      <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: '1 1 140px', minWidth: 0, fontSize: 13, fontWeight: 600, overflowWrap: 'anywhere' }}>{name}</div>
                        <div className="qk-progress" style={{ flex: '2 1 120px' }}><span style={{ width: pct + '%', background: pct < PRACTICE_PASS ? 'var(--coral)' : undefined }} /></div>
                        <span style={{ width: 42, textAlign: 'right', fontSize: 13, fontWeight: 700, color: pct < PRACTICE_PASS ? 'var(--coral)' : 'var(--primary-d)' }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Btn kind="primary" icon={ICONS.shuffle} onClick={() => setRound((r) => r + 1)}>{L('New questions', 'Preguntas nuevas')}</Btn>
                <Btn kind="ghost" icon={ICONS.pencil} onClick={retry}>{L('Try the same test again', 'Repetir el mismo examen')}</Btn>
                <Btn kind="ghost" icon={ICONS.back} onClick={() => router.push(backTo)}>{studyParams.testId ? L('Back to my test', 'Volver a mi examen') : t('back')}</Btn>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                {gamification !== 'minimal' && !(sample && !isDemo) ? `+${starsFor(score.pct)} ⭐ · ` : ''}
                {L('Scroll down to see what to fix in each answer.', 'Baja para ver qué corregir en cada respuesta.')}
              </div>
            </div>
          )}

          {/* the test */}
          {phase !== 'grading' && parts.map((part, pi) => {
            const copy = PART_COPY[part.type][lang === 'es' ? 'es' : 'en'];
            return (
              <section key={part.type} style={{ marginTop: 26 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px 10px', marginBottom: 12 }}>
                  <span style={{ border: '1.5px solid var(--ink)', borderRadius: 999, padding: '1px 10px', fontSize: 12, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>{L('Part', 'Parte')} {pi + 1}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20 }}>{copy[0]}</span>
                  <span style={{ fontSize: 14, color: 'var(--ink-3)', flexBasis: '100%' }}>{copy[1]}</span>
                </div>
                <div style={{ display: 'grid', gap: 12 }}>
                  {part.idx.map((i) => (
                    <Question key={`${round}-${i}`} n={i + 1} item={items[i]} answer={answers[i]} onAnswer={(v) => setAnswer(i, v)} graded={phase === 'done' ? graded[i] : undefined} lang={lang} />
                  ))}
                </div>
              </section>
            );
          })}

          {phase === 'answering' && items.length > 0 && (
            <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <Btn kind="primary" icon={ICONS.check} onClick={submit} style={{ fontSize: 17, padding: '14px 26px' }}>{L('Hand in my test', 'Entregar mi examen')}</Btn>
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{L('Your answers are saved on this device until you hand it in.', 'Tus respuestas se guardan en este equipo hasta que lo entregues.')}</span>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Question({ n, item, answer, onAnswer, graded, lang }: { n: number; item: PracticeItem; answer: PracticeAnswer; onAnswer: (v: PracticeAnswer) => void; graded?: GradedAnswer; lang: string }) {
  const L = (en: string, es: string) => (lang === 'es' ? es : en);
  const locked = !!graded;
  const v = graded ? VERDICT[graded.verdict] : null;
  const choice = (on: boolean, right: boolean | null): React.CSSProperties => ({
    appearance: 'none', textAlign: 'left', font: 'inherit', fontSize: 15, padding: '10px 14px', borderRadius: 12, cursor: locked ? 'default' : 'pointer',
    border: '1.5px solid ' + (right === true ? 'var(--primary)' : right === false && on ? 'var(--coral)' : on ? 'var(--ink)' : 'var(--line)'),
    background: right === true ? 'var(--primary-l)' : right === false && on ? 'var(--coral-l)' : on ? 'var(--surface-2)' : 'var(--surface)',
    color: 'var(--ink)', fontWeight: on ? 700 : 500, display: 'flex', alignItems: 'center', gap: 10,
  });

  return (
    <div className="qk-card" style={{ padding: 16, display: 'grid', gap: 12, borderColor: v ? v.fg : undefined }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink-3)', minWidth: 24 }}>{n}.</span>
        <div style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 600, lineHeight: 1.4 }}>
          {item.type === 'fill' ? (
            <span>
              {item.s.split('___')[0]}
              <input aria-label={L('Missing word', 'Palabra que falta')} className="qk-input" value={typeof answer === 'string' ? answer : ''} disabled={locked} onChange={(e) => onAnswer(e.target.value)}
                style={{ display: 'inline-block', width: 'min(180px, 60%)', padding: '4px 10px', margin: '2px 6px', fontSize: 15, verticalAlign: 'baseline' }} />
              {item.s.split('___')[1]}
            </span>
          ) : item.type === 'tf' ? item.s : item.q}
        </div>
        {v && <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: v.bg, color: v.fg, flexShrink: 0 }}>{v.mark} {lang === 'es' ? v.es : v.en}</span>}
        {item.type === 'short' && !v && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', flexShrink: 0 }}>{itemPoints(item)} {L('pts', 'pts')}</span>}
      </div>

      {item.type === 'mc' && (
        <div style={{ display: 'grid', gap: 8 }}>
          {item.choices.map((c, ci) => (
            <button key={ci} type="button" disabled={locked} aria-pressed={answer === ci} onClick={() => onAnswer(ci)} style={choice(answer === ci, locked ? (ci === item.a ? true : false) : null)}>
              <span style={{ width: 24, height: 24, borderRadius: '50%', border: '1.5px solid currentColor', display: 'grid', placeItems: 'center', fontSize: 12, flexShrink: 0 }}>{'ABCD'[ci]}</span>{c}
            </button>
          ))}
        </div>
      )}

      {item.type === 'tf' && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[true, false].map((b) => (
            <button key={String(b)} type="button" disabled={locked} aria-pressed={answer === b} onClick={() => onAnswer(b)} style={{ ...choice(answer === b, locked ? b === item.a : null), flex: '1 1 120px', justifyContent: 'center' }}>
              {b ? L('True', 'Verdadero') : L('False', 'Falso')}
            </button>
          ))}
        </div>
      )}

      {item.type === 'short' && (
        <textarea className="qk-input" rows={3} value={typeof answer === 'string' ? answer : ''} disabled={locked} onChange={(e) => onAnswer(e.target.value)}
          placeholder={L('Write your answer…', 'Escribe tu respuesta…')} style={{ fontSize: 15, lineHeight: 1.5, resize: 'vertical', minHeight: 84, fontFamily: 'inherit' }} />
      )}

      {graded && (
        <div style={{ display: 'grid', gap: 6, fontSize: 14 }}>
          {graded.feedback && <div style={{ color: 'var(--ink-2)' }}>💬 {graded.feedback}</div>}
          {graded.verdict !== 'correct' && item.type === 'tf' && <div style={{ color: 'var(--ink-2)' }}>{L('Answer', 'Respuesta')}: <strong>{item.a ? L('True', 'Verdadero') : L('False', 'Falso')}</strong>{item.fix ? ` · ${item.fix}` : ''}</div>}
          {graded.verdict !== 'correct' && item.type === 'fill' && <div style={{ color: 'var(--ink-2)' }}>{L('Answer', 'Respuesta')}: <strong>{item.a}</strong></div>}
          {item.type === 'short' && (
            <div style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--surface-2)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{L('A complete answer', 'Una respuesta completa')}</div>
              <div style={{ color: 'var(--ink)' }}>{item.a}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
