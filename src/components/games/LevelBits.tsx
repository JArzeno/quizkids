'use client';
import React from 'react';
import { Btn } from '@/components/ui/Btn';
import { Medal } from '@/components/ui/Medal';
import { LEVELS, levelFor, type Level } from '@/lib/levels';

const name = (l: Level, lang: string) => (lang === 'es' ? l.es : l.en);

/** Current level with its medal and a bar toward the next one; `from` animates the bar from an earlier star count */
export function LevelCard({ stars, from, lang, compact = false }: { stars: number; from?: number; lang: string; compact?: boolean }) {
  const L = (en: string, es: string) => (lang === 'es' ? es : en);
  const info = levelFor(stars);
  const start = from === undefined ? info.pct : (levelFor(from).level.n === info.level.n ? levelFor(from).pct : 0);
  const [pct, setPct] = React.useState(start);
  React.useEffect(() => {
    const t = setTimeout(() => setPct(info.pct), 350);
    return () => clearTimeout(t);
  }, [info.pct]);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 10 : 14, minWidth: 0 }}>
      <Medal id={info.level.medal} size={compact ? 44 : 60} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: compact ? 15 : 18 }}>{L('Level', 'Nivel')} {info.level.n} · {name(info.level, lang)}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)' }}>{info.next ? `${info.into}/${info.span} ★` : L('Max level!', '¡Nivel máximo!')}</span>
        </div>
        <div className="qk-progress" style={{ marginTop: 6 }} role="progressbar" aria-valuenow={info.pct} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${pct}%`, transition: 'width .9s cubic-bezier(.2,.8,.2,1)' }} />
        </div>
        {info.next && !compact && <div style={{ marginTop: 4, fontSize: 12, color: 'var(--ink-3)' }}>{L(`${info.next.from - info.stars} more stars for level ${info.next.n}`, `${info.next.from - info.stars} estrellas más para el nivel ${info.next.n}`)}</div>}
      </div>
    </div>
  );
}

/** All medals: the ones won in color, the rest locked with the stars they need */
export function MedalShelf({ stars, lang }: { stars: number; lang: string }) {
  const L = (en: string, es: string) => (lang === 'es' ? es : en);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))', gap: 12 }}>
      {LEVELS.map((l) => {
        const got = stars >= l.from;
        return (
          <div key={l.n} title={`${L('Level', 'Nivel')} ${l.n} · ${name(l, lang)}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textAlign: 'center', minWidth: 0, opacity: got ? 1 : 0.85 }}>
            <Medal id={l.medal} size={64} locked={!got} />
            <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.2, overflowWrap: 'anywhere' }}>{name(l, lang)}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{got ? `${L('Level', 'Nivel')} ${l.n}` : `${l.from} ★`}</div>
          </div>
        );
      })}
    </div>
  );
}

/** Full-screen celebration when a round lifts the kid to a new level, with the medal just won */
export function LevelUpModal({ levels, lang, onClose }: { levels: Level[]; lang: string; onClose: () => void }) {
  const L = (en: string, es: string) => (lang === 'es' ? es : en);
  const top = levels[levels.length - 1];
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === 'Enter') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  if (!top) return null;
  const confetti = ['🎉', '⭐', '✨', '🎊', '🌟', '✨', '⭐', '🎉'];
  return (
    <div role="dialog" aria-modal="true" aria-label={L('Level up', 'Subiste de nivel')} onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(20,32,24,.62)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div className="qk-card qk-bounce-in" onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative', width: 'min(380px, 100%)', padding: '28px 22px 22px', textAlign: 'center', display: 'grid', gap: 10, justifyItems: 'center', overflow: 'hidden' }}>
        {confetti.map((c, i) => (
          <span key={i} aria-hidden style={{ position: 'absolute', top: 10 + (i % 3) * 18, left: `${6 + i * 12}%`, fontSize: 18, opacity: .85 }}>{c}</span>
        ))}
        <span className="qk-eyebrow" style={{ marginTop: 14 }}>{L('Level up!', '¡Subiste de nivel!')}</span>
        <div className="qk-wiggle" style={{ margin: '4px 0' }}><Medal id={top.medal} size={132} shine /></div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, lineHeight: 1.1 }}>{L('Level', 'Nivel')} {top.n}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: 'var(--primary-d)' }}>{name(top, lang)}</div>
        <div style={{ fontSize: 14, color: 'var(--ink-3)' }}>{L('You won a new medal!', '¡Ganaste una medalla nueva!')}</div>
        {levels.length > 1 && (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
            {levels.slice(0, -1).map((l) => <Medal key={l.n} id={l.medal} size={40} />)}
          </div>
        )}
        <Btn kind="primary" onClick={onClose} style={{ marginTop: 6 }}>{L('Awesome!', '¡Genial!')}</Btn>
      </div>
    </div>
  );
}
