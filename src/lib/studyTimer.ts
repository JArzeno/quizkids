'use client';
import React from 'react';
import { useStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { dateKey } from '@/lib/plan';
import type { Kid, StudySession } from '@/types';

/** The timer stops after this long without a click, key press, scroll or touch */
export const IDLE_MS = 60_000;
/** How often activity is written to the store (it is persisted, so not on every mouse move) */
const ACTIVITY_WRITE_MS = 2_000;
/** How often the time so far is saved while the timer runs, so parent screens don't wait for it to stop */
const SAVE_EVERY_MS = 60_000;
const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'scroll', 'touchstart'] as const;

export function sessionElapsedMs(s: StudySession, at: number): number {
  return s.accumulatedMs + (s.runningSince != null ? Math.max(0, at - s.runningSince) : 0);
}

/** The kid the kid-mode screens show (same fallback they use) */
function currentKidId(): string | undefined {
  const { kids, activeKidId } = useStore.getState();
  return (kids.find((k) => k.id === activeKidId) || kids[0])?.id;
}

/** Starts the timer for a kid, or resumes it if it is paused */
export function startStudySession(kidId: string) {
  const { studySession } = useStore.getState();
  if (studySession?.kidId === kidId) { resumeStudySession(); return; }
  if (studySession) void endStudySession();
  const now = Date.now();
  useStore.setState({ studySession: { kidId, startedAt: now, runningSince: now, accumulatedMs: 0, lastActivityAt: now, dbId: crypto.randomUUID() }, studyIdleKidId: null });
}

export function pauseStudySession() {
  const s = useStore.getState().studySession;
  if (!s || s.runningSince == null) return;
  useStore.setState({ studySession: { ...s, accumulatedMs: sessionElapsedMs(s, Date.now()), runningSince: null } });
  checkpoint(Date.now(), true);
}

export function resumeStudySession() {
  const s = useStore.getState().studySession;
  if (!s || s.runningSince != null) return;
  const now = Date.now();
  useStore.setState({ studySession: { ...s, runningSince: now, lastActivityAt: now } });
}

/** Stops the timer and saves the time. With restartOnActivity, the kid's next click starts a new one. */
export function endStudySession(endAt = Date.now(), restartOnActivity = false): Promise<void> {
  const s = useStore.getState().studySession;
  if (!s) return Promise.resolve();
  useStore.setState({ studySession: null, studyIdleKidId: restartOnActivity ? s.kidId : null });
  saveProgress({ ...s, dbId: s.dbId ?? crypto.randomUUID() }, endAt, true);
  return saving;
}

/** Saves the running timer's time so far, at most once a minute unless forced */
function checkpoint(now: number, force = false) {
  const s = useStore.getState().studySession;
  if (!s || (!force && (s.runningSince == null || now - (s.savedAt ?? s.startedAt) < SAVE_EVERY_MS))) return;
  const withId = { ...s, dbId: s.dbId ?? crypto.randomUUID() };
  const savedMinutes = saveProgress(withId, now, false);
  useStore.setState({ studySession: { ...withId, savedAt: now, savedMinutes } });
}

/** Stops a running timer once the kid has been inactive for IDLE_MS (also covers a tab closed mid-session) */
function checkIdle(now = Date.now()) {
  const s = useStore.getState().studySession;
  if (!s || s.runningSince == null || now - s.lastActivityAt < IDLE_MS) return;
  void endStudySession(s.lastActivityAt + IDLE_MS, true);
}

function noteActivity() {
  const now = Date.now();
  checkIdle(now);
  const { studySession: s, studyIdleKidId } = useStore.getState();
  if (!s) {
    if (studyIdleKidId && studyIdleKidId === currentKidId()) startStudySession(studyIdleKidId);
    return;
  }
  if (s.runningSince != null && now - s.lastActivityAt >= ACTIVITY_WRITE_MS) {
    useStore.setState({ studySession: { ...s, lastActivityAt: now } });
  }
}

let saving: Promise<void> = Promise.resolve();

/** Resolves once study time handed off so far has reached Supabase; screens that load it wait for this */
export function studyTimeSaved(): Promise<void> {
  return saving;
}

/**
 * Writes the session's time so far: minutes go to the kid's total right away, today's seconds when it ends.
 * In Supabase the session is one study_sessions row, updated on every save. Returns the minutes saved.
 */
function saveProgress(s: StudySession & { dbId: string }, at: number, ended: boolean): number {
  const { kids, updateKid, isDemo } = useStore.getState();
  const kid = kids.find((k) => k.id === s.kidId);
  if (!kid) return s.savedMinutes || 0;
  const elapsedMs = sessionElapsedMs(s, at);
  const minutes = Math.round(elapsedMs / 60000);
  const addMinutes = Math.max(0, minutes - (s.savedMinutes || 0));
  const minutesTotal = (kid.minutes_total || 0) + addMinutes;
  const patch: Partial<Kid> = { minutes_total: minutesTotal };
  // Time from an earlier day (a session left open overnight) doesn't count toward today
  const key = dateKey(new Date(at));
  const seconds = Math.round(elapsedMs / 1000);
  if (ended && seconds > 0 && key === dateKey(new Date())) {
    patch.seconds_today = (kid.today_date === key ? kid.seconds_today || 0 : 0) + seconds;
    patch.today_date = key;
  }
  updateKid(kid.id, patch);
  if (isDemo || minutes <= 0) return minutes;

  const row = { id: s.dbId, kid_id: kid.id, minutes, started_at: new Date(s.startedAt).toISOString(), ended_at: new Date(at).toISOString() };
  // Saves run one after another so a late checkpoint can't overwrite the final minutes
  saving = saving.then(async () => {
    const supabase = createClient();
    const [sessionRes, kidRes] = await Promise.all([
      supabase.from('study_sessions').upsert(row),
      addMinutes > 0 ? supabase.from('kids').update({ minutes_total: minutesTotal }).eq('id', kid.id) : null,
    ]);
    const error = sessionRes.error || kidRes?.error;
    if (error) console.warn('Could not save study time:', error);
  }).catch((e) => console.warn('Could not save study time:', e));
  return minutes;
}

/**
 * Runs the timer in kid mode: watches for activity, stops after IDLE_MS without any,
 * and ends it when leaving kid mode or switching kids. Mounted once, in AppShell.
 */
export function useStudyTracker() {
  const mode = useStore((s) => s.mode);
  const kidId = useStore((s) => (s.kids.find((k) => k.id === s.activeKidId) || s.kids[0])?.id);
  const sessionKidId = useStore((s) => s.studySession?.kidId);

  React.useEffect(() => {
    if (mode !== 'kid') {
      if (sessionKidId) void endStudySession();
      else if (useStore.getState().studyIdleKidId) useStore.setState({ studyIdleKidId: null });
    } else if (sessionKidId && kidId && sessionKidId !== kidId) {
      void endStudySession();
    }
  }, [mode, kidId, sessionKidId]);

  React.useEffect(() => {
    if (mode !== 'kid') return;
    checkIdle();
    const onActivity = () => noteActivity();
    const onVisible = () => { if (document.visibilityState === 'visible') checkIdle(); };
    const opts = { capture: true, passive: true };
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, opts));
    document.addEventListener('visibilitychange', onVisible);
    const i = setInterval(() => { const now = Date.now(); checkIdle(now); checkpoint(now); }, 1000);
    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity, opts));
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(i);
    };
  }, [mode]);
}
