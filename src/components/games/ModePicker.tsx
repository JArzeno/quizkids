'use client';
import React from 'react';
import { GAME_MODES, type GameMode } from '@/lib/games';

/** "How do you want to learn?": one big tile per way to learn. With `selected` it works as a choice, without it each tile opens its game. */
export default function ModePicker({ lang, selected, onPick }: { lang: string; selected?: GameMode | null; onPick: (mode: GameMode) => void }) {
  return (
    <div className="qk-stagger" role="radiogroup" aria-label={lang === 'es' ? '¿Cómo quieres aprender?' : 'How do you want to learn?'}
      style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: 14 }}>
      {GAME_MODES.map((m) => {
        const copy = lang === 'es' ? m.es : m.en;
        const on = selected === m.id;
        return (
          <button key={m.id} type="button" role="radio" aria-checked={on} onClick={() => onPick(m.id)} className="qk-card qk-wiggle"
            style={{ appearance: 'none', font: 'inherit', color: 'inherit', textAlign: 'left', cursor: 'pointer', padding: 16, display: 'flex', alignItems: 'center', gap: 14, minWidth: 0,
              border: '2.5px solid ' + (on ? `var(--${m.tone})` : 'var(--line)'), background: on ? `var(--${m.tone}-l)` : undefined }}>
            <span aria-hidden style={{ width: 56, height: 56, borderRadius: 18, background: `var(--${m.tone}-l)`, display: 'grid', placeItems: 'center', fontSize: 30, flexShrink: 0, boxShadow: `inset 0 -3px 0 color-mix(in srgb, var(--${m.tone}) 35%, transparent)` }}>{m.emoji}</span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, lineHeight: 1.2 }}>{copy.title}</span>
              <span style={{ display: 'block', marginTop: 3, fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.3 }}>{copy.sub}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
