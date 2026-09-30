import type { PlacementQuestion } from '@/types';
import { gradeToNumber } from './subjects';

export interface PlacementOutcome {
  level: number;
  accuracy: number;
  strongTopics: string[];
  weakTopics: string[];
}

const PASS = 0.67;

/** Turns the answers to a placement quiz into a grade-equivalent level plus strong / weak topics */
export function scorePlacement(questions: PlacementQuestion[], picks: Record<number, number>, grade: string): PlacementOutcome {
  const bands: Record<number, { right: number; total: number }> = { [-1]: { right: 0, total: 0 }, 0: { right: 0, total: 0 }, 1: { right: 0, total: 0 } };
  const topics = new Map<string, { right: number; total: number }>();
  let right = 0;

  questions.forEach((q, i) => {
    const ok = picks[i] === q.a;
    if (ok) right += 1;
    const b = bands[q.band] || bands[0];
    b.total += 1;
    if (ok) b.right += 1;
    const t = topics.get(q.topic) || { right: 0, total: 0 };
    t.total += 1;
    if (ok) t.right += 1;
    topics.set(q.topic, t);
  });

  const pass = (band: number) => bands[band].total > 0 && bands[band].right / bands[band].total >= PASS;
  const offset = pass(1) ? 1 : pass(0) ? 0 : pass(-1) ? -1 : -2;
  const level = Math.max(0, gradeToNumber(grade) + offset);

  const strongTopics: string[] = [];
  const weakTopics: string[] = [];
  topics.forEach((v, name) => {
    const pct = v.right / v.total;
    if (pct >= PASS) strongTopics.push(name);
    else if (pct < 0.5) weakTopics.push(name);
  });

  return { level, accuracy: questions.length ? Math.round((right / questions.length) * 100) : 0, strongTopics, weakTopics };
}
