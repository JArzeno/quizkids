import { createClient } from '@/lib/supabase/client';
import { goalFromRow } from '@/lib/goals';
import { fromRow, gradeToNumber } from '@/lib/subjects';
import { adaptQueue, latestAccuracy, nextSubjectState, type ResultRow } from '@/lib/adapt';
import type { Kid, KidGoal, KidSubject, PlanItem, PlanItemType } from '@/types';

export const ITEM_MINUTES: Record<PlanItemType, number> = { guide: 8, quiz: 6, pdf: 10, test: 10 };

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function isWeekday(d: Date): boolean {
  const day = d.getDay();
  return day >= 1 && day <= 5;
}

type NewItem = Omit<PlanItem, 'id'>;

/** The whole queue for a goal: guide → quiz → worksheet for every topic, then one final test */
export function buildQueue(goal: KidGoal): NewItem[] {
  const items: NewItem[] = [];
  const add = (topic: string, type: PlanItemType) =>
    items.push({ goalId: goal.id, subject: goal.subject, topic, type, position: items.length, minutes: ITEM_MINUTES[type], status: 'pending' });
  goal.topics.forEach((topic) => { add(topic, 'guide'); add(topic, 'quiz'); add(topic, 'pdf'); });
  add(goal.title, 'test');
  return items;
}

export interface PlanChanges {
  create: NewItem[];
  /** ids to hand out for today */
  assign: string[];
  /** ids of queued items whose goal is no longer active */
  remove: string[];
}

/**
 * Decides what today's plan is. Pure: no I/O.
 * - every active goal gets a queue the first time it is seen
 * - the plan is handed out once per weekday, round robin across goals, up to the daily minutes
 * - anything not finished simply stays at the front of its goal's queue, so missed days roll over
 * - a goal's final test is only handed out once everything else in that goal is done
 */
export function planToday(items: PlanItem[], goals: KidGoal[], budgetMin: number, today: Date): PlanChanges {
  const active = goals.filter((g) => g.status === 'active');
  const activeIds = new Set(active.map((g) => g.id));
  const remove = items.filter((i) => i.status === 'pending' && !activeIds.has(i.goalId)).map((i) => i.id);

  const create: NewItem[] = [];
  active.forEach((g) => { if (!items.some((i) => i.goalId === g.id)) create.push(...buildQueue(g)); });

  const key = dateKey(today);
  const assign: string[] = [];
  if (!isWeekday(today) || items.some((i) => i.planDate === key)) return { create, assign, remove };

  // Queue per goal (existing pending items only; brand new queues are handed out on the next sync)
  const queues = active.map((g) => items.filter((i) => i.goalId === g.id && i.status === 'pending').sort((a, b) => a.position - b.position));
  let used = 0;
  let picked = 0;
  let progressed = true;
  while (progressed) {
    progressed = false;
    for (const q of queues) {
      const next = q[0];
      if (!next) continue;
      const isTest = next.type === 'test';
      // The final test waits until everything else in that goal is done
      if (isTest && q.length > 1) continue;
      if (picked > 0 && used + next.minutes > budgetMin) continue;
      q.shift();
      assign.push(next.id);
      used += next.minutes;
      picked += 1;
      progressed = true;
    }
    if (used >= budgetMin) break;
  }
  return { create, assign, remove };
}

function itemFromRow(r: Record<string, unknown>): PlanItem {
  return {
    id: r.id as string,
    goalId: r.goal_id as string,
    subject: r.subject as string,
    topic: r.topic as string,
    type: r.type as PlanItemType,
    position: Number(r.position),
    minutes: (r.minutes as number) || 8,
    planDate: (r.plan_date as string) || undefined,
    contentId: (r.content_id as string) || undefined,
    review: (r.review as boolean) || undefined,
    status: (r.status as PlanItem['status']) || 'pending',
  };
}

export interface TodayPlan {
  items: PlanItem[];
  goals: KidGoal[];
  subjects: KidSubject[];
  results: ResultRow[];
}

/** Loads goals + subjects + plan items, creates/hands out what is missing, and returns everything fresh */
export async function syncTodayPlan(kid: Kid, isDemo: boolean, today = new Date()): Promise<TodayPlan> {
  const budget = kid.goal_min || 30;

  if (isDemo) {
    const goals = kid.goals || [];
    const items = kid.planItems || [];
    const key = dateKey(today);
    let next = items;
    // Two passes: the first creates fresh queues, the second hands out today's items from them
    for (let pass = 0; pass < 2; pass++) {
      const c = planToday(next, goals, budget, today);
      next = next.filter((i) => !c.remove.includes(i.id));
      next = [...next, ...c.create.map((n) => ({ ...n, id: 'demo-' + Math.random().toString(36).slice(2, 9) }))];
      next = next.map((i) => (c.assign.includes(i.id) ? { ...i, planDate: key } : i));
    }
    return { items: next, goals, subjects: kid.subjects || [], results: [] };
  }

  const supabase = createClient();
  const [g, s, p, q] = await Promise.all([
    supabase.from('kid_goals').select('*').eq('kid_id', kid.id).order('created_at'),
    supabase.from('kid_subjects').select('*').eq('kid_id', kid.id).order('created_at'),
    supabase.from('kid_plan_items').select('*').eq('kid_id', kid.id).order('position'),
    supabase.from('quiz_results').select('subject, topic, correct, total, created_at').eq('kid_id', kid.id).order('created_at', { ascending: false }).limit(500),
  ]);
  const goals = (g.data || []).map(goalFromRow);
  let subjects = (s.data || []).map(fromRow);
  let items = (p.data || []).map(itemFromRow);
  const results = (q.data || []) as ResultRow[];

  // 1. Learn from results: keep each subject's level and strong / weak topics current
  const gradeNum = gradeToNumber(kid.grade);
  const updated: KidSubject[] = [];
  subjects = subjects.map((ks) => {
    const { next, changed } = nextSubjectState(ks, results, gradeNum);
    if (changed) updated.push(next);
    return next;
  });
  for (const ks of updated) {
    await supabase.from('kid_subjects').update({
      level: ks.level ?? null, strong_topics: ks.strongTopics ?? [], weak_topics: ks.weakTopics ?? [], level_updated_at: ks.levelUpdatedAt ?? null,
    }).eq('kid_id', kid.id).eq('subject', ks.subject);
  }

  // 2. Adjust the queues: skip what is mastered, add review after weak results, retake after a failed test
  const adj = adaptQueue(items, goals, results);
  if (adj.skip.length) await supabase.from('kid_plan_items').update({ status: 'skipped' }).in('id', adj.skip);
  if (adj.insert.length) {
    const { error } = await supabase.from('kid_plan_items').insert(
      adj.insert.map((n) => ({ kid_id: kid.id, goal_id: n.goalId, subject: n.subject, topic: n.topic, type: n.type, position: n.position, minutes: n.minutes, review: !!n.review })),
    );
    if (error && error.code !== '23505') console.warn('Could not add review items:', error);
  }
  if (adj.skip.length || adj.insert.length) {
    const fresh = await supabase.from('kid_plan_items').select('*').eq('kid_id', kid.id).order('position');
    items = (fresh.data || []).map(itemFromRow);
  }

  const c = planToday(items, goals, budget, today);
  const key = dateKey(today);

  if (c.remove.length) await supabase.from('kid_plan_items').delete().in('id', c.remove);
  if (c.create.length) {
    const { error } = await supabase.from('kid_plan_items').insert(
      c.create.map((n) => ({ kid_id: kid.id, goal_id: n.goalId, subject: n.subject, topic: n.topic, type: n.type, position: n.position, minutes: n.minutes })),
    );
    // A unique violation means another tab created the same queue first; the refetch below picks it up
    if (error && error.code !== '23505') console.warn('Could not create plan items:', error);
  }
  if (c.assign.length) await supabase.from('kid_plan_items').update({ plan_date: key }).in('id', c.assign);

  if (c.remove.length || c.create.length || c.assign.length) {
    const fresh = await supabase.from('kid_plan_items').select('*').eq('kid_id', kid.id).order('position');
    items = (fresh.data || []).map(itemFromRow);
    // Fresh queues were just created; hand out today's items from them
    if (c.create.length && !items.some((i) => i.planDate === key)) {
      const c2 = planToday(items, goals, budget, today);
      if (c2.assign.length) {
        await supabase.from('kid_plan_items').update({ plan_date: key }).in('id', c2.assign);
        items = items.map((i) => (c2.assign.includes(i.id) ? { ...i, planDate: key } : i));
      }
    }
  }
  return { items, goals, subjects, results };
}

/** Difficulty for generated quizzes: easier when the placement level is below the kid's grade */
export function difficultyFor(kid: Kid, subject: KidSubject | undefined): 'easy' | 'medium' | 'hard' {
  if (subject?.level == null) return 'medium';
  const grade = gradeToNumber(kid.grade);
  return subject.level < grade ? 'easy' : subject.level > grade ? 'hard' : 'medium';
}

const ROUTE: Record<PlanItemType, string> = { guide: '/api/generate/guide', quiz: '/api/generate/quiz', pdf: '/api/generate/worksheet', test: '/api/generate/quiz' };

/** Generates (or fetches cached) content for one plan item and stores its content id */
export async function prepareItem(kid: Kid, item: PlanItem, subject: KidSubject | undefined, isDemo: boolean, fallbackLang: string, results: ResultRow[] = []): Promise<PlanItem> {
  if (item.contentId) return item;
  try {
    const res = await fetch(ROUTE[item.type], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: item.topic,
        grade: kid.grade,
        lang: subject?.lang || fallbackLang,
        subject: item.subject,
        difficulty: item.type === 'test' ? (item.review ? 'medium' : 'hard') : item.review ? 'easy' : difficultyFor(kid, subject),
        // Review material and retakes are personalised (and never taken from the shared cache)
        ...(item.review ? {
          variant: item.id,
          context: { level: subject?.level, weak: subject?.weakTopics, strong: subject?.strongTopics, lastScore: latestAccuracy(results, item.subject, item.topic) ?? undefined, review: true },
        } : {}),
      }),
    });
    if (!res.ok) return item;
    const data = await res.json();
    if (!data.contentId) return item;
    if (!isDemo) await createClient().from('kid_plan_items').update({ content_id: data.contentId }).eq('id', item.id);
    return { ...item, contentId: data.contentId };
  } catch {
    return item;
  }
}

/** Marks a plan item as done (called when the kid finishes it) */
export async function completePlanItem(id: string, isDemo: boolean) {
  if (isDemo || id.startsWith('demo-')) return;
  await createClient().from('kid_plan_items').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', id);
}
