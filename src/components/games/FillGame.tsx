'use client';
import React from 'react';
import { Btn } from '@/components/ui/Btn';
import { ICONS } from '@/components/ui/Icons';
import { Feedback, GameHeader, RetryPill, useRound, type Played } from '@/components/games/GameBits';
import type { FillItem } from '@/lib/games';

/** A sentence with a blank; the kid taps the word that completes it, then checks */
export default function FillGame({ items, lang, minimal, label, onFinish }: {
  items: FillItem[];
  lang: string;
  minimal: boolean;
  label?: string;
  onFinish: (played: Played<FillItem>[], stars: number, bestStreak: number) => void;
}) {
  const L = (en: string, es: string) => (lang === 'es' ? es : en);
  const round = useRound(items, onFinish);
  const { turn } = round;
  const [pick, setPick] = React.useState<number | null>(null);
  const [checked, setChecked] = React.useState(false);

  const check = () => {
    if (!turn || pick === null || checked) return;
    setChecked(true);
    round.record(turn.item.choices[pick] === turn.item.a);
  };
  const next = () => { setPick(null); setChecked(false); round.advance(); };

  // 1-4 pick a word, Enter checks and then moves on
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // A focused button already handles Enter itself
      if (e.metaKey || e.ctrlKey || e.altKey || !turn || (e.key === 'Enter' && (e.target as HTMLElement | null)?.tagName === 'BUTTON')) return;
      const n = Number(e.key);
      if (!checked && n >= 1 && n <= turn.item.choices.length) setPick(n - 1);
      else if (e.key === 'Enter') { e.preventDefault(); if (checked) next(); else check(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!turn) return null;
  const { item } = turn;
  const [before, after] = item.s.split('___');
  const chosen = pick === null ? null : item.choices[pick];
  const ok = checked && chosen === item.a;

  const slot = (
    <button type="button" disabled={checked || pick === null} onClick={() => setPick(null)} aria-label={L('Your word', 'Tu palabra')}
      style={{
        appearance: 'none', font: 'inherit', fontWeight: 700, display: 'inline-block', minWidth: 96, margin: '0 6px', padding: '2px 14px', borderRadius: 12, textAlign: 'center', cursor: checked || pick === null ? 'default' : 'pointer',
        border: '2.5px ' + (chosen ? 'solid ' : 'dashed ') + (checked ? (ok ? 'var(--primary)' : 'var(--coral)') : chosen ? 'var(--ink)' : 'var(--ink-3)'),
        background: checked ? (ok ? 'var(--primary-l)' : 'var(--coral-l)') : chosen ? 'var(--surface-2)' : 'transparent',
        color: checked ? (ok ? 'var(--primary-d)' : '#7C2A19') : 'var(--ink)', minHeight: 44, verticalAlign: 'middle',
      }}>{chosen ?? ' '}</button>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 18 }}>
      <GameHeader pos={round.pos} total={round.total} stars={round.stars} streak={round.streak} minimal={minimal} lang={lang} label={label} />

      <div key={`${round.pos}`} className={checked && !ok ? 'qk-card qk-shake' : 'qk-card qk-bounce-in'}
        style={{ padding: 'clamp(20px, 4vw, 32px)', minHeight: 190, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 18, borderColor: checked ? (ok ? 'var(--primary)' : 'var(--coral)') : 'var(--line)', boxShadow: checked ? `0 0 0 6px ${ok ? 'var(--primary-l)' : 'var(--coral-l)'}, var(--shadow)` : 'var(--shadow)', transition: 'box-shadow .25s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span className="qk-eyebrow">{L('Fill in the blank', 'Completa la oración')}</span>
          {turn.retry && <RetryPill lang={lang} />}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 'clamp(22px, 3.6vw, 30px)', lineHeight: 1.7, overflowWrap: 'anywhere' }}>
          {before}{slot}{after}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))', gap: 10 }}>
        {item.choices.map((c, ci) => {
          const on = pick === ci;
          const isAnswer = checked && c === item.a;
          const isWrong = checked && on && c !== item.a;
          return (
            <button key={ci} type="button" disabled={checked} onClick={() => setPick(on ? null : ci)}
              style={{
                appearance: 'none', font: 'inherit', fontWeight: 700, fontSize: 17, padding: '14px 12px', borderRadius: 16, cursor: checked ? 'default' : 'pointer', overflowWrap: 'anywhere',
                border: '2.5px solid ' + (isAnswer ? 'var(--primary)' : isWrong ? 'var(--coral)' : on ? 'var(--ink)' : 'var(--line)'),
                background: isAnswer ? 'var(--primary-l)' : isWrong ? 'var(--coral-l)' : on ? 'var(--surface-2)' : 'var(--surface)',
                color: 'var(--ink)', boxShadow: on || isAnswer || isWrong ? 'none' : '0 3px 0 var(--line)', transform: on ? 'translateY(2px)' : 'none',
                opacity: checked && !isAnswer && !isWrong ? 0.45 : 1, transition: 'all .12s ease',
              }}>
              <span style={{ opacity: 0.45, fontSize: 12, marginRight: 8 }}>{ci + 1}</span>{c}
            </button>
          );
        })}
      </div>

      {checked && (
        <Feedback ok={ok} lang={lang}>
          {!ok && <span>{L('The answer is', 'La respuesta es')} <strong>{item.a}</strong>.</span>}
        </Feedback>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {!checked
          ? <Btn kind="primary" icon={ICONS.check} disabled={pick === null} onClick={check} style={{ opacity: pick === null ? 0.5 : 1 }}>{L('Check', 'Revisar')}</Btn>
          : <Btn kind="primary" iconRight={ICONS.next} onClick={next}>{round.pos + 1 >= round.total ? L('See results', 'Ver resultados') : L('Next card', 'Siguiente')}</Btn>}
      </div>
    </div>
  );
}
