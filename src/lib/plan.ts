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
export interface PlanOptions {
  /** Hand out again even if today already has items (used to regenerate the day) */
  force?: boolean;
  /** Items to leave out of this run */
  avoid?: Set<string>;
  /** Subjects the parent paused: they get no items, but keep their goals and queues */
  paused?: Set<string>;
}

export function planToday(items: PlanItem[], goals: KidGoal[], budgetMin: number, today: Date, opts: PlanOptions = {}): PlanChanges {
  const active = goals.filter((g) => g.status === 'active');
  const activeIds = new Set(active.map((g) => g.id));
  // Items a parent added by hand (no goal) are never cleaned up here
  const remove = items.filter((i) => i.status === 'pending' && i.goalId && !activeIds.has(i.goalId)).map((i) => i.id);

  const create: NewItem[] = [];
  active.forEach((g) => { if (!items.some((i) => i.goalId === g.id)) create.push(...buildQueue(g)); });

  const key = dateKey(today);
  const assign: string[] = [];
  const alreadyHanded = items.some((i) => i.goalId && i.planDate === key);
  if (!isWeekday(today) || (alreadyHanded && !opts.force)) return { create, assign, remove };

  // Queue per goal (existing pending items only; brand new queues are handed out on the next sync)
  const schedulable = active.filter((g) => !opts.paused?.has(g.subject));
  const pendingLeft = new Map<string, number>();
  const queues = schedulable.map((g) => {
    const all = items.filter((i) => i.goalId === g.id && i.status === 'pending').sort((a, b) => a.position - b.position);
    pendingLeft.set(g.id, all.length);
    return all.filter((i) => !opts.avoid?.has(i.id));
  });
  let used = 0;
  let picked = 0;
  let progressed = true;
  while (progressed) {
    progressed = false;
    for (const q of queues) {
      const next = q[0];
      if (!next) continue;
      // The final test waits until everything else in that goal is done
      if (next.type === 'test' && (pendingLeft.get(next.goalId!) || 0) > 1) continue;
      if (picked > 0 && used + next.minutes > budgetMin) continue;
      q.shift();
      pendingLeft.set(next.goalId!, (pendingLeft.get(next.goalId!) || 1) - 1);
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
    goalId: (r.goal_id as string) || undefined,
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

  const paused = new Set(subjects.filter((x) => x.paused).map((x) => x.subject));
  const c = planToday(items, goals, budget, today, { paused });
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
      const c2 = planToday(items, goals, budget, today, { paused });
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

export interface RegenResult { unassign: string[]; assign: string[] }

/**
 * Pure: picks a different set for today. Today's unfinished plan items go back to the queue and are left out of
 * this run, so the next items are handed out instead (the skipped ones come first tomorrow). Finished items stay
 * and count against the daily minutes. If nothing else is left, the same items are handed out again.
 */
export function regeneratePlan(items: PlanItem[], goals: KidGoal[], budgetMin: number, today: Date, paused: Set<string>): RegenResult {
  const key = dateKey(today);
  const todays = items.filter((i) => i.goalId && i.planDate === key);
  const unassign = todays.filter((i) => i.status === 'pending').map((i) => i.id);
  const usedMin = todays.filter((i) => i.status === 'completed').reduce((a, i) => a + i.minutes, 0);
  const left = budgetMin - usedMin;
  if (left <= 0 || unassign.length === 0) return { unassign: [], assign: [] };

  const back = items.map((i) => (unassign.includes(i.id) ? { ...i, planDate: undefined } : i));
  let assign = planToday(back, goals, left, today, { force: true, avoid: new Set(unassign), paused }).assign;
  if (assign.length === 0) assign = planToday(back, goals, left, today, { force: true, paused }).assign;
  return { unassign, assign };
}

/** Parent action: hand out a different set of items for today */
export async function regenerateToday(kid: Kid, isDemo: boolean, today = new Date()): Promise<PlanItem[]> {
  const budget = kid.goal_min || 30;
  const key = dateKey(today);
  let items: PlanItem[];
  let goals: KidGoal[];
  let paused: Set<string>;

  if (isDemo) {
    items = kid.planItems || [];
    goals = kid.goals || [];
    paused = new Set((kid.subjects || []).filter((x) => x.paused).map((x) => x.subject));
  } else {
    const supabase = createClient();
    const [g, s, p] = await Promise.all([
      supabase.from('kid_goals').select('*').eq('kid_id', kid.id),
      supabase.from('kid_subjects').select('*').eq('kid_id', kid.id),
      supabase.from('kid_plan_items').select('*').eq('kid_id', kid.id).order('position'),
    ]);
    goals = (g.data || []).map(goalFromRow);
    paused = new Set((s.data || []).map(fromRow).filter((x) => x.paused).map((x) => x.subject));
    items = (p.data || []).map(itemFromRow);
  }

  const r = regeneratePlan(items, goals, budget, today, paused);
  if (r.unassign.length === 0) return items;
  if (!isDemo) {
    const supabase = createClient();
    await supabase.from('kid_plan_items').update({ plan_date: null }).in('id', r.unassign);
    if (r.assign.length) await supabase.from('kid_plan_items').update({ plan_date: key }).in('id', r.assign);
  }
  return items.map((i) => (r.assign.includes(i.id) ? { ...i, planDate: key } : r.unassign.includes(i.id) ? { ...i, planDate: undefined } : i));
}

/** Parent action: add one item by hand to today's plan */
export async function addManualItem(kid: Kid, input: { subject: string; topic: string; type: 'guide' | 'quiz' | 'pdf' }, isDemo: boolean, today = new Date()): Promise<PlanItem | null> {
  const base = { subject: input.subject, topic: input.topic, type: input.type, position: 0, minutes: ITEM_MINUTES[input.type], planDate: dateKey(today), status: 'pending' as const };
  if (isDemo) return { id: 'demo-' + Math.random().toString(36).slice(2, 9), ...base };
  const { data, error } = await createClient().from('kid_plan_items').insert({
    kid_id: kid.id, goal_id: null, subject: base.subject, topic: base.topic, type: base.type, position: 0, minutes: base.minutes, plan_date: base.planDate,
  }).select('*').single();
  if (error || !data) { console.warn('Could not add item:', error); return null; }
  return itemFromRow(data);
}

/** Every plan item of a kid (for the parent's week view) */
export async function loadKidPlanItems(kidId: string): Promise<PlanItem[]> {
  const { data } = await createClient().from('kid_plan_items').select('*').eq('kid_id', kidId).order('position').limit(600);
  return (data || []).map(itemFromRow);
}
