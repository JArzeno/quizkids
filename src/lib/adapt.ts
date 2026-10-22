import type { KidGoal, KidSubject, PlanItem } from '@/types';

export interface ResultRow {
  subject: string | null;
  topic: string | null;
  correct: number | null;
  total: number | null;
  created_at: string;
}

type NewItem = Omit<PlanItem, 'id'>;

export const MASTERED = 90;   // at or above: the topic needs nothing more
export const WEAK = 60;       // below: the topic gets review practice
export const TEST_PASS = 70;  // final test pass mark
const MAX_REVIEW_ROUNDS = 2;  // review rounds per topic
const MAX_TESTS = 4;          // first test + 3 retakes

const norm = (s: string) => s.trim().toLowerCase();
const pct = (r: ResultRow) => ((r.correct || 0) / (r.total || 1)) * 100;

function rowsFor(results: ResultRow[], subject: string, topic: string) {
  return results.filter((r) => r.subject === subject && r.topic && norm(r.topic) === norm(topic) && (r.total || 0) > 0)
    .sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
}

/** Accuracy on the most recent attempt at a topic, or null if never attempted */
export function latestAccuracy(results: ResultRow[], subject: string, topic: string): number | null {
  const rows = rowsFor(results, subject, topic);
  return rows.length ? Math.round(pct(rows[rows.length - 1])) : null;
}

export interface QueueAdjustments {
  /** ids of pending items that are no longer needed */
  skip: string[];
  insert: NewItem[];
}

/**
 * Adjusts the queues of active goals to how the kid is really doing. Pure: no I/O. Idempotent: running it
 * twice on the same data never adds the same review twice.
 * - a topic at 90%+ has its remaining items skipped (mastered)
 * - a topic under 60% after its quiz gets a worksheet + an easier quiz right after it (max 2 rounds)
 * - a failed final test (under 70%) queues review for the weakest topics, then a new test (max 3 retakes)
 */
export function adaptQueue(items: PlanItem[], goals: KidGoal[], results: ResultRow[]): QueueAdjustments {
  const skip = new Set<string>();
  const insert: NewItem[] = [];

  for (const g of goals.filter((x) => x.status === 'active')) {
    const mine = items.filter((i) => i.goalId === g.id);
    if (mine.length === 0) continue;
    const maxPos = () => Math.max(...mine.map((i) => i.position), ...insert.filter((n) => n.goalId === g.id).map((n) => n.position));
    const mk = (topic: string, type: PlanItem['type'], position: number, minutes: number): NewItem =>
      ({ goalId: g.id, subject: g.subject, topic, type, position: Math.round(position * 100) / 100, minutes, status: 'pending', review: true });

    for (const topic of g.topics) {
      const latest = latestAccuracy(results, g.subject, topic);
      if (latest == null) continue;
      const ofTopic = mine.filter((i) => i.topic === topic);
      const pending = ofTopic.filter((i) => i.status === 'pending');

      if (latest >= MASTERED) {
        pending.forEach((i) => skip.add(i.id));
        continue;
      }
      if (latest < WEAK) {
        const regularQuizzes = ofTopic.filter((i) => i.type === 'quiz' && !i.review);
        const quizTaken = regularQuizzes.length > 0 && regularQuizzes.every((i) => i.status === 'completed');
        const reviewQuizzes = ofTopic.filter((i) => i.type === 'quiz' && i.review);
        const reviewOpen = ofTopic.some((i) => i.review && i.status === 'pending');
        if (quizTaken && !reviewOpen && reviewQuizzes.length < MAX_REVIEW_ROUNDS) {
          // Fractional positions put the review right after the topic's quiz, before the rest of the queue
          const base = Math.max(...regularQuizzes.map((i) => i.position));
          const used = mine.filter((i) => i.position > base && i.position < base + 1).length + insert.filter((n) => n.goalId === g.id && n.position > base && n.position < base + 1).length;
          insert.push(mk(topic, 'pdf', base + 0.1 * (used + 1), 10));
          insert.push(mk(topic, 'quiz', base + 0.1 * (used + 2), 6));
        }
      }
    }

    // Failed final test: nothing left to do in the goal, and the last test was under the pass mark
    const tests = mine.filter((i) => i.type === 'test');
    const nothingPending = mine.every((i) => i.status !== 'pending' || skip.has(i.id));
    const topicReviewsAdded = insert.some((n) => n.goalId === g.id);
    if (tests.length > 0 && tests.length < MAX_TESTS && nothingPending) {
      const lastTest = latestAccuracy(results, g.subject, g.title);
      if (lastTest != null && lastTest < TEST_PASS && tests.every((t) => t.status === 'completed')) {
        // Topics that just got a review round already have practice queued; otherwise queue it for the weakest two
        const scored = topicReviewsAdded ? [] : g.topics.map((t) => ({ t, acc: latestAccuracy(results, g.subject, t) ?? 100 })).sort((a, b) => a.acc - b.acc);
        const weakest = (scored.filter((x) => x.acc < TEST_PASS).length ? scored.filter((x) => x.acc < TEST_PASS) : scored).slice(0, 2);
        let pos = Math.floor(maxPos());
        weakest.forEach(({ t }) => {
          insert.push(mk(t, 'pdf', ++pos, 10));
          insert.push(mk(t, 'quiz', ++pos, 6));
        });
        insert.push(mk(g.title, 'test', ++pos, 10));
      }
    }
  }
  return { skip: Array.from(skip), insert };
}

const LEVEL_WINDOW = 8;
const LEVEL_MIN_RESULTS = 5;

/**
 * Updates a subject's estimated level and strong/weak topics from quiz results.
 * Level moves one step at a time, only after at least 5 new results: 85%+ average goes up (at most 2 above the
 * kid's grade), under 50% goes down (never below K).
 */
export function nextSubjectState(ks: KidSubject, results: ResultRow[], gradeNum: number, now = new Date()): { next: KidSubject; changed: boolean } {
  const mine = results.filter((r) => r.subject === ks.subject && (r.total || 0) > 0).sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
  let next = { ...ks };
  let changed = false;

  // Level: only results after the last adjustment (or the placement quiz) count
  const since = ks.levelUpdatedAt || ks.placedAt || '';
  const recent = mine.filter((r) => r.created_at > since).slice(-LEVEL_WINDOW);
  if (recent.length >= LEVEL_MIN_RESULTS) {
    const avg = recent.reduce((a, r) => a + pct(r), 0) / recent.length;
    const cur = ks.level ?? gradeNum;
    const lvl = avg >= 85 ? Math.min(cur + 1, gradeNum + 2) : avg < 50 ? Math.max(cur - 1, 0) : cur;
    if (lvl !== cur || ks.level == null) {
      next = { ...next, level: lvl, levelUpdatedAt: now.toISOString() };
      changed = true;
    } else if (lvl === cur && (avg >= 85 || avg < 50)) {
      // At the cap: restart the window so we don't re-evaluate the same results forever
      next = { ...next, levelUpdatedAt: now.toISOString() };
      changed = true;
    }
  }

  // Strong / weak topics from everything the kid has done in this subject (results override placement)
  const byTopic = new Map<string, number[]>();
  mine.forEach((r) => { if (r.topic) byTopic.set(r.topic, [...(byTopic.get(r.topic) || []), pct(r)]); });
  if (byTopic.size > 0) {
    const strong = new Set(ks.strongTopics || []);
    const weak = new Set(ks.weakTopics || []);
    byTopic.forEach((v, topic) => {
      const avg = v.reduce((a, b) => a + b, 0) / v.length;
      if (avg >= 85) { weak.delete(topic); strong.add(topic); }
      else if (avg < WEAK) { strong.delete(topic); weak.add(topic); }
      else { strong.delete(topic); weak.delete(topic); }
    });
    const s = Array.from(strong).slice(0, 12);
    const w = Array.from(weak).slice(0, 12);
    if (s.join('|') !== (ks.strongTopics || []).join('|') || w.join('|') !== (ks.weakTopics || []).join('|')) {
      next = { ...next, strongTopics: s, weakTopics: w };
      changed = true;
    }
  }
  return { next, changed };
}
