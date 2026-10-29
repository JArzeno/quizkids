'use client';
import React from 'react';
import { ICONS } from '@/components/ui/Icons';

export interface Turn<T> {
  item: T;
  /** Index in the original list */
  id: number;
  /** A card the kid missed, shown once more at the end */
  retry: boolean;
}

export interface Played<T> {
  item: T;
  /** Right on the first try */
  ok: boolean;
}

/**
 * The cards of a round, in order. A card missed on the first try comes back once at the end, so the kid gets to
 * answer it right. Stars and the score only count first tries.
 */
export function useRound<T>(items: T[], onFinish: (played: Played<T>[], stars: number, bestStreak: number) => void) {
  const [queue, setQueue] = React.useState<Turn<T>[]>(() => items.map((item, id) => ({ item, id, retry: false })));
  const [pos, setPos] = React.useState(0);
  const [first, setFirst] = React.useState<Record<number, boolean>>({});
  const [stars, setStars] = React.useState(0);
  const [streak, setStreak] = React.useState(0);
  const [best, setBest] = React.useState(0);
  const turn: Turn<T> | undefined = queue[pos];
  const finished = pos >= queue.length;
  const sent = React.useRef(false);

  /** Records the answer to the current card */
  const record = (ok: boolean) => {
    if (!turn) return;
    if (!turn.retry) {
      setFirst((f) => ({ ...f, [turn.id]: ok }));
      if (ok) setStars((s) => s + 1);
      else setQueue((q) => [...q, { ...turn, retry: true }]);
    }
    const next = ok ? streak + 1 : 0;
    setStreak(next);
    setBest((b) => Math.max(b, next));
  };

  /** Moves on to the next card */
  const advance = () => setPos((p) => p + 1);

  React.useEffect(() => {
    if (!finished || sent.current) return;
    sent.current = true;
    onFinish(items.map((item, id) => ({ item, ok: first[id] === true })), stars, best);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  return { turn, pos, total: queue.length, stars, streak, record, advance, finished };
}

/** Progress bar with the stars and streak of the round */
export function GameHeader({ pos, total, stars, streak, minimal, lang, label }: { pos: number; total: number; stars: number; streak: number; minimal: boolean; lang: string; label?: string }) {
  const es = lang === 'es';
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 700, whiteSpace: 'nowrap' }}>{es ? 'Tarjeta' : 'Card'} {Math.min(pos + 1, total)} / {total}</div>
        {label && <div style={{ fontSize: 13, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1, textAlign: 'right' }}>{label}</div>}
        {!minimal && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div title={es ? 'Estrellas' : 'Stars'} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: 'var(--honey-l)', color: '#7C5410', fontWeight: 700 }}>{ICONS.star} <span key={stars} className="qk-num-tick">{stars}</span></div>
            <div title={es ? 'Racha' : 'Streak'} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: 'var(--coral-l)', color: '#7C2A19', fontWeight: 700 }}>{ICONS.flame} <span key={streak} className="qk-num-tick">{streak}</span></div>
          </div>
        )}
      </div>
      <div className="qk-progress"><span style={{ width: `${total ? (pos / total) * 100 : 0}%` }} /></div>
    </div>
  );
}

/** Banner under a card after an answer: right or wrong, with what the answer was */
export function Feedback({ ok, children, lang }: { ok: boolean; children?: React.ReactNode; lang: string }) {
  const es = lang === 'es';
  return (
    <div className="qk-bounce-in" role="status" style={{ padding: '12px 16px', borderRadius: 16, background: ok ? 'var(--primary-l)' : 'var(--coral-l)', color: ok ? 'var(--primary-d)' : '#7C2A19', display: 'grid', gap: 4 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>{ok ? (es ? '✨ ¡Bien!' : '✨ Nice!') : (es ? '💭 ¡Casi!' : '💭 Not quite')}</div>
      {children && <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{children}</div>}
    </div>
  );
}

/** Small pill that marks a card shown again after a miss */
export function RetryPill({ lang }: { lang: string }) {
  return <span style={{ padding: '2px 10px', borderRadius: 999, background: 'var(--honey-l)', color: '#7C5410', fontSize: 11, fontWeight: 700 }}>↻ {lang === 'es' ? 'Otra vez' : 'Try again'}</span>;
}
