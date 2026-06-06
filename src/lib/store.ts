'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Kid, ParentPrefs, QuizResult, StudyParams, Lang } from '@/types';

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

  plan: { tier: 'free' | 'family'; cycle: 'monthly' | 'yearly'; since: number };
  setPlan: (p: { tier: 'free' | 'family'; cycle: 'monthly' | 'yearly'; since: number }) => void;

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

  // theme
  palette: string;
  setPalette: (p: string) => void;
  font: string;
  setFont: (f: string) => void;
  difficulty: 'easy' | 'medium' | 'hard';
  setDifficulty: (d: 'easy' | 'medium' | 'hard') => void;
  gamification: 'minimal' | 'light' | 'medium';
  setGamification: (g: 'minimal' | 'light' | 'medium') => void;
}

export const DEMO_KIDS: Kid[] = [
  {
    id: 'mateo', parent_id: 'demo', name: 'Mateo', grade: '3',
    avatar: 'fox', color: '#E26D5A', code: 'MATEO1',
    streak: 7, stars: 42, minutes_total: 36, weekly: 62, goal_min: 30,
    lastSubject: 'Science',
    recent: [
      { kind: 'quiz', title: 'Solar System & Planets', when: 'Today', score: 4 },
      { kind: 'guide', title: 'States of Matter', when: 'Yesterday', score: 5 },
    ],
  },
  {
    id: 'lucia', parent_id: 'demo', name: 'Lucía', grade: 'K',
    avatar: 'sprout', color: '#3F7A4F', code: 'LUCIA1',
    streak: 3, stars: 18, minutes_total: 18, weekly: 35, goal_min: 30,
    lastSubject: 'Language Arts',
    recent: [{ kind: 'pdf', title: 'Sight Words', when: 'Mon', score: 0 }],
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

      plan: { tier: 'free', cycle: 'monthly', since: Date.now() },
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

      palette: 'forest',
      setPalette: (palette) => set({ palette }),
      font: 'fredoka',
      setFont: (font) => set({ font }),
      difficulty: 'medium',
      setDifficulty: (difficulty) => set({ difficulty }),
      gamification: 'light',
      setGamification: (gamification) => set({ gamification }),
    }),
    { name: 'quizkids-store' }
  )
);
