export interface Kid {
  id: string;
  parent_id: string;
  name: string;
  grade: string;
  avatar: string;
  color: string;
  code: string;
  goal_min: number;
  streak: number;
  stars: number;
  minutes_total: number;
  seconds_today?: number;
  today_date?: string;
  signature?: string;
  weekly?: number;
  lastSubject?: string;
  recent?: RecentItem[];
  created_at?: string;
}

export interface RecentItem {
  kind: 'quiz' | 'guide' | 'pdf';
  title: string;
  when: string;
  score: number;
  subject?: string;
  contentId?: string;
  assignmentId?: string;
  status?: 'pending' | 'completed';
}

export interface Assignment {
  id: string;
  kid_id: string;
  content_id: string | null;
  subject: string;
  topic: string;
  grade: string;
  type: 'quiz' | 'guide' | 'pdf';
  status: 'pending' | 'completed';
  assigned_at: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  parent_prefs: ParentPrefs;
  parent_pin: string;
  plan_cycle: 'monthly' | 'yearly';
}

export interface ParentPrefs {
  role?: string;
  kidsCount?: number;
  langs?: string[];
  where?: string[];
  goalMin?: number;
  reminders?: boolean;
  reminderAt?: string;
  sound?: boolean;
  pinFor?: { settings?: boolean; create?: boolean; exitKid?: boolean };
}

export interface QuizQuestion {
  q: string;
  choices: string[];
  a: number;
  hint: string;
}

export interface QuizResult {
  total: number;
  correct: number;
  picks: Record<number, number>;
  cards: QuizQuestion[];
  stars: number;
  /** wall-clock seconds the kid spent on this round */
  seconds?: number;
}

export interface GuideSection {
  title: string;
  body: string;
  tone: string;
  key: string;
}

export interface Guide {
  intro: string;
  sections: GuideSection[];
  fact: string;
}

export interface StudyParams {
  subject: string;
  topic: string;
  grade: string;
  difficulty: 'easy' | 'medium' | 'hard';
  lang: 'en' | 'es';
  contentId?: string;
  assignmentId?: string;
}

export type StudyActivity = 'quiz' | 'guide' | 'pdf' | 'free';

/** One finished chunk of study time. Mirrors a row of public.study_sessions. */
export interface TimeLogEntry {
  id: string;
  kid_id: string;
  started_at: string;
  ended_at: string;
  seconds: number;
  minutes: number;
  subject?: string | null;
  topic?: string | null;
  activity?: StudyActivity | string | null;
  /** true when the row only exists locally (demo mode or Supabase unavailable) */
  local?: boolean;
}

export interface StudySuggestion {
  subject: string;
  topic: string;
  reason: string;
}

export interface GuideExtra {
  title: string;
  body: string;
  examples?: string[];
  vocab?: Array<{ term: string; meaning: string }>;
  chart?: {
    title: string;
    caption?: string;
    unit?: string;
    kind?: 'bar' | 'line';
    points: Array<{ label: string; value: number }>;
  };
}

export type Lang = 'en' | 'es';
