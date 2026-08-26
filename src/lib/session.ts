'use client';
import React from 'react';
import { useStore, MAX_SESSION_MS } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import type { StudyActivity, TimeLogEntry } from '@/types';

export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const mm = (m % 60).toString().padStart(2, '0');
    return `${h}:${mm}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/** "1h 05m" / "12 min" — for logs and summaries rather than a live clock. */
export function formatDuration(seconds: number, lang: string): string {
  const s = Math.max(0, Math.round(seconds));
  if (s === 0) return '0 min';
  if (s < 60) return lang === 'es' ? `${s} seg` : `${s} sec`;
  const m = Math.floor(s / 60);
  if (m < 60) return lang === 'es' ? `${m} min` : `${m} min`;
  const h = Math.floor(m / 60);
  return `${h}h ${(m % 60).toString().padStart(2, '0')}m`;
}

export function dayKey(d: Date | string = new Date()): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Live study timer. Reads the shared session out of the store and re-renders once
 * a second while it runs, so every screen shows the same clock.
 */
export function useStudyTimer() {
  const session = useStore((s) => s.session);
  const kids = useStore((s) => s.kids);
  const isDemo = useStore((s) => s.isDemo);
  const startSession = useStore((s) => s.startSession);
  const pauseSession = useStore((s) => s.pauseSession);
  const resumeSession = useStore((s) => s.resumeSession);
  const clearSession = useStore((s) => s.clearSession);
  const setSessionContext = useStore((s) => s.setSessionContext);
  const addTimeLog = useStore((s) => s.addTimeLog);
  const updateKid = useStore((s) => s.updateKid);

  const ticking = session.running && !session.paused;
  const [, forceTick] = React.useState(0);

  React.useEffect(() => {
    if (!ticking) return;
    const i = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, [ticking]);

  const rawElapsed = session.accumulatedMs + (ticking && session.spanStartedAt ? Date.now() - session.spanStartedAt : 0);
  const elapsedMs = Math.min(Math.max(0, rawElapsed), MAX_SESSION_MS);
  /** A tab left open overnight shouldn't bank 9 hours of "study". */
  const stale = rawElapsed > MAX_SESSION_MS;

  const end = React.useCallback(async (): Promise<TimeLogEntry | null> => {
    const s = useStore.getState().session;
    if (!s.running || !s.kidId) { clearSession(); return null; }

    const live = !s.paused && s.spanStartedAt ? Date.now() - s.spanStartedAt : 0;
    const totalMs = Math.min(Math.max(0, s.accumulatedMs + live), MAX_SESSION_MS);
    const seconds = Math.round(totalMs / 1000);
    clearSession();
    if (seconds <= 0) return null;

    const endedAt = new Date();
    const startedAt = new Date(endedAt.getTime() - totalMs);
    const minutes = Math.max(1, Math.round(seconds / 60));

    const entry: TimeLogEntry = {
      id: `local-${endedAt.getTime()}`,
      kid_id: s.kidId,
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
      seconds,
      minutes,
      subject: s.subject,
      topic: s.topic,
      activity: s.activity,
      local: true,
    };

    // Roll the kid's own counters forward so the UI updates instantly.
    const kid = useStore.getState().kids.find((k) => k.id === s.kidId);
    if (kid) {
      const key = dayKey();
      const baseSeconds = kid.today_date === key ? (kid.seconds_today || 0) : 0;
      const minutesTotal = (kid.minutes_total || 0) + minutes;
      updateKid(kid.id, { seconds_today: baseSeconds + seconds, today_date: key, minutes_total: minutesTotal });

      if (!isDemo) {
        try {
          const supabase = createClient();
          const row = {
            kid_id: kid.id,
            minutes,
            started_at: entry.started_at,
            ended_at: entry.ended_at,
          };
          // seconds/subject/topic/activity arrive with migration 002 — fall back if the
          // database hasn't been migrated yet so time is never silently dropped.
          const rich = { ...row, seconds, subject: s.subject, topic: s.topic, activity: s.activity };
          const { data, error } = await supabase.from('study_sessions').insert(rich).select('id').single();
          if (error) {
            const { data: basic } = await supabase.from('study_sessions').insert(row).select('id').single();
            if (basic?.id) { entry.id = basic.id; entry.local = false; }
          } else if (data?.id) {
            entry.id = data.id;
            entry.local = false;
          }
          await supabase.from('kids').update({ minutes_total: minutesTotal }).eq('id', kid.id);
        } catch (e) {
          console.warn('Could not save study session:', e);
        }
      }
    }

    addTimeLog(entry);
    return entry;
  }, [addTimeLog, clearSession, isDemo, updateKid]);

  // Auto-close a session that has clearly been abandoned.
  const endRef = React.useRef(end);
  endRef.current = end;
  React.useEffect(() => {
    if (stale) void endRef.current();
  }, [stale]);

  const activeKid = kids.find((k) => k.id === session.kidId) || null;

  return {
    session,
    running: session.running,
    paused: session.paused,
    elapsedMs,
    activeKid,
    start: startSession,
    pause: pauseSession,
    resume: resumeSession,
    toggle: () => (session.paused ? resumeSession() : pauseSession()),
    setContext: setSessionContext,
    end,
  };
}

/**
 * Starts the clock as soon as a kid opens a study (quiz / guide / worksheet), and
 * keeps the session's subject + topic in sync with what they're looking at.
 */
export function useAutoStudySession(opts: {
  kidId: string | null | undefined;
  subject?: string | null;
  topic?: string | null;
  activity: StudyActivity;
  enabled?: boolean;
}) {
  const timer = useStudyTimer();
  const { kidId, subject, topic, activity, enabled = true } = opts;
  const startSession = useStore((s) => s.startSession);
  const setSessionContext = useStore((s) => s.setSessionContext);

  React.useEffect(() => {
    if (!enabled || !kidId) return;
    const s = useStore.getState().session;
    if (!s.running || s.kidId !== kidId) {
      startSession({ kidId, subject, topic, activity });
    } else {
      setSessionContext({ subject, topic, activity });
    }
  }, [enabled, kidId, subject, topic, activity, startSession, setSessionContext]);

  return timer;
}

/** Bars for a "last N days" chart, oldest → newest, in minutes. */
export function dailyMinutes(entries: TimeLogEntry[], days = 7, lang = 'en'): Array<{ label: string; value: number; key: string }> {
  const out: Array<{ label: string; value: number; key: string }> = [];
  const locale = lang === 'es' ? 'es-ES' : 'en-US';
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    const value = entries
      .filter((e) => dayKey(e.started_at) === key)
      .reduce((acc, e) => acc + (e.seconds ? e.seconds / 60 : e.minutes || 0), 0);
    out.push({ key, label: d.toLocaleDateString(locale, { weekday: 'short' }).replace('.', ''), value: Math.round(value) });
  }
  return out;
}

export function totalSeconds(entries: TimeLogEntry[]): number {
  return entries.reduce((acc, e) => acc + (e.seconds || (e.minutes || 0) * 60), 0);
}

/** Merge DB rows with local-only rows (demo mode / failed inserts) without double counting. */
export function mergeLogs(dbRows: TimeLogEntry[], localRows: TimeLogEntry[]): TimeLogEntry[] {
  const seen = new Set(dbRows.map((r) => r.id));
  const extra = localRows.filter((r) => r.local && !seen.has(r.id));
  return [...dbRows, ...extra].sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
}

/** Reads study_sessions for one or more kids, tolerating a pre-migration schema. */
export async function fetchTimeLog(kidIds: string[], limit = 200): Promise<TimeLogEntry[]> {
  if (!kidIds.length) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .in('kid_id', kidIds)
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((r: Record<string, unknown>) => {
    const minutes = Number(r.minutes ?? 0) || 0;
    const seconds = Number(r.seconds ?? 0) || minutes * 60;
    const started = (r.started_at as string) || new Date().toISOString();
    return {
      id: String(r.id),
      kid_id: String(r.kid_id),
      started_at: started,
      ended_at: (r.ended_at as string) || started,
      seconds,
      minutes,
      subject: (r.subject as string) ?? null,
      topic: (r.topic as string) ?? null,
      activity: (r.activity as string) ?? null,
    };
  });
}
