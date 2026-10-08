'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@/lib/supabase/client';
import type { Kid, ParentPrefs, QuizResult, StudyParams, Lang, ImportedLesson, StudySession, CustomSubject } from '@/types';

interface AppState {
  // lang
  lang: Lang;
  /** Changes the language and saves it on the signed-in account */
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

  // last imported class (PDF / photos → analysis), so the parent can come back to it
  importedLesson: ImportedLesson | null;
  setImportedLesson: (l: ImportedLesson | null) => void;

  // quiz result (for quiz → results)
  quizResult: QuizResult | null;
  setQuizResult: (r: QuizResult | null) => void;

  // questions already shown on the current topic, so "more questions" rounds don't repeat them
  quizAsked: { topic: string; questions: string[] } | null;
  addQuizAsked: (topic: string, questions: string[]) => void;

  // custom subjects; saved on the account and pulled by AppShell while signed in (see lib/customSubjects)
  customSubjects: CustomSubject[];
  setCustomSubjects: (s: CustomSubject[]) => void;
  /** Account the local customSubjects were last loaded for; null = created here before they were saved to the account */
  customSubjectsOwner: string | null;

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

  // study timer, kept here so it keeps running across pages and reloads (see lib/studyTimer)
  studySession: StudySession | null;
  /** Kid whose timer stopped for inactivity; their next click starts it again */
  studyIdleKidId: string | null;
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
    (set, get) => ({
      lang: 'en',
      setLang: (lang) => {
        set((s) => ({ lang, studyParams: { ...s.studyParams, lang } }));
        const { account, isDemo } = get();
        if (account && !isDemo) {
          createClient().auth.updateUser({ data: { lang } }).catch((e) => console.warn('Could not save language:', e));
        }
      },

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

      importedLesson: null,
      setImportedLesson: (importedLesson) => set({ importedLesson }),

      quizResult: null,
      setQuizResult: (quizResult) => set({ quizResult }),

      quizAsked: null,
      addQuizAsked: (topic, questions) => set((s) => {
        const prev = s.quizAsked?.topic === topic ? s.quizAsked.questions : [];
        const merged = [...prev.filter((q) => !questions.includes(q)), ...questions].slice(-40);
        return { quizAsked: { topic, questions: merged } };
      }),

      customSubjects: [],
      setCustomSubjects: (customSubjects) => set({ customSubjects }),
      customSubjectsOwner: null,

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

      studySession: null,
      studyIdleKidId: null,
    }),
    { name: 'quizkids-store' }
  )
);
