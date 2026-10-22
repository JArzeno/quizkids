import { createClient } from '@/lib/supabase/client';
import type { Kid, KidSubject, KidTest, KidTopic, Lang, StudyParams } from '@/types';

/** Most topics one test can cover (keeps the quiz and guide a sensible size) */
export const MAX_TEST_TOPICS = 8;

const norm = (s: string) => s.trim().toLowerCase();

export function testFromRow(r: Record<string, unknown>): KidTest {
  return {
    id: r.id as string,
    subject: r.subject as string,
    title: r.title as string,
    topics: (r.topics as string[]) || [],
    testDate: (r.test_date as string) || undefined,
    guideContentId: (r.guide_content_id as string) || undefined,
    quizContentId: (r.quiz_content_id as string) || undefined,
    lang: ((r.lang as string) || undefined) as KidTest['lang'],
    createdAt: (r.created_at as string) || undefined,
  };
}

/** Tests of a kid in one subject, newest first. Demo mode reads them from the kid. */
export async function loadTests(kid: { id: string; tests?: KidTest[] }, subject: string, isDemo: boolean): Promise<KidTest[]> {
  if (isDemo) return (kid.tests || []).filter((t) => t.subject === subject).reverse();
  const { data, error } = await createClient().from('kid_tests').select('*').eq('kid_id', kid.id).eq('subject', subject).order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(testFromRow);
}

/** Topic name (lowercased) → the most recent test that already covers it. `tests` must be newest first. */
export function topicsInTests(tests: KidTest[]): Map<string, KidTest> {
  const used = new Map<string, KidTest>();
  tests.forEach((t) => t.topics.forEach((topic) => { if (!used.has(norm(topic))) used.set(norm(topic), t); }));
  return used;
}

/**
 * Topics to tick by default for the next test: the ones no earlier test covers, newest first, up to the limit.
 * `topics` must be newest first (as loaded).
 */
export function defaultTestTopics(topics: KidTopic[], tests: KidTest[]): string[] {
  const used = topicsInTests(tests);
  return topics.filter((t) => !used.has(norm(t.title))).slice(0, MAX_TEST_TOPICS).map((t) => t.title);
}

function uniqueTitle(title: string, existing: KidTest[]): string {
  const taken = new Set(existing.map((t) => norm(t.title)));
  if (!taken.has(norm(title))) return title;
  let n = 2;
  while (taken.has(norm(`${title} (${n})`))) n += 1;
  return `${title} (${n})`;
}

export function defaultTestTitle(topics: string[], lang: string): string {
  const head = topics.slice(0, 2).join(', ');
  const more = topics.length > 2 ? ` +${topics.length - 2}` : '';
  return `${lang === 'es' ? 'Examen' : 'Test'}: ${head}${more}`.slice(0, 80);
}

/** Class notes of the picked topics as one block, each trimmed so they all fit the prompt */
export function testSource(topics: KidTopic[]): string | undefined {
  const withNotes = topics.filter((t) => t.notes?.trim());
  if (withNotes.length === 0) return undefined;
  const budget = Math.floor(11000 / withNotes.length);
  return withNotes.map((t) => `### ${t.title}\n${t.notes!.trim().slice(0, budget)}`).join('\n\n');
}

export interface TestInput {
  title: string;
  /** The topics the test covers */
  topics: KidTopic[];
  testDate?: string;
}

/** Generates the quiz and the study guide for the picked topics, saves the test and returns it. Throws when generation or saving fails. */
export async function createTest(
  kid: Pick<Kid, 'id' | 'grade'>,
  subject: string,
  input: TestInput,
  opts: { lang: Lang | 'fr'; difficulty: StudyParams['difficulty']; existing: KidTest[]; isDemo: boolean },
): Promise<KidTest> {
  const titles = input.topics.map((t) => t.title).slice(0, MAX_TEST_TOPICS);
  if (titles.length === 0) throw new Error('No topics');
  const title = uniqueTitle(input.title.trim() || defaultTestTitle(titles, opts.lang), opts.existing);
  const body = { topic: title, topics: titles, grade: kid.grade, lang: opts.lang, subject, source: testSource(input.topics), variant: 'test' };

  const post = async (path: string, extra: Record<string, unknown> = {}) => {
    const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, ...extra }) });
    if (!res.ok) throw new Error('Generation failed');
    return (await res.json()) as { contentId?: string | null };
  };
  const [guide, quiz] = await Promise.all([post('/api/generate/guide'), post('/api/generate/quiz', { difficulty: opts.difficulty })]);

  const test: KidTest = {
    id: 'demo-' + Math.random().toString(36).slice(2, 9),
    subject, title, topics: titles, testDate: input.testDate || undefined,
    guideContentId: guide.contentId ?? undefined, quizContentId: quiz.contentId ?? undefined,
    lang: opts.lang, createdAt: new Date().toISOString(),
  };
  if (opts.isDemo) return test;

  const { data, error } = await createClient().from('kid_tests').insert({
    kid_id: kid.id, subject, title, topics: titles, test_date: test.testDate ?? null,
    guide_content_id: test.guideContentId ?? null, quiz_content_id: test.quizContentId ?? null, lang: opts.lang,
  }).select('*').single();
  if (error || !data) { console.warn('Could not save test:', error); throw new Error('Could not save test'); }
  return testFromRow(data);
}

export async function removeTest(id: string, isDemo: boolean): Promise<boolean> {
  if (isDemo || id.startsWith('demo-')) return true;
  const { error } = await createClient().from('kid_tests').delete().eq('id', id);
  if (error) console.warn('Could not remove test:', error);
  return !error;
}

/**
 * Study params for opening one half of a test. `topics` are the kid's topics of the subject, used to bring
 * back the class notes of the ones the test covers.
 */
export function testStudyParams(base: StudyParams, kid: Pick<Kid, 'grade'>, test: KidTest, kind: 'guide' | 'quiz', topics: KidTopic[], ks: KidSubject | undefined, returnTo?: string): StudyParams {
  const covered = new Set(test.topics.map(norm));
  return {
    ...base,
    subject: test.subject, topic: test.title, grade: kid.grade,
    topics: test.topics,
    contentId: kind === 'guide' ? test.guideContentId : test.quizContentId,
    pairedContentId: kind === 'guide' ? test.quizContentId : undefined,
    assignmentId: undefined, planItemId: undefined,
    contentLang: ks?.lang ?? test.lang,
    source: testSource(topics.filter((t) => covered.has(norm(t.title)))),
    returnTo,
  };
}

/** Whole days from today until a yyyy-mm-dd date (negative once it has passed) */
export function daysUntil(date: string, now = new Date()): number {
  const target = new Date(date + 'T00:00');
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}
