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
  goals?: KidGoal[];
  /** Demo mode only: plan items are kept locally instead of in Supabase */
  planItems?: PlanItem[];
  created_at?: string;
}

/** A study timer in progress. Times are epoch ms so it keeps counting across page changes and reloads. */
export interface StudySession {
  kidId: string;
  startedAt: number;
  /** When the current running stretch began; null while paused */
  runningSince: number | null;
  /** Time counted before the current running stretch */
  accumulatedMs: number;
  lastActivityAt: number;
  /** study_sessions row the time is saved to while it runs */
  dbId?: string;
  savedAt?: number;
  savedMinutes?: number;
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

/** One block of a printable worksheet; each type prints differently */
export type WorksheetSection =
  | { type: 'mc'; items: { q: string; choices: string[]; a: number }[] }
  /** fix: the corrected statement, for false items (answer key) */
  | { type: 'tf'; items: { s: string; a: boolean; fix?: string }[] }
  /** Each sentence has one "___" blank; bank lists the words to pick from (answers + a few extras) */
  | { type: 'fill'; bank?: string[]; items: { s: string; a: string }[] }
  /** Pairs in their correct order; the right column is shuffled when printed */
  | { type: 'match'; items: { left: string; right: string }[] }
  /** Explain / short answer with writing lines; a = sample answer for the key */
  | { type: 'open'; items: { q: string; a: string; lines: number }[] };

export type WorksheetSectionType = WorksheetSection['type'];

export interface Worksheet {
  sections: WorksheetSection[];
  bonus: string;
  /** Format version; old cached worksheets ({ questions, bonus }) have none */
  v?: number;
}

export interface QuizResult {
  total: number;
  correct: number;
  picks: Record<number, number>;
  cards: QuizQuestion[];
  stars: number;
  /** generated_content id of these cards, so "try again" can replay them */
  contentId?: string;
  /** A "more questions" round: new questions on the same topic */
  more?: boolean;
}

export interface GuideSection {
  title: string;
  body: string;
  tone: string;
  key: string;
  /** Worked problem or everyday example for the section */
  example?: string;
}

export interface Guide {
  intro: string;
  sections: GuideSection[];
  fact: string;
  vocab?: { term: string; def: string }[];
  recap?: string[];
  /** Related ideas the kid can ask to learn more about */
  related?: string[];
  /** Prompt version; older cached guides have none */
  v?: number;
}

export interface StudyParams {
  subject: string;
  topic: string;
  grade: string;
  difficulty: 'easy' | 'medium' | 'hard';
  lang: 'en' | 'es';
  contentId?: string;
  assignmentId?: string;
  /** Set when the item comes from the daily plan, so finishing it can tick it off */
  planItemId?: string;
  /** Language of the content when it differs from the account language (per-subject language) */
  contentLang?: Lang | 'fr';
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
  /** When the level was last adjusted from quiz results */
  levelUpdatedAt?: string;
  /** Left out of the daily plan while true */
  paused?: boolean;
}

/** band: -1 = below the kid's grade, 0 = at grade, 1 = above grade */
export interface PlacementQuestion extends QuizQuestion {
  band: -1 | 0 | 1;
  topic: string;
}

export interface KidGoal {
  id: string;
  subject: string;
  title: string;
  description?: string;
  /** Ordered topic names the goal covers; quiz results on these topics drive progress */
  topics: string[];
  weeks?: number;
  targetDate?: string;
  /** proposed = waiting for the parent to approve */
  status: 'proposed' | 'active' | 'completed';
  createdAt?: string;
  completedAt?: string;
}

export interface GoalDraft {
  title: string;
  description?: string;
  topics: string[];
  weeks?: number;
}

export type PlanItemType = 'guide' | 'quiz' | 'pdf' | 'test';

export interface PlanItem {
  id: string;
  /** Undefined for items a parent added by hand */
  goalId?: string;
  subject: string;
  topic: string;
  type: PlanItemType;
  position: number;
  minutes: number;
  /** yyyy-mm-dd of the weekday it was handed out for; undefined = still queued */
  planDate?: string;
  contentId?: string;
  /** Extra practice added because of a weak result (or a retake) */
  review?: boolean;
  status: 'pending' | 'completed' | 'skipped';
}
