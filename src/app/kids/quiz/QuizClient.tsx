'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Ico, ICONS } from '@/components/ui/Icons';
import { Avatar } from '@/components/ui/Avatar';
import { Btn } from '@/components/ui/Btn';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import type { QuizQuestion } from '@/types';

const FALLBACK_QUIZ: QuizQuestion[] = [
  { q: 'How many planets are in our solar system?', choices: ['6', '7', '8', '9'], a: 2, hint: "Pluto is now a 'dwarf planet'." },
  { q: 'Which planet is closest to the Sun?', choices: ['Mercury', 'Venus', 'Earth', 'Mars'], a: 0, hint: 'It is also the smallest.' },
  { q: 'Which is the largest planet?', choices: ['Saturn', 'Jupiter', 'Neptune', 'Earth'], a: 1, hint: 'It has a giant red spot.' },
  { q: 'What planet do we live on?', choices: ['Mars', 'Venus', 'Earth', 'Saturn'], a: 2, hint: 'It looks blue from space.' },
  { q: "Which planet has the most famous rings?", choices: ['Uranus', 'Saturn', 'Mars', 'Mercury'], a: 1, hint: 'They are made of ice and rock.' },
  { q: "What do we call Earth's natural satellite?", choices: ['Sun', 'Star', 'Moon', 'Comet'], a: 2, hint: 'It glows at night.' },
  { q: "Which planet is known as the 'Red Planet'?", choices: ['Mercury', 'Venus', 'Mars', 'Jupiter'], a: 2, hint: 'Rust makes it red.' },
  { q: 'What is the Sun?', choices: ['A planet', 'A star', 'A moon', 'A comet'], a: 1, hint: 'It makes its own light.' },
];

export default function QuizClient() {
  const { lang, kids, activeKidId, studyParams, difficulty, gamification, setQuizResult, setMode } = useStore();
  const t = useT(lang);
  const router = useRouter();
  const kid = kids.find((k) => k.id === activeKidId) || kids[0];

  React.useEffect(() => { setMode('kid'); }, []);

  const [cards, setCards] = React.useState<QuizQuestion[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [i, setI] = React.useState(0);
  const [picks, setPicks] = React.useState<Record<number, number>>({});
  const [flipped, setFlipped] = React.useState(false);
  const [revealed, setRevealed] = React.useState<Record<number, boolean>>({});
  const [feedback, setFeedback] = React.useState<'correct' | 'wrong' | null>(null);
  const [streak, setStreak] = React.useState(0);
  const [stars, setStars] = React.useState(0);

  React.useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/generate/quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: studyParams.topic, grade: studyParams.grade, difficulty, lang }),
        });
        if (res.ok) {
          const data = await res.json();
          const limit = difficulty === 'easy' ? 6 : 8;
          setCards((data.questions || FALLBACK_QUIZ).slice(0, limit));
        } else {
          setCards(FALLBACK_QUIZ.slice(0, difficulty === 'easy' ? 6 : 8));
        }
      } catch {
        setCards(FALLBACK_QUIZ.slice(0, difficulty === 'easy' ? 6 : 8));
      }
      setLoading(false);
    };
    fetchQuiz();
  }, [studyParams.topic, studyParams.grade, difficulty, lang]);

  const cur = cards[i];
  const userPick = picks[i];

  const check = () => {
    if (userPick == null || !cur) return;
    const correct = userPick === cur.a;
    setRevealed({ ...revealed, [i]: true });
    setFeedback(correct ? 'correct' : 'wrong');
    if (correct) { setStreak((s) => s + 1); setStars((s) => s + 1); } else setStreak(0);
  };

  const next = () => {
    setFlipped(false); setFeedback(null);
    if (i + 1 >= cards.length) {
      const correct = cards.reduce((acc, c, idx) => acc + (picks[idx] === c.a ? 1 : 0), 0);
      setQuizResult({ total: cards.length, correct, picks, cards, stars });
      router.push('/kids/results');
    } else setI(i + 1);
  };

  if (loading) return (
    <AppShell>
      <div className="qk-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
        <div className="qk-progress" style={{ width: 280 }}><span style={{ width: '60%', animation: 'qk-pulse 1.2s ease infinite' }} /></div>
        <div style={{ fontSize: 16, color: 'var(--ink-3)', fontFamily: 'var(--font-display)' }}>{t('generating')}</div>
      </div>
    </AppShell>
  );

  if (!cur) return null;

  return (
    <AppShell>
      <div className="qk-screen qk-page-enter" style={{ padding: 0, minHeight: 'calc(100dvh - 65px)', display: 'flex', flexDirection: 'column' }}>
        {/* kid bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px 0', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          <button onClick={() => router.push('/kids/home')} className="qk-btn qk-btn-ghost" style={{ padding: '8px 12px' }}>{ICONS.back} <span>{t('back')}</span></button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {gamification !== 'minimal' && (
              <>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: 'var(--honey-l)', color: '#7C5410', fontWeight: 700 }}>{ICONS.star} {stars}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: 'var(--coral-l)', color: '#7C2A19', fontWeight: 700 }}>{ICONS.flame} {streak}</div>
              </>
            )}
            {kid && <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 12px 4px 4px', borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--line)' }}><Avatar id={kid.avatar} size={32} /><span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{kid.name}</span></div>}
          </div>
        </div>

        <div style={{ maxWidth: 720, margin: '24px auto 0', padding: '0 22px', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 12 }}>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 700 }}>{t('card')} {i + 1} / {cards.length}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{studyParams.topic}</div>
          </div>
          <div className="qk-progress"><span style={{ width: `${(i / cards.length) * 100}%` }} /></div>
        </div>

        <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '24px 22px' }}>
          <div style={{ width: '100%', maxWidth: 560, perspective: 1200 }}>
            <div onClick={() => setFlipped((f) => !f)} style={{ position: 'relative', transformStyle: 'preserve-3d', transition: 'transform .55s cubic-bezier(.2,.7,.2,1)', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)', cursor: 'pointer', aspectRatio: '4/5', maxHeight: 520 }}>
              {/* front */}
              <div className="qk-card" style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderColor: feedback === 'correct' ? 'var(--primary)' : feedback === 'wrong' ? 'var(--coral)' : 'var(--line)', boxShadow: feedback ? `0 0 0 6px ${feedback === 'correct' ? 'var(--primary-l)' : 'var(--coral-l)'}, var(--shadow)` : 'var(--shadow)', transition: 'box-shadow .25s ease', opacity: flipped ? 0 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="qk-eyebrow">{lang === 'es' ? 'Pregunta' : 'Question'} {i + 1}</span>
                  <span style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'ui-monospace, monospace' }}>{t('tapToFlip')} ↻</span>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 'clamp(22px, 3.4vw, 30px)', lineHeight: 1.2 }}>{cur.q}</div>
                <div style={{ display: 'grid', gap: 10 }} onClick={(e) => e.stopPropagation()}>
                  {cur.choices.map((c, ci) => {
                    const isPicked = userPick === ci;
                    const isAnswer = revealed[i] && ci === cur.a;
                    const isWrong = revealed[i] && isPicked && ci !== cur.a;
                    return (
                      <button key={ci} onClick={() => !revealed[i] && setPicks({ ...picks, [i]: ci })} style={{ appearance: 'none', textAlign: 'left', padding: '12px 14px', background: isAnswer ? 'var(--primary-l)' : isWrong ? 'var(--coral-l)' : isPicked ? 'var(--surface-2)' : 'var(--surface)', border: '2px solid ' + (isAnswer ? 'var(--primary)' : isWrong ? 'var(--coral)' : isPicked ? 'var(--ink-3)' : 'var(--line)'), borderRadius: 14, cursor: revealed[i] ? 'default' : 'pointer', fontWeight: 600, fontSize: 15, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 10, transition: 'all .15s ease' }}>
                        <span style={{ width: 24, height: 24, borderRadius: 8, background: isAnswer ? 'var(--primary)' : isWrong ? 'var(--coral)' : 'var(--surface-2)', color: (isAnswer || isWrong) ? '#fff' : 'var(--ink-3)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>{String.fromCharCode(65 + ci)}</span>
                        <span style={{ flex: 1 }}>{c}</span>
                        {isAnswer && <span style={{ color: 'var(--primary)' }}>{ICONS.check}</span>}
                        {isWrong && <span style={{ color: 'var(--coral)' }}>{ICONS.x}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* back — hint */}
              <div className="qk-card" style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 14, background: 'var(--primary-l)', borderColor: 'var(--primary)', textAlign: 'center', opacity: flipped ? 1 : 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--primary-d)', letterSpacing: '.06em', textTransform: 'uppercase', fontSize: 13 }}>{lang === 'es' ? 'Pista' : 'Hint'}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 24, lineHeight: 1.25 }}>{cur.hint}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'ui-monospace, monospace' }}>{t('tapToFlip')} ↺</div>
              </div>
            </div>

            {feedback && (
              <div className="qk-bounce-in" style={{ marginTop: 14, padding: '12px 16px', borderRadius: 14, background: feedback === 'correct' ? 'var(--primary-l)' : 'var(--coral-l)', color: feedback === 'correct' ? 'var(--primary-d)' : '#7C2A19', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <span>{feedback === 'correct' ? '✨ ' + t('correct') : '💭 ' + t('wrong')}</span>
                {feedback === 'correct' && gamification !== 'minimal' && <span>+1 ⭐</span>}
              </div>
            )}

            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <button className="qk-btn qk-btn-ghost" onClick={() => { setRevealed({ ...revealed, [i]: true }); setFeedback('wrong'); setStreak(0); }} style={{ visibility: revealed[i] ? 'hidden' : 'visible' }}>{t('skipCard')}</button>
              {!revealed[i]
                ? <Btn kind="primary" disabled={userPick == null} onClick={check} icon={ICONS.check} style={{ opacity: userPick == null ? .5 : 1 }}>{t('checkAnswer')}</Btn>
                : <Btn kind="primary" iconRight={ICONS.next} onClick={next}>{i + 1 >= cards.length ? (lang === 'es' ? 'Ver resultados' : 'See results') : t('nextCard')}</Btn>}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
