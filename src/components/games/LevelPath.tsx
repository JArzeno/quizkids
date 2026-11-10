'use client';
import React from 'react';
import { createPortal } from 'react-dom';
import { ICONS } from '@/components/ui/Icons';
import { GAME_MODES, type GameMode } from '@/lib/games';
import { MASTERY } from '@/lib/goals';
import type { Level } from '@/lib/levels';

const W = 340;
const ROW = 156;
const NODE = 76;
const TOP = 10;
/** How far each level sits from the middle of the path: a gentle zigzag */
const offsetOf = (i: number) => Math.round(Math.sin(i * 0.95) * 84);
const center = (i: number) => ({ x: W / 2 + offsetOf(i), y: TOP + i * ROW + NODE / 2 });

function curve(from: number, to: number) {
  let d = '';
  for (let i = from; i <= to; i++) {
    const p = center(i);
    if (i === from) { d = `M ${p.x} ${p.y}`; continue; }
    const q = center(i - 1);
    d += ` C ${q.x} ${q.y + ROW / 2}, ${p.x} ${p.y - ROW / 2}, ${p.x} ${p.y}`;
  }
  return d;
}

function StarRow({ stars, size, pop }: { stars: number; size: number; pop?: boolean }) {
  return (
    <span aria-hidden style={{ display: 'inline-flex', gap: 2, lineHeight: 1 }}>
      {[1, 2, 3].map((k) => (
        <span key={k} className={pop && k <= stars ? 'qk-star-pop' : undefined}
          style={{ fontSize: size, color: k <= stars ? 'var(--honey)' : 'var(--line)', animationDelay: pop ? `${k * 120}ms` : undefined }}>★</span>
      ))}
    </span>
  );
}

/**
 * A subject as a game map: one round button per level (topic), joined by a winding path. Passed levels show their
 * stars, the next one to play pulses, the rest wait behind a lock. The last stop is the trophy.
 */
export default function LevelPath({ levels, lang, minimal, unlockedN, onOpen }: {
  levels: Level[];
  lang: string;
  /** Gamification "minimal": no stars, a check for passed levels */
  minimal: boolean;
  /** Level that was just unlocked: it pops in */
  unlockedN?: number | null;
  onOpen: (level: Level) => void;
}) {
  const L = (en: string, es: string) => (lang === 'es' ? es : en);
  const [shake, setShake] = React.useState<number | null>(null);
  const [hint, setHint] = React.useState<string | null>(null);
  const hereRef = React.useRef<HTMLDivElement>(null);
  const allDone = levels.length > 0 && levels.every((l) => l.cleared);
  const currentIdx = levels.findIndex((l) => l.state === 'current');
  // The colored part of the path reaches the level to play next (or the trophy)
  const reach = allDone ? levels.length : Math.max(0, currentIdx);
  const height = TOP + (levels.length + 1) * ROW - 30;

  // Long paths open on the level to play, not on level 1
  React.useEffect(() => {
    if (currentIdx > 2) hereRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx]);

  React.useEffect(() => {
    if (!hint) return;
    const id = setTimeout(() => { setHint(null); setShake(null); }, 2600);
    return () => clearTimeout(id);
  }, [hint]);

  const tap = (level: Level) => {
    if (level.state !== 'locked') { onOpen(level); return; }
    const need = levels[level.n - 2];
    setShake(level.n);
    setHint(L(`Pass level ${need.n} to get the key`, `Pasa el nivel ${need.n} para ganar la llave`));
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: W, height, margin: '0 auto' }}>
      <svg aria-hidden width="100%" height={height} viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="xMidYMin meet" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <path d={curve(0, levels.length)} fill="none" stroke="var(--line)" strokeWidth={10} strokeLinecap="round" strokeDasharray="2 18" />
        {reach > 0 && <path className="qk-path-draw" d={curve(0, reach)} pathLength={1} fill="none" stroke="var(--primary)" strokeWidth={10} strokeLinecap="round" opacity={0.55} />}
      </svg>

      {levels.map((level, i) => {
        const p = center(i);
        const here = level.state === 'current';
        const locked = level.state === 'locked';
        const tone = level.state === 'done'
          ? { bg: 'var(--primary)', fg: '#fff', edge: 'var(--primary-d)' }
          : here
            ? { bg: 'var(--honey)', fg: '#3D2A05', edge: 'color-mix(in srgb, var(--honey) 70%, #000)' }
            : locked
              ? { bg: 'var(--bg-2)', fg: 'var(--ink-3)', edge: 'var(--line)' }
              : { bg: 'var(--surface)', fg: 'var(--primary-d)', edge: 'var(--primary)' };
        const status = level.state === 'done' ? L('passed', 'superado') : here ? L('play now', 'juega ahora') : locked ? L('locked', 'bloqueado') : L('started', 'empezado');
        return (
          <div key={level.title} ref={here ? hereRef : undefined} className="qk-lvl-in"
            style={{ position: 'absolute', left: `${(p.x / W) * 100}%`, top: p.y - NODE / 2, width: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', animationDelay: `${Math.min(i, 8) * 60}ms` }}>
            <div style={{ position: 'relative', width: NODE, height: NODE }}>
              {here && <span aria-hidden className="qk-lvl-ring" style={{ position: 'absolute', inset: -6, borderRadius: '50%', border: '4px solid var(--honey)' }} />}
              <button type="button" onClick={() => tap(level)}
                aria-label={`${L('Level', 'Nivel')} ${level.n}: ${level.title} (${status})`}
                className={`qk-lvl${shake === level.n ? ' qk-shake' : ''}${unlockedN === level.n ? ' qk-lvl-unlock' : ''}${here ? ' qk-lvl-bob' : ''}`}
                style={{ width: NODE, height: NODE, borderRadius: '50%', background: tone.bg, color: tone.fg, boxShadow: `0 6px 0 ${tone.edge}`, border: level.state === 'open' ? '3px solid var(--primary)' : 0 }}>
                {locked ? <span aria-hidden style={{ fontSize: 26 }}>🔒</span> : level.state === 'done' && minimal ? ICONS.check : level.n}
              </button>
              {here && (
                <span aria-hidden className="qk-lvl-here" style={{ position: 'absolute', top: NODE / 2 - 15, ...(offsetOf(i) >= 0 ? { right: NODE + 12 } : { left: NODE + 12 }), ['--dir' as string]: offsetOf(i) >= 0 ? 1 : -1 }}>
                  {level.row.attempts > 0 ? L('Keep going!', '¡Sigue!') : L('Start!', '¡Empieza!')}
                </span>
              )}
            </div>
            {!minimal && !locked && <span style={{ marginTop: 10 }}><StarRow stars={level.stars} size={17} /></span>}
            <div style={{ marginTop: minimal || locked ? 12 : 4, width: 158, textAlign: 'center', padding: '4px 10px', borderRadius: 12, background: 'var(--bg)', fontSize: 13, fontWeight: 700, lineHeight: 1.25, color: locked ? 'var(--ink-3)' : 'var(--ink)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', overflowWrap: 'anywhere' }}>
              {level.title}
            </div>
          </div>
        );
      })}

      {/* the end of the path */}
      {(() => {
        const p = center(levels.length);
        return (
          <div style={{ position: 'absolute', left: `${(p.x / W) * 100}%`, top: p.y - NODE / 2, width: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className={allDone ? 'qk-lvl-bob' : undefined} aria-hidden style={{ width: NODE, height: NODE, borderRadius: 24, display: 'grid', placeItems: 'center', fontSize: 40, background: allDone ? 'var(--honey-l)' : 'var(--bg-2)', boxShadow: `0 6px 0 ${allDone ? 'var(--honey)' : 'var(--line)'}`, filter: allDone ? undefined : 'grayscale(1)', opacity: allDone ? 1 : 0.6 }}>🏆</div>
            <div style={{ marginTop: 12, width: 190, textAlign: 'center', fontSize: 13, fontWeight: 700, color: allDone ? 'var(--primary-d)' : 'var(--ink-3)' }}>
              {allDone ? L('You finished every level!', '¡Completaste todos los niveles!') : L('Pass every level to win the trophy', 'Pasa todos los niveles para ganar el trofeo')}
            </div>
          </div>
        );
      })()}

      {/* on <body>: the page's enter animation would otherwise pin "fixed" to the page instead of the window */}
      {hint && createPortal(
        <div role="status" style={{ position: 'fixed', left: '50%', bottom: 28, zIndex: 40, transform: 'translateX(-50%)', animation: 'qk-toast-in .25s ease both', padding: '10px 18px', borderRadius: 999, background: 'var(--ink)', color: '#fff', fontWeight: 700, fontSize: 14, boxShadow: 'var(--shadow-lg)', whiteSpace: 'nowrap', maxWidth: 'calc(100vw - 32px)' }}>
          🔑 {hint}
        </div>,
        document.body,
      )}
    </div>
  );
}

/** What opens when a level is tapped: its topic, its stars and the ways to play it */
export function LevelSheet({ level, lang, minimal, weak, onLearn, onPlay, onPractice, onClose }: {
  level: Level;
  lang: string;
  minimal: boolean;
  /** The topic was hard on a practice test for a school test */
  weak: boolean;
  onLearn: () => void;
  onPlay: (mode: GameMode) => void;
  onPractice: () => void;
  onClose: () => void;
}) {
  const L = (en: string, es: string) => (lang === 'es' ? es : en);
  const { row } = level;
  const fresh = row.attempts === 0;

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // One line, the one that matters most right now
  const note = fresh
    ? L(`Get ${MASTERY}% or more to earn the key to the next level.`, `Saca ${MASTERY}% o más para ganar la llave del siguiente nivel.`)
    : !level.cleared
      ? L(`Your best so far: ${row.bestPct}%. You need ${MASTERY}% for the key. You can do it!`, `Tu mejor resultado: ${row.bestPct}%. Necesitas ${MASTERY}% para la llave. ¡Tú puedes!`)
      : row.lastPct != null && row.lastPct < MASTERY
        ? L(`Your last round was ${row.lastPct}%. Play again to stay sharp.`, `Tu última ronda fue ${row.lastPct}%. Juega otra vez para no olvidarlo.`)
        : level.stars < 3
          ? L(`Your best: ${row.bestPct}%. Play again to win all 3 stars.`, `Tu mejor resultado: ${row.bestPct}%. Juega otra vez para ganar las 3 estrellas.`)
          : L('Perfect level! Play again any time.', '¡Nivel perfecto! Juega otra vez cuando quieras.');

  const stepLabel = (n: number, text: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--ink-2)' }}>
      <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 12, flexShrink: 0 }}>{n}</span>
      {text}
    </div>
  );

  return createPortal(
    <div className="qk-overlay-enter" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(31,51,38,.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div role="dialog" aria-modal="true" aria-label={`${L('Level', 'Nivel')} ${level.n}: ${level.title}`} className="qk-sheet-enter" onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto', background: 'var(--surface)', borderRadius: '28px 28px 0 0', padding: 'clamp(18px, 4vw, 26px)', paddingBottom: 'max(22px, env(safe-area-inset-bottom))', boxShadow: 'var(--shadow-lg)', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span className="qk-eyebrow">{L('Level', 'Nivel')} {level.n}</span>
            <h2 className="qk-h2" style={{ margin: '6px 0 0', overflowWrap: 'anywhere' }}>{level.title}</h2>
          </div>
          <button type="button" className="qk-iconbtn" aria-label={L('Close', 'Cerrar')} onClick={onClose}>{ICONS.x}</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 16, background: level.cleared ? 'var(--primary-l)' : 'var(--honey-l)' }}>
          {minimal ? <span aria-hidden style={{ fontSize: 24 }}>{level.cleared ? '✅' : '🔑'}</span> : <StarRow stars={level.stars} size={28} pop />}
          <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, lineHeight: 1.35, color: 'var(--ink)' }}>{note}</span>
        </div>
        {weak && <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--coral-d)' }}>🎯 {L('This one was hard on a practice test: review it.', 'Este costó en un examen de práctica: repásalo.')}</div>}

        <div style={{ display: 'grid', gap: 8 }}>
          {stepLabel(1, L('Learn it', 'Aprende'))}
          <button type="button" onClick={onLearn} className={`qk-btn ${fresh ? 'qk-btn-primary' : 'qk-btn-ghost'}`} style={{ justifyContent: 'center', padding: '12px 16px', fontSize: 16 }}>
            {ICONS.book} <span>{L('Read the guide', 'Lee la guía')}</span>
          </button>
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          {stepLabel(2, minimal ? L('Play to pass the level', 'Juega para pasar el nivel') : L('Play and win stars', 'Juega y gana estrellas'))}
          <div className="qk-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
            {GAME_MODES.map((m) => (
              <button key={m.id} type="button" onClick={() => onPlay(m.id)} className="qk-lvl-mode"
                style={{ background: `var(--${m.tone}-l)`, boxShadow: `0 4px 0 color-mix(in srgb, var(--${m.tone}) 45%, transparent)` }}>
                <span aria-hidden style={{ fontSize: 30, lineHeight: 1 }}>{m.emoji}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, lineHeight: 1.2 }}>{(lang === 'es' ? m.es : m.en).title}</span>
              </button>
            ))}
          </div>
        </div>

        <button type="button" onClick={onPractice} style={{ appearance: 'none', border: 0, background: 'transparent', font: 'inherit', fontSize: 14, fontWeight: 700, color: 'var(--primary-d)', cursor: 'pointer', padding: 6, justifySelf: 'center' }}>
          📝 {L('Try a practice test', 'Haz un examen de práctica')}
        </button>
      </div>
    </div>,
    document.body,
  );
}
