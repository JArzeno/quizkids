'use client';
import React from 'react';
import type { DiffToken, WordEntry } from '@/lib/words';

export interface WordPlayed<T extends WordEntry = WordEntry> {
  item: T;
  /** Right on the first try */
  ok: boolean;
  /** What the kid wrote (or picked) on the first try */
  answer?: string;
}

/** What a word is read aloud as: the word, its sentence, the word again (like a teacher's dictation) */
export const spoken = (e: WordEntry) => (e.hint ? `${e.w}. ${e.hint}. ${e.w}.` : e.w);

/** "Listen" and "slower" buttons */
export function ListenButtons({ lang, onSay, big }: { lang: string; onSay: (slow: boolean) => void; big?: boolean }) {
  const es = lang === 'es';
  const base: React.CSSProperties = { appearance: 'none', font: 'inherit', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, transition: 'transform .12s ease' };
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
      <button type="button" onClick={() => onSay(false)} className="qk-wiggle"
        style={{ ...base, padding: big ? '14px 26px' : '9px 16px', fontSize: big ? 20 : 15, border: '2.5px solid var(--berry)', background: 'var(--berry-l)', color: 'var(--ink)', boxShadow: '0 3px 0 color-mix(in srgb, var(--berry) 45%, transparent)' }}>
        <span aria-hidden style={{ fontSize: big ? 26 : 18 }}>🔊</span>{es ? 'Escuchar' : 'Listen'}
      </button>
      <button type="button" onClick={() => onSay(true)}
        style={{ ...base, padding: big ? '14px 20px' : '9px 14px', fontSize: big ? 17 : 14, border: '2px solid var(--line)', background: 'var(--surface)', color: 'var(--ink-2)' }}>
        <span aria-hidden style={{ fontSize: big ? 22 : 16 }}>🐢</span>{es ? 'Más lento' : 'Slower'}
      </button>
    </div>
  );
}

/** A spelling with the letters (or words) that are off marked */
export function DiffLine({ tokens, sep, tone }: { tokens: DiffToken[]; sep: string; tone: 'right' | 'wrong' }) {
  return (
    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: sep ? 0 : '.04em', overflowWrap: 'anywhere' }}>
      {tokens.map((x, i) => (
        <React.Fragment key={i}>
          {i > 0 && sep}
          <span style={x.ok ? undefined : tone === 'right'
            ? { background: 'var(--primary)', color: '#fff', borderRadius: 5, padding: '0 2px' }
            : { color: '#B23A22', textDecoration: 'line-through', textDecorationThickness: 2 }}>{x.t}</span>
        </React.Fragment>
      ))}
    </span>
  );
}
