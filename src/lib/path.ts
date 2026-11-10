import type { GameMode } from '@/lib/games';
import type { KidTopic } from '@/types';

/**
 * "My path": the kid's classes turned into levels, across every subject. Level 1 sits at the bottom and new levels
 * stack on top. Each level is one game about one class the parent added (never an invented topic).
 *
 * Nothing extra is stored: a level is passed when quiz_results holds a good enough round of that game on that class,
 * so the path is the same on every device. A few levels open each day, so the path keeps growing over the days.
 */

/** New levels a kid can pass in one day; the next one opens tomorrow */
export const LEVELS_PER_DAY = 3;
/** Score that passes a level: the same bar as the key on a subject's own path */
export const PASS_PCT = 70;
/** Levels shown above the current one, still closed */
const AHEAD = 2;
/** Each class comes back once per game, in this order, then the cycle repeats */
const MODE_ORDER: GameMode[] = ['tf', 'fill', 'flip'];
const MAX_PASSES = 30;

export interface LevelResult {
  subject: string | null;
  topic: string | null;
  /** 'tf' | 'fill' for the quick games, easy/medium/hard for the flip cards */
  difficulty: string | null;
  total: number | null;
  correct: number | null;
  stars: number | null;
  created_at: string;
}

export type LevelState = 'done' | 'current' | 'locked' | 'tomorrow';

export interface Level {
  n: number;
  subject: string;
  topic: KidTopic;
  mode: GameMode;
  state: LevelState;
  /** Stars of the round that passed it */
  stars: number;
}

export interface LevelPath {
  /** Bottom to top: every passed level, then the current one and the next few */
  levels: Level[];
  doneToday: number;
  totalDone: number;
  /** Every level of every class has been passed */
  finished: boolean;
}

const norm = (s: string) => s.trim().toLowerCase();
const modeOf = (r: LevelResult): GameMode => (r.difficulty === 'tf' || r.difficulty === 'fill' ? r.difficulty : 'flip');
const sameDay = (iso: string, day: Date) => {
  const d = new Date(iso);
  return d.getFullYear() === day.getFullYear() && d.getMonth() === day.getMonth() && d.getDate() === day.getDate();
};

/** Pure: no I/O. `topics` are the classes of the subjects in play; `results` every round the kid has finished. */
export function buildLevels(topics: KidTopic[], results: LevelResult[], now: Date): LevelPath {
  // Oldest class first, so the path starts with what was taught first
  const order = [...topics].sort((a, b) => ((a.createdAt || '') < (b.createdAt || '') ? -1 : (a.createdAt || '') > (b.createdAt || '') ? 1 : 0));

  // Rounds that pass a level, oldest first, by class and game
  const passed = new Map<string, LevelResult[]>();
  results
    .filter((r) => r.subject && r.topic && (r.total || 0) > 0 && ((r.correct || 0) / (r.total || 1)) * 100 >= PASS_PCT)
    .sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
    .forEach((r) => {
      const key = `${r.subject}|${norm(r.topic!)}|${modeOf(r)}`;
      passed.set(key, [...(passed.get(key) || []), r]);
    });

  const done: { topic: KidTopic; mode: GameMode; at: string; stars: number }[] = [];
  const open: { topic: KidTopic; mode: GameMode }[] = [];
  for (let pass = 0; pass < MAX_PASSES && open.length <= AHEAD; pass++) {
    const mode = MODE_ORDER[pass % MODE_ORDER.length];
    const nth = Math.floor(pass / MODE_ORDER.length);
    for (const topic of order) {
      const hit = passed.get(`${topic.subject}|${norm(topic.title)}|${mode}`)?.[nth];
      if (hit) done.push({ topic, mode, at: hit.created_at, stars: hit.stars || 0 });
      else open.push({ topic, mode });
    }
  }
  done.sort((a, b) => (a.at < b.at ? -1 : 1));

  const doneToday = done.filter((d) => sameDay(d.at, now)).length;
  const levels: Level[] = done.map((d, i) => ({ n: i + 1, subject: d.topic.subject, topic: d.topic, mode: d.mode, state: 'done', stars: d.stars }));
  open.slice(0, AHEAD + 1).forEach((o, i) => {
    const state: LevelState = i > 0 ? 'locked' : doneToday >= LEVELS_PER_DAY ? 'tomorrow' : 'current';
    levels.push({ n: done.length + i + 1, subject: o.topic.subject, topic: o.topic, mode: o.mode, state, stars: 0 });
  });

  return { levels, doneToday, totalDone: done.length, finished: order.length > 0 && open.length === 0 };
}
