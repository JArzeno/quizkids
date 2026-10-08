import { createClient } from '@/lib/supabase/client';
import { subjectPromptName } from '@/lib/subjects';
import type { GoalDraft, Kid, KidGoal } from '@/types';

export const MASTERY = 70;

export function goalFromRow(r: Record<string, unknown>): KidGoal {
  return {
    id: r.id as string,
    subject: r.subject as string,
    title: r.title as string,
    description: (r.description as string) || undefined,
    topics: (r.topics as string[]) || [],
    weeks: (r.weeks as number) ?? undefined,
    targetDate: (r.target_date as string) || undefined,
    status: r.status as KidGoal['status'],
    createdAt: r.created_at as string,
    completedAt: (r.completed_at as string) || undefined,
  };
}

interface QuizLike { subject: string | null; topic: string | null; correct: number | null; total: number | null; created_at?: string }

const norm = (s: string) => s.trim().toLowerCase();

/** A goal topic counts as mastered when the kid's most recent quiz on it (in this subject) is at least 70%, so review can lift a weak start */
export function goalProgress(goal: KidGoal, quizzes: QuizLike[]): { pct: number; mastered: string[]; testPassed: boolean; testAttempted: boolean } {
  const mastered = goal.topics.filter((topic) => {
    const rows = quizzes.filter((q) => q.subject === goal.subject && q.topic && norm(q.topic) === norm(topic) && (q.total || 0) > 0)
      .sort((a, b) => (a.created_at! < b.created_at! ? -1 : 1));
    if (rows.length === 0) return false;
    const last = rows[rows.length - 1];
    return ((last.correct || 0) / (last.total || 1)) * 100 >= MASTERY;
  });
  // The final test in the daily plan is a quiz named after the goal itself
  const tests = quizzes.filter((q) => q.subject === goal.subject && q.topic && norm(q.topic) === norm(goal.title) && (q.total || 0) > 0);
  const testPassed = tests.some((q) => ((q.correct || 0) / (q.total || 1)) * 100 >= MASTERY);
  return { pct: goal.topics.length ? Math.round((mastered.length / goal.topics.length) * 100) : 0, mastered, testPassed, testAttempted: tests.length > 0 };
}

/** Asks the AI for the next goal for a subject (nothing is saved) */
export async function requestGoalDraft(kid: Kid, subject: string, lang: string, custom: Array<{ id: string; name: string; icon: string }>): Promise<GoalDraft | null> {
  const ks = kid.subjects?.find((s) => s.subject === subject);
  try {
    const res = await fetch('/api/generate/goal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: subjectPromptName(subject, custom),
        grade: kid.grade,
        level: ks?.level,
        focus: ks?.focus,
        strong: ks?.strongTopics,
        weak: ks?.weakTopics,
        done: (kid.goals || []).filter((g) => g.subject === subject && g.status === 'completed').map((g) => g.title),
        lang: ks?.lang || lang,
      }),
    });
    if (!res.ok) return null;
    return (await res.json()) as GoalDraft;
  } catch {
    return null;
  }
}

/** Saves a goal for a kid. A proposed goal replaces any earlier proposed one for that subject. */
export async function saveGoal(kidId: string, subject: string, draft: GoalDraft, status: 'proposed' | 'active', isDemo: boolean, existing: KidGoal[]): Promise<KidGoal | null> {
  const now = new Date();
  const targetDate = status === 'active' && draft.weeks ? new Date(now.getTime() + draft.weeks * 7 * 86400000).toISOString().slice(0, 10) : undefined;
  const base = { title: draft.title, description: draft.description, topics: draft.topics, weeks: draft.weeks, targetDate, status };

  if (isDemo) return { id: 'demo-' + Math.random().toString(36).slice(2, 8), subject, createdAt: now.toISOString(), ...base };

  const supabase = createClient();
  if (status === 'proposed') {
    const old = existing.find((g) => g.subject === subject && g.status === 'proposed');
    if (old) await supabase.from('kid_goals').delete().eq('id', old.id);
  }
  const { data, error } = await supabase.from('kid_goals').insert({
    kid_id: kidId, subject, title: draft.title, description: draft.description ?? null, topics: draft.topics,
    weeks: draft.weeks ?? null, target_date: targetDate ?? null, status, approved_at: status === 'active' ? now.toISOString() : null,
  }).select('*').single();
  if (error || !data) { console.warn('Could not save goal:', error); return null; }
  return goalFromRow(data);
}
