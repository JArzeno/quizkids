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
  plan: 'free' | 'family';
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

export type Lang = 'en' | 'es';
