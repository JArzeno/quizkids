'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Kid, ParentPrefs, QuizResult, StudyParams, Lang, TimeLogEntry, StudyActivity } from '@/types';

/**
 * The live study timer. Kept in the store (not in a component) so the clock keeps
 * running while the kid moves between home → guide → quiz → results, and survives
 * a reload.
 */
export interface StudySession {
  running: boolean;
  paused: boolean;
  /** wall-clock start of the current un-paused span, null while paused */
  spanStartedAt: number | null;
  /** milliseconds banked from previous spans */
  accumulatedMs: number;
  /** wall-clock start of the whole session (used as started_at when logging) */
  sessionStartedAt: number | null;
  kidId: string | null;
  subject: string | null;
  topic: string | null;
  activity: StudyActivity | null;
}

export const IDLE_SESSION: StudySession = {
  running: false, paused: false, spanStartedAt: null, accumulatedMs: 0,
  sessionStartedAt: null, kidId: null, subject: null, topic: null, activity: null,
};

/** A session left running longer than this is treated as forgotten, not as study time. */
export const MAX_SESSION_MS = 4 * 60 * 60 * 1000;

interface AppState {
  // lang
  lang: Lang;
  setLang: (l: Lang) => void;

  // demo mode
  isDemo: boolean;
  setIsDemo: (v: boolean) => void;

  // profile
  account: { name: string; email: string } | null;
  setAccount: (a: { name: string; email: string } | null) => void;

  parentPrefs: ParentPrefs;
  setParentPrefs: (p: ParentPrefs) => void;

  parentPin: string;
  setParentPin: (pin: string) => void;

  plan: { cycle: 'monthly' | 'yearly'; since: number };
  setPlan: (p: { cycle: 'monthly' | 'yearly'; since: number }) => void;

  // kids
  kids: Kid[];
  setKids: (k: Kid[]) => void;
  addKid: (k: Kid) => void;
  updateKid: (id: string, patch: Partial<Kid>) => void;
  removeKid: (id: string) => void;

  // active state
  activeKidId: string | null;
  setActiveKidId: (id: string | null) => void;

  mode: 'parent' | 'kid';
  setMode: (m: 'parent' | 'kid') => void;

  // study params (for picker → generate → quiz/guide/pdf flow)
  studyParams: StudyParams;
  setStudyParams: (p: StudyParams) => void;

  // quiz result (for quiz → results)
  quizResult: QuizResult | null;
  setQuizResult: (r: QuizResult | null) => void;

  // custom subjects
  customSubjects: Array<{ id: string; name: string; icon: string; color: string }>;
  setCustomSubjects: (s: Array<{ id: string; name: string; icon: string; color: string }>) => void;

  // history subject filter (kids home)
  filterSubject: string | null;
  setFilterSubject: (s: string | null) => void;

  // theme
  palette: string;
  setPalette: (p: string) => void;
  font: string;
  setFont: (f: string) => void;
  difficulty: 'easy' | 'medium' | 'hard';
  setDifficulty: (d: 'easy' | 'medium' | 'hard') => void;
  gamification: 'minimal' | 'light' | 'medium';
  setGamification: (g: 'minimal' | 'light' | 'medium') => void;

  // session auto-start signal
  autoStartSession: boolean;
  setAutoStartSession: (v: boolean) => void;

  // live study timer (shared across every screen)
  session: StudySession;
  startSession: (ctx: { kidId: string; subject?: string | null; topic?: string | null; activity?: StudyActivity | null }) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  clearSession: () => void;
  setSessionContext: (ctx: { subject?: string | null; topic?: string | null; activity?: StudyActivity | null }) => void;

  // study time log (local mirror of study_sessions, for kid + parent review)
  timeLog: TimeLogEntry[];
  addTimeLog: (e: TimeLogEntry) => void;
  setTimeLog: (e: TimeLogEntry[]) => void;

  // custom topics the parent typed in, kept per subject so the list stays dynamic
  customTopics: Record<string, string[]>;
  addCustomTopic: (subject: string, topic: string) => void;
  setCustomTopics: (m: Record<string, string[]>) => void;
}

function elapsedOf(s: StudySession): number {
  const live = s.running && !s.paused && s.spanStartedAt ? Date.now() - s.spanStartedAt : 0;
  return Math.max(0, s.accumulatedMs + live);
}

export const DEMO_KIDS: Kid[] = [
  {
    id: 'mateo', parent_id: 'demo', name: 'Mateo', grade: '3',
    avatar: 'fox', color: '#E26D5A', code: 'MATEO1',
    streak: 7, stars: 42, minutes_total: 36, weekly: 62, goal_min: 30,
    lastSubject: 'Science',
    recent: [
      { kind: 'quiz', title: 'Solar System & Planets', when: 'Today', score: 4, subject: 'sci' },
      { kind: 'guide', title: 'States of Matter', when: 'Yesterday', score: 5, subject: 'sci' },
    ],
  },
  {
    id: 'lucia', parent_id: 'demo', name: 'Lucía', grade: 'K',
    avatar: 'sprout', color: '#3F7A4F', code: 'LUCIA1',
    streak: 3, stars: 18, minutes_total: 18, weekly: 35, goal_min: 30,
    lastSubject: 'Language Arts',
    recent: [{ kind: 'pdf', title: 'Sight Words', when: 'Mon', score: 0, subject: 'lang' }],
  },
];

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      lang: 'en',
      setLang: (lang) => set({ lang }),

      isDemo: false,
      setIsDemo: (isDemo) => set({ isDemo }),

      account: null,
      setAccount: (account) => set({ account }),

      parentPrefs: { role: 'mom', kidsCount: 2, langs: ['en', 'es'], where: ['home'], goalMin: 30, reminders: true, reminderAt: '5:00 pm', sound: true, pinFor: { settings: true, create: false, exitKid: false } },
      setParentPrefs: (parentPrefs) => set({ parentPrefs }),

      parentPin: '1234',
      setParentPin: (parentPin) => set({ parentPin }),

      plan: { cycle: 'monthly', since: Date.now() },
      setPlan: (plan) => set({ plan }),

      kids: [],
      setKids: (kids) => set({ kids }),
      addKid: (kid) => set((s) => ({ kids: [...s.kids, kid] })),
      updateKid: (id, patch) => set((s) => ({ kids: s.kids.map((k) => k.id === id ? { ...k, ...patch } : k) })),
      removeKid: (id) => set((s) => ({ kids: s.kids.filter((k) => k.id !== id) })),

      activeKidId: null,
      setActiveKidId: (activeKidId) => set({ activeKidId }),

      mode: 'parent',
      setMode: (mode) => set({ mode }),

      studyParams: { subject: 'sci', topic: 'Solar System & Planets', grade: '3', difficulty: 'medium', lang: 'en' },
      setStudyParams: (studyParams) => set({ studyParams }),

      quizResult: null,
      setQuizResult: (quizResult) => set({ quizResult }),

      customSubjects: [],
      setCustomSubjects: (customSubjects) => set({ customSubjects }),

      filterSubject: null,
      setFilterSubject: (filterSubject) => set({ filterSubject }),

      palette: 'forest',
      setPalette: (palette) => set({ palette }),
      font: 'fredoka',
      setFont: (font) => set({ font }),
      difficulty: 'medium',
      setDifficulty: (difficulty) => set({ difficulty }),
      gamification: 'light',
      setGamification: (gamification) => set({ gamification }),

      autoStartSession: false,
      setAutoStartSession: (autoStartSession) => set({ autoStartSession }),

      session: IDLE_SESSION,
      startSession: ({ kidId, subject = null, topic = null, activity = null }) => set((s) => {
        // Already timing this kid? Keep the clock, just refresh what they're working on.
        if (s.session.running && s.session.kidId === kidId) {
          return {
            session: {
              ...s.session,
              paused: false,
              spanStartedAt: s.session.paused ? Date.now() : s.session.spanStartedAt,
              subject: subject ?? s.session.subject,
              topic: topic ?? s.session.topic,
              activity: activity ?? s.session.activity,
            },
          };
        }
        const now = Date.now();
        return {
          session: {
            running: true, paused: false, spanStartedAt: now, accumulatedMs: 0,
            sessionStartedAt: now, kidId, subject, topic, activity,
          },
        };
      }),
      pauseSession: () => set((s) => s.session.running && !s.session.paused
        ? { session: { ...s.session, paused: true, accumulatedMs: elapsedOf(s.session), spanStartedAt: null } }
        : {}),
      resumeSession: () => set((s) => s.session.paused
        ? { session: { ...s.session, paused: false, spanStartedAt: Date.now() } }
        : {}),
      clearSession: () => set({ session: IDLE_SESSION }),
      setSessionContext: ({ subject, topic, activity }) => set((s) => s.session.running
        ? {
            session: {
              ...s.session,
              subject: subject ?? s.session.subject,
              topic: topic ?? s.session.topic,
              activity: activity ?? s.session.activity,
            },
          }
        : {}),

      timeLog: [],
      addTimeLog: (e) => set((s) => ({ timeLog: [e, ...s.timeLog].slice(0, 300) })),
      setTimeLog: (timeLog) => set({ timeLog: timeLog.slice(0, 300) }),

      customTopics: {},
      addCustomTopic: (subject, topic) => set((s) => {
        const clean = topic.trim();
        if (!clean) return {};
        const existing = s.customTopics[subject] || [];
        if (existing.some((x) => x.toLowerCase() === clean.toLowerCase())) return {};
        return { customTopics: { ...s.customTopics, [subject]: [clean, ...existing].slice(0, 40) } };
      }),
      setCustomTopics: (customTopics) => set({ customTopics }),
    }),
    { name: 'quizkids-store' }
  )
);
