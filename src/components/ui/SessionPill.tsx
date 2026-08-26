'use client';
import React from 'react';
import { Ico, ICONS } from './Icons';
import { useT } from '@/lib/i18n';
import { formatElapsed } from '@/lib/session';
import type { Lang } from '@/types';

export { formatElapsed };

interface TimerLike {
  running: boolean;
  paused: boolean;
  elapsedMs: number;
}

interface SessionPillProps {
  lang: Lang;
  timer: TimerLike;
  onStart: () => void;
  onTogglePause: () => void;
  onEnd: () => void;
  compact?: boolean;
}

/** Start button when idle; live clock with pause/stop while a session runs. */
export function SessionPill({ lang, timer, onStart, onTogglePause, onEnd, compact = false }: SessionPillProps) {
  const t = useT(lang);
  if (!timer.running) {
    return (
      <button onClick={onStart} className="qk-btn qk-btn-primary" style={{ padding: '7px 14px 7px 12px', fontSize: 13, gap: 6, whiteSpace: 'nowrap' }}>
        <span style={{ display: 'inline-flex' }}>{React.cloneElement(ICONS.flame as React.ReactElement<{ size?: number }>, { size: 14 })}</span>
        <span>{t('startSession')}</span>
      </button>
    );
  }
  return (
    <div style={{ display: 'inline-flex', alignItems: 'stretch', borderRadius: 999, overflow: 'hidden', border: '1px solid var(--line)', background: timer.paused ? 'var(--surface-2)' : 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: timer.paused ? 'var(--honey-l)' : 'var(--primary-l)', color: timer.paused ? '#7C5410' : 'var(--primary-d)' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: timer.paused ? 'var(--honey)' : 'var(--primary)', animation: timer.paused ? 'none' : 'qk-pulse 1.4s ease-in-out infinite' }} />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13 }}>{timer.paused ? t('sessionPaused') : t('sessionRunning')}</span>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{formatElapsed(timer.elapsedMs)}</span>
      </div>
      {!compact && (
        <button onClick={onTogglePause} title={timer.paused ? t('resumeSession') : t('pauseSession')}
          style={{ appearance: 'none', border: 0, padding: '0 12px', background: 'transparent', color: 'var(--ink-2)', cursor: 'pointer', borderLeft: '1px solid var(--line)' }}>
          {timer.paused
            ? <Ico d={<path d="M5 3l14 9-14 9V3z" />} fill="currentColor" stroke="none" size={14} />
            : <Ico d={<g><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></g>} fill="currentColor" stroke="none" size={14} />}
        </button>
      )}
      <button onClick={onEnd} title={t('endAndSave')}
        style={{ appearance: 'none', border: 0, padding: '0 12px', background: 'transparent', color: 'var(--coral)', cursor: 'pointer', borderLeft: '1px solid var(--line)' }}>
        <Ico d={<rect x="6" y="6" width="12" height="12" />} fill="currentColor" stroke="none" size={12} />
      </button>
    </div>
  );
}

/**
 * Read-only clock for study screens (quiz / guide / worksheet), where the timer
 * starts on its own and the kid shouldn't have to think about it.
 */
export function StudyTimerBadge({ lang, timer, onTogglePause, label }: { lang: Lang; timer: TimerLike; onTogglePause?: () => void; label?: string }) {
  const t = useT(lang);
  if (!timer.running) return null;
  const paused = timer.paused;
  return (
    <div title={label || t('sessionAutoStarted')}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: paused ? 'var(--honey-l)' : 'var(--primary-l)', color: paused ? '#7C5410' : 'var(--primary-d)', border: '1px solid ' + (paused ? 'var(--honey)' : 'var(--primary)'), fontWeight: 700, fontSize: 13 }}>
      <span aria-hidden style={{ width: 8, height: 8, borderRadius: '50%', background: paused ? 'var(--honey)' : 'var(--primary)', animation: paused ? 'none' : 'qk-pulse 1.4s ease-in-out infinite' }} />
      <span style={{ fontFamily: 'ui-monospace, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatElapsed(timer.elapsedMs)}</span>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{paused ? t('timerPaused') : t('timerStudying')}</span>
      {onTogglePause && (
        <button onClick={onTogglePause} aria-label={paused ? t('resumeSession') : t('pauseSession')}
          style={{ appearance: 'none', border: 0, background: 'transparent', color: 'inherit', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 0, marginLeft: 2 }}>
          {paused
            ? <Ico d={<path d="M5 3l14 9-14 9V3z" />} fill="currentColor" stroke="none" size={12} />
            : <Ico d={<g><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></g>} fill="currentColor" stroke="none" size={12} />}
        </button>
      )}
    </div>
  );
}
