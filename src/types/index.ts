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
  subjects?: KidSubject[];
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
  /** Study notes extracted from an imported class (PDF / photos); grounds generation in that material */
  source?: string;
}

export interface ImportedLesson {
  title: string;
  subject: string;
  summary: string;
  keyPoints: string[];
  vocabulary: { term: string; def: string }[];
  notes: string;
}

export type Lang = 'en' | 'es';

/** A subject a kid studies, with the result of its placement quiz once taken */
export interface KidSubject {
  subject: string;
  /** Language the subject is studied in */
  lang?: 'en' | 'es' | 'fr';
  focus?: string;
  /** Estimated grade level for this subject (0 = K); undefined until placement is taken */
  level?: number;
  strongTopics?: string[];
  weakTopics?: string[];
  placementAccuracy?: number;
  placedAt?: string;
}

/** band: -1 = below the kid's grade, 0 = at grade, 1 = above grade */
export interface PlacementQuestion extends QuizQuestion {
  band: -1 | 0 | 1;
  topic: string;
}
