import { MASTERY } from '@/lib/goals';
import type { TopicRow } from '@/lib/topics';

/** Stars of a level, from the best score on its topic: none until it is passed, 3 for a (nearly) perfect round */
export const levelStars = (bestPct: number | null): 0 | 1 | 2 | 3 => (bestPct == null || bestPct < MASTERY ? 0 : bestPct >= 95 ? 3 : bestPct >= 80 ? 2 : 1);

export interface Level {
  /** 1, 2, 3… in the order the parent added the topics */
  n: number;
  title: string;
  row: TopicRow;
  stars: 0 | 1 | 2 | 3;
  /** Passed at least once (best score ≥ 70%): its key is kept even if a later round goes worse */
  cleared: boolean;
  /** done = passed · current = the one to play next · open = started earlier, not passed yet · locked = needs the key of the level before */
  state: 'done' | 'current' | 'open' | 'locked';
}

/**
 * A subject as a path of levels: one per topic the parent added, oldest first (`rows` come newest first from
 * subjectTopics), then goal-only topics. Passing a level gives the key to the next one; a level the kid already
 * played stays open. Pure: no I/O.
 */
export function buildLevels(rows: TopicRow[]): Level[] {
  const ordered = [...rows.filter((r) => r.topic).reverse(), ...rows.filter((r) => !r.topic)];
  let prevCleared = true;
  let currentTaken = false;
  return ordered.map((row, i) => {
    const cleared = row.bestPct != null && row.bestPct >= MASTERY;
    const open = prevCleared || row.attempts > 0;
    let state: Level['state'] = 'locked';
    if (cleared) state = 'done';
    else if (open) { state = currentTaken ? 'open' : 'current'; currentTaken = true; }
    prevCleared = cleared;
    return { n: i + 1, title: row.title, row, stars: levelStars(row.bestPct), cleared, state };
  });
}
