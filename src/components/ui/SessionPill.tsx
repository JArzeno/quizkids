'use client';
import React from 'react';
import { Ico, ICONS } from './Icons';
import { useT } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { sessionElapsedMs, startStudySession, pauseStudySession, resumeStudySession, endStudySession } from '@/lib/studyTimer';
import type { Lang } from '@/types';

export function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const mm = (m % 60).toString().padStart(2, '0');
    return `${h}:${mm}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export interface SessionState {
  running: boolean;
  paused: boolean;
  elapsedMs: number;
  start: () => void;
  pause: () => void;
  resume: () => void;
  end: () => void;
}

/** The kid's study timer. It lives in the store, so it keeps counting on other pages and after a reload. */
export function useSession(kidId?: string): SessionState {
  const stored = useStore((s) => s.studySession);
  const session = stored && stored.kidId === kidId ? stored : null;
  const ticking = !!session && session.runningSince != null;
  const [now, setNow] = React.useState(Date.now());

  React.useEffect(() => {
    if (!ticking) return;
    setNow(Date.now());
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [ticking]);

  return {
    running: !!session,
    paused: !!session && !ticking,
    elapsedMs: session ? sessionElapsedMs(session, now) : 0,
    start: () => { if (kidId) startStudySession(kidId); },
    pause: pauseStudySession,
    resume: resumeStudySession,
    end: () => { void endStudySession(); },
  };
}

interface SessionPillProps { lang: Lang; session: SessionState; onStart: () => void; onTogglePause: () => void; onEnd: () => void; compact?: boolean; }

export function SessionPill({ lang, session, onStart, onTogglePause, onEnd, compact = false }: SessionPillProps) {
  const t = useT(lang);
  if (!session.running) {
    return (
      <button onClick={onStart} className="qk-btn qk-btn-primary" style={{ padding: '7px 14px 7px 12px', fontSize: 13, gap: 6, whiteSpace: 'nowrap' }}>
        <span style={{ display: 'inline-flex' }}>{React.cloneElement(ICONS.flame as React.ReactElement<{ size?: number }>, { size: 14 })}</span>
        <span>{t('startSession')}</span>
      </button>
    );
  }
  return (
    <div style={{ display: 'inline-flex', alignItems: 'stretch', borderRadius: 999, overflow: 'hidden', border: '1px solid var(--line)', background: session.paused ? 'var(--surface-2)' : 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: session.paused ? 'var(--honey-l)' : 'var(--primary-l)', color: session.paused ? '#7C5410' : 'var(--primary-d)' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: session.paused ? 'var(--honey)' : 'var(--primary)', animation: session.paused ? 'none' : 'qk-pulse 1.4s ease-in-out infinite' }} />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13 }}>{session.paused ? t('sessionPaused') : t('sessionRunning')}</span>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700, fontSize: 13 }}>{formatElapsed(session.elapsedMs)}</span>
      </div>
      {!compact && (
        <button onClick={onTogglePause} style={{ appearance: 'none', border: 0, padding: '0 12px', background: 'transparent', color: 'var(--ink-2)', cursor: 'pointer', borderLeft: '1px solid var(--line)' }}>
          {session.paused
            ? <Ico d={<path d="M5 3l14 9-14 9V3z" />} fill="currentColor" stroke="none" size={14} />
            : <Ico d={<g><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></g>} fill="currentColor" stroke="none" size={14} />}
        </button>
      )}
      <button onClick={onEnd} style={{ appearance: 'none', border: 0, padding: '0 12px', background: 'transparent', color: 'var(--coral)', cursor: 'pointer', borderLeft: '1px solid var(--line)' }}>
        <Ico d={<rect x="6" y="6" width="12" height="12" />} fill="currentColor" stroke="none" size={12} />
      </button>
    </div>
  );
}

/** Read-only timer for the header, so it stays visible during a quiz or guide */
export function SessionBadge({ lang, session }: { lang: Lang; session: SessionState }) {
  const t = useT(lang);
  if (!session.running) return null;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, border: '1px solid var(--line)', background: session.paused ? 'var(--honey-l)' : 'var(--primary-l)', color: session.paused ? '#7C5410' : 'var(--primary-d)', boxShadow: 'var(--shadow-sm)' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: session.paused ? 'var(--honey)' : 'var(--primary)', animation: session.paused ? 'none' : 'qk-pulse 1.4s ease-in-out infinite' }} />
      <span className="qk-session-label" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13 }}>{session.paused ? t('sessionPaused') : t('sessionRunning')}</span>
      <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700, fontSize: 13 }}>{formatElapsed(session.elapsedMs)}</span>
    </div>
  );
}
