'use client';
import React from 'react';
import { Btn } from '@/components/ui/Btn';
import { ICONS } from '@/components/ui/Icons';
import { Feedback, GameHeader, RetryPill, useRound } from '@/components/games/GameBits';
import { ListenButtons, spoken, type WordPlayed } from '@/components/words/WordBits';
import { useSpeech } from '@/lib/speech';
import { maskedHint, spellTips, type PickItem } from '@/lib/words';

/** "Which one is spelled right?": the word is read aloud, the kid taps the right spelling among look-alikes */
export default function PickGame({ items, lang, wordLang, minimal, label, onFinish }: {
  items: PickItem[];
  lang: string;
  wordLang: string;
  minimal: boolean;
  label?: string;
  onFinish: (played: WordPlayed<PickItem>[], stars: number, bestStreak: number) => void;
}) {
  const L = (en: string, es: string) => (lang === 'es' ? es : en);
  const answers = React.useRef<Record<number, string>>({});
  const round = useRound(items, (played, stars, best) => onFinish(played.map((p, i) => ({ ...p, answer: answers.current[i] })), stars, best));
  const { turn } = round;
  const speech = useSpeech(wordLang);
  const [pick, setPick] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (turn && speech.state === 'ready') speech.say(spoken(turn.item));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round.pos, speech.state]);

  const choose = (i: number) => {
    if (!turn || pick !== null) return;
    setPick(i);
    if (!turn.retry) answers.current[turn.id] = turn.item.choices[i];
    round.record(turn.item.choices[i] === turn.item.w);
  };
  const next = () => { setPick(null); round.advance(); };

  // 1-4 pick, Enter moves on
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || !turn || (e.key === 'Enter' && (e.target as HTMLElement | null)?.tagName === 'BUTTON')) return;
      const n = Number(e.key);
      if (pick === null && n >= 1 && n <= turn.item.choices.length) choose(n - 1);
      else if (e.key === 'Enter' && pick !== null) { e.preventDefault(); next(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!turn) return null;
  const { item } = turn;
  const checked = pick !== null;
  const chosen = checked ? item.choices[pick] : null;
  const ok = chosen === item.w;
  const hint = maskedHint(item);
  const long = /\s/.test(item.w);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 18 }}>
      <GameHeader pos={round.pos} total={round.total} stars={round.stars} streak={round.streak} minimal={minimal} lang={lang} label={label} />

      <div key={round.pos} className={checked && !ok ? 'qk-card qk-shake' : 'qk-card qk-bounce-in'}
        style={{ padding: 'clamp(18px, 4vw, 28px)', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 14, justifyItems: 'center', borderColor: checked ? (ok ? 'var(--primary)' : 'var(--coral)') : 'var(--line)', boxShadow: checked ? `0 0 0 6px ${ok ? 'var(--primary-l)' : 'var(--coral-l)'}, var(--shadow)` : 'var(--shadow)', transition: 'box-shadow .25s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, width: '100%' }}>
          <span className="qk-eyebrow">{L('Which one is spelled right?', '¿Cuál está bien escrita?')}</span>
          {turn.retry && <RetryPill lang={lang} />}
        </div>
        {speech.state === 'ready' && <ListenButtons lang={lang} onSay={(slow) => speech.say(spoken(item), slow)} />}
        {hint && <div style={{ textAlign: 'center', fontSize: 15, color: 'var(--ink-2)', fontStyle: 'italic' }}>“{hint}”</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: long ? 'minmax(0, 1fr)' : 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 10 }}>
        {item.choices.map((c, ci) => {
          const isAnswer = checked && c === item.w;
          const isWrong = checked && pick === ci && c !== item.w;
          return (
            <button key={ci} type="button" disabled={checked} onClick={() => choose(ci)} className={checked ? undefined : 'qk-wiggle'}
              style={{
                appearance: 'none', font: 'inherit', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: long ? 17 : 'clamp(20px, 3vw, 24px)', padding: long ? '12px 14px' : '16px 12px', borderRadius: 16,
                textAlign: long ? 'left' : 'center', cursor: checked ? 'default' : 'pointer', overflowWrap: 'break-word', minWidth: 0, letterSpacing: long ? 0 : '.02em',
                border: '2.5px solid ' + (isAnswer ? 'var(--primary)' : isWrong ? 'var(--coral)' : 'var(--line)'),
                background: isAnswer ? 'var(--primary-l)' : isWrong ? 'var(--coral-l)' : 'var(--surface)', color: 'var(--ink)',
                boxShadow: isAnswer || isWrong ? 'none' : '0 3px 0 var(--line)', opacity: checked && !isAnswer && !isWrong ? 0.45 : 1, transition: 'all .12s ease',
              }}>
              <span style={{ opacity: 0.4, fontSize: 12, marginRight: 8, fontFamily: 'var(--font-body, inherit)' }}>{ci + 1}</span>{c}
            </button>
          );
        })}
      </div>

      {checked && (
        <Feedback ok={ok} lang={lang}>
          {!ok && (
            <div style={{ display: 'grid', gap: 4 }}>
              <span>{L("It's spelled", 'Se escribe')} <strong style={{ fontSize: 17 }}>{item.w}</strong>.</span>
              {chosen && spellTips(item.w, chosen, lang).map((t) => <span key={t}>💡 {t}</span>)}
            </div>
          )}
        </Feedback>
      )}
      {checked && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Btn kind="primary" iconRight={ICONS.next} onClick={next}>{round.pos + 1 >= round.total ? L('See results', 'Ver resultados') : L('Next word', 'Siguiente')}</Btn>
        </div>
      )}
    </div>
  );
}
