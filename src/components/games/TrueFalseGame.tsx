'use client';
import React from 'react';
import { Btn } from '@/components/ui/Btn';
import { ICONS } from '@/components/ui/Icons';
import { Feedback, GameHeader, RetryPill, useRound, type Played } from '@/components/games/GameBits';
import type { TfItem } from '@/lib/games';

/** Cards with a statement; the kid decides if it is true or false */
export default function TrueFalseGame({ items, lang, minimal, label, onFinish }: {
  items: TfItem[];
  lang: string;
  minimal: boolean;
  label?: string;
  onFinish: (played: Played<TfItem>[], stars: number, bestStreak: number) => void;
}) {
  const L = (en: string, es: string) => (lang === 'es' ? es : en);
  const round = useRound(items, onFinish);
  const { turn } = round;
  const [pick, setPick] = React.useState<boolean | null>(null);

  const answer = (b: boolean) => {
    if (!turn || pick !== null) return;
    setPick(b);
    round.record(b === turn.item.a);
  };
  const next = () => { setPick(null); round.advance(); };

  // T / F pick, Enter or space moves on
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const k = e.key.toLowerCase();
      // A focused button already handles Enter and space itself
      if (e.metaKey || e.ctrlKey || e.altKey || tag === 'INPUT' || (tag === 'BUTTON' && (k === 'enter' || k === ' '))) return;
      if (pick === null && (k === 't' || k === 'v' || k === 'arrowleft')) answer(true);
      else if (pick === null && (k === 'f' || k === 'arrowright')) answer(false);
      else if (pick !== null && (k === 'enter' || k === ' ')) { e.preventDefault(); next(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!turn) return null;
  const { item } = turn;
  const ok = pick === item.a;
  const answered = pick !== null;

  const choice = (b: boolean) => {
    const isAnswer = answered && b === item.a;
    const isWrong = answered && pick === b && b !== item.a;
    const tone = b ? 'primary' : 'coral';
    return (
      <button key={String(b)} type="button" disabled={answered} onClick={() => answer(b)}
        style={{
          appearance: 'none', font: 'inherit', cursor: answered ? 'default' : 'pointer', padding: '16px 12px', borderRadius: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20,
          background: isAnswer ? 'var(--primary-l)' : isWrong ? 'var(--coral-l)' : `var(--${tone}-l)`,
          color: `var(--${tone === 'primary' ? 'primary-d' : 'coral'})`,
          border: '3px solid ' + (isAnswer ? 'var(--primary)' : isWrong ? 'var(--coral)' : 'transparent'),
          opacity: answered && !isAnswer && !isWrong ? 0.45 : 1, transition: 'all .15s ease',
        }}>
        <span style={{ fontSize: 30, lineHeight: 1 }} aria-hidden>{b ? '👍' : '👎'}</span>
        <span>{b ? L('True', 'Verdadero') : L('False', 'Falso')}</span>
      </button>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 18 }}>
      <GameHeader pos={round.pos} total={round.total} stars={round.stars} streak={round.streak} minimal={minimal} lang={lang} label={label} />

      <div key={`${round.pos}`} className={answered && !ok ? 'qk-card qk-shake' : 'qk-card qk-bounce-in'}
        style={{ padding: 'clamp(20px, 4vw, 32px)', minHeight: 210, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 18, borderColor: answered ? (ok ? 'var(--primary)' : 'var(--coral)') : 'var(--line)', boxShadow: answered ? `0 0 0 6px ${ok ? 'var(--primary-l)' : 'var(--coral-l)'}, var(--shadow)` : 'var(--shadow)', transition: 'box-shadow .25s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span className="qk-eyebrow">{L('True or false?', '¿Verdadero o falso?')}</span>
          {turn.retry && <RetryPill lang={lang} />}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 'clamp(22px, 3.6vw, 30px)', lineHeight: 1.25, overflowWrap: 'anywhere' }}>{item.s}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{[true, false].map(choice)}</div>

      {answered && (
        <>
          <Feedback ok={ok} lang={lang}>
            {!ok && <span>{L('It is', 'Es')} <strong>{item.a ? L('true', 'verdadero') : L('false', 'falso')}</strong>{item.fix ? `. ${item.fix}` : '.'}</span>}
            {ok && !item.a && item.fix && <span>{item.fix}</span>}
          </Feedback>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Btn kind="primary" iconRight={ICONS.next} onClick={next}>{round.pos + 1 >= round.total ? L('See results', 'Ver resultados') : L('Next card', 'Siguiente')}</Btn>
          </div>
        </>
      )}
      {!answered && <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-3)' }}>{L('Tip: press T for true, F for false', 'Truco: presiona V para verdadero, F para falso')}</div>}
    </div>
  );
}
