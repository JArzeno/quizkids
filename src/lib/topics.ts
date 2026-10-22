import { createClient } from '@/lib/supabase/client';
import { MASTERY } from '@/lib/goals';
import type { ImportedLesson, KidGoal, KidTopic } from '@/types';

export function topicFromRow(r: Record<string, unknown>): KidTopic {
  return {
    id: r.id as string,
    subject: r.subject as string,
    title: r.title as string,
    notes: (r.notes as string) || undefined,
    source: r.source === 'import' ? 'import' : 'manual',
    createdAt: (r.created_at as string) || undefined,
  };
}

const norm = (s: string) => s.trim().toLowerCase();

/** Study notes for an imported class: the notes plus its key points and vocabulary */
export function lessonNotes(lesson: ImportedLesson): string {
  const keyPoints = lesson.keyPoints.length ? `\n\nKey points:\n- ${lesson.keyPoints.join('\n- ')}` : '';
  const vocab = lesson.vocabulary.length ? `\n\nVocabulary:\n${lesson.vocabulary.map((v) => `- ${v.term}: ${v.def}`).join('\n')}` : '';
  return lesson.notes + keyPoints + vocab;
}

/** Topics of a kid in one subject, newest first. Demo mode reads them from the kid. */
export async function loadTopics(kid: { id: string; topics?: KidTopic[] }, subject: string, isDemo: boolean): Promise<KidTopic[]> {
  if (isDemo) return (kid.topics || []).filter((t) => t.subject === subject).reverse();
  const { data, error } = await createClient().from('kid_topics').select('*').eq('kid_id', kid.id).eq('subject', subject).order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(topicFromRow);
}

/** Every topic of a kid, across subjects, newest first. Demo mode reads them from the kid. */
export async function loadKidTopics(kid: { id: string; topics?: KidTopic[] }, isDemo: boolean): Promise<KidTopic[]> {
  if (isDemo) return [...(kid.topics || [])].reverse();
  const { data, error } = await createClient().from('kid_topics').select('*').eq('kid_id', kid.id).order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(topicFromRow);
}

/** Adds a topic to a kid's subject. Adding a name that already exists returns the existing topic. */
export async function addTopic(kidId: string, subject: string, input: { title: string; notes?: string; source?: KidTopic['source'] }, isDemo: boolean, existing: KidTopic[]): Promise<KidTopic | null> {
  const title = input.title.trim();
  if (!title) return null;
  const same = existing.find((t) => t.subject === subject && norm(t.title) === norm(title));
  if (same && !input.notes) return same;
  const source = input.source || 'manual';

  if (isDemo) return same ? { ...same, notes: input.notes, source } : { id: 'demo-' + Math.random().toString(36).slice(2, 9), subject, title, notes: input.notes, source, createdAt: new Date().toISOString() };

  const supabase = createClient();
  // Importing a class again under the same name refreshes its notes
  if (same) {
    const { data, error } = await supabase.from('kid_topics').update({ notes: input.notes ?? null, source }).eq('id', same.id).select('*').single();
    if (error || !data) { console.warn('Could not update topic:', error); return null; }
    return topicFromRow(data);
  }
  const { data, error } = await supabase.from('kid_topics').insert({ kid_id: kidId, subject, title, notes: input.notes ?? null, source }).select('*').single();
  if (error?.code === '23505') {
    // Already there under a different spelling of the same name: reuse it (refreshing the notes of a re-imported class)
    const { data: row } = await supabase.from('kid_topics').select('*').eq('kid_id', kidId).eq('subject', subject).ilike('title', title.replace(/[%_\\]/g, '\\$&')).maybeSingle();
    if (!row) return null;
    return addTopic(kidId, subject, input, isDemo, [topicFromRow(row)]);
  }
  if (error || !data) { console.warn('Could not add topic:', error); return null; }
  return topicFromRow(data);
}

export async function removeTopic(id: string, isDemo: boolean): Promise<boolean> {
  if (isDemo || id.startsWith('demo-')) return true;
  const { error } = await createClient().from('kid_topics').delete().eq('id', id);
  if (error) console.warn('Could not remove topic:', error);
  return !error;
}

interface QuizLike { subject: string | null; topic: string | null; correct: number | null; total: number | null; created_at: string }

export interface TopicRow {
  title: string;
  /** Set when the parent added it (or imported it) as a topic of the subject */
  topic?: KidTopic;
  /** Part of the subject's active goal */
  inGoal: boolean;
  attempts: number;
  /** Score of the most recent quiz on it, 0-100 */
  lastPct: number | null;
  lastAt: string | null;
  mastered: boolean;
}

/**
 * The topics of one subject, as one list: the topics and classes the parent added (newest first), then any topics
 * of the active goal that are not in that list (goals made before topics existed). Studying always follows what the
 * parent added, so nothing else is listed. Pure: no I/O.
 */
export function subjectTopics(subject: string, topics: KidTopic[], goals: KidGoal[], quizzes: QuizLike[]): TopicRow[] {
  const rows: TopicRow[] = [];
  const seen = new Set<string>();
  const mine = quizzes.filter((q) => q.subject === subject && q.topic && (q.total || 0) > 0);
  const goal = goals.find((g) => g.subject === subject && g.status === 'active');
  const goalTopics = new Set((goal?.topics || []).map(norm));

  const push = (title: string, topic?: KidTopic) => {
    const key = norm(title);
    if (!key || seen.has(key)) return;
    const attempts = mine.filter((q) => norm(q.topic!) === key).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    const last = attempts[0];
    const lastPct = last ? Math.round(((last.correct || 0) / (last.total || 1)) * 100) : null;
    seen.add(key);
    rows.push({ title, topic, inGoal: goalTopics.has(key), attempts: attempts.length, lastPct, lastAt: last?.created_at ?? null, mastered: lastPct != null && lastPct >= MASTERY });
  };

  topics.filter((t) => t.subject === subject).forEach((t) => push(t.title, t));
  (goal?.topics || []).forEach((t) => push(t));
  return rows;
}
