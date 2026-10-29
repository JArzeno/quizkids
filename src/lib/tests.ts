import { createClient } from '@/lib/supabase/client';
import type { Kid, KidSubject, KidTest, KidTopic, PracticeStats, StudyParams } from '@/types';
import type { ContentLang } from '@/lib/languages';

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
    worksheetContentId: (r.worksheet_content_id as string) || undefined,
    practiceContentId: (r.practice_content_id as string) || undefined,
    lang: ((r.lang as string) || undefined) as KidTest['lang'],
    createdAt: (r.created_at as string) || undefined,
    practice: (r.practice_stats as PracticeStats) || undefined,
    resultGrade: (r.result_grade as string) || undefined,
    resultPct: typeof r.result_pct === 'number' ? r.result_pct : undefined,
    resultNote: (r.result_note as string) || undefined,
    resultAt: (r.result_at as string) || undefined,
  };
}

/** One test by id. Demo mode reads it from the kid. */
export async function loadTest(kid: { id: string; tests?: KidTest[] }, id: string, isDemo: boolean): Promise<KidTest | null> {
  if (isDemo) return (kid.tests || []).find((t) => t.id === id) ?? null;
  const { data, error } = await createClient().from('kid_tests').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? testFromRow(data) : null;
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

/** The parts of a test's study kit, in the order they are made and studied */
export type KitPart = 'guide' | 'quiz' | 'practice' | 'pdf';
export const KIT_PARTS: KitPart[] = ['guide', 'quiz', 'practice', 'pdf'];

/**
 * Builds the whole study kit for the picked topics at once (study guide, flashcards, practice test and printable
 * worksheet), saves the test and returns it. A part that fails is left out and made when it is first opened;
 * throws only when nothing could be made (outside the demo) or the test could not be saved. `memory` is what the subject remembers
 * from earlier tests, so the kit leans on what was hard then.
 */
export async function createTest(
  kid: Pick<Kid, 'id' | 'grade'>,
  subject: string,
  input: TestInput,
  opts: { lang: ContentLang; difficulty: StudyParams['difficulty']; existing: KidTest[]; isDemo: boolean; memory?: string[]; onPart?: (part: KitPart, ok: boolean) => void },
): Promise<KidTest> {
  const titles = input.topics.map((t) => t.title).slice(0, MAX_TEST_TOPICS);
  if (titles.length === 0) throw new Error('No topics');
  const title = uniqueTitle(input.title.trim() || defaultTestTitle(titles, opts.lang), opts.existing);
  const context = opts.memory?.length ? { memory: opts.memory } : undefined;
  const body = { topic: title, topics: titles, grade: kid.grade, lang: opts.lang, subject, source: testSource(input.topics), variant: 'test', context };

  const paths: Record<KitPart, string> = { guide: '/api/generate/guide', quiz: '/api/generate/quiz', practice: '/api/generate/practice', pdf: '/api/generate/worksheet' };
  const make = async (part: KitPart) => {
    try {
      const res = await fetch(paths[part], { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, ...(part === 'quiz' ? { difficulty: opts.difficulty } : {}) }) });
      if (!res.ok) throw new Error('Generation failed');
      const { contentId } = (await res.json()) as { contentId?: string | null };
      opts.onPart?.(part, true);
      return { ok: true, contentId: contentId ?? undefined };
    } catch (e) {
      console.warn(`Could not make the ${part} of the test:`, e);
      opts.onPart?.(part, false);
      return { ok: false, contentId: undefined };
    }
  };
  const [guide, quiz, practice, pdf] = await Promise.all(KIT_PARTS.map(make));
  // The demo has sample content to show for every part, so it never stops here
  if (![guide, quiz, practice, pdf].some((p) => p.ok) && !opts.isDemo) throw new Error('Generation failed');

  const test: KidTest = {
    id: 'demo-' + Math.random().toString(36).slice(2, 9),
    subject, title, topics: titles, testDate: input.testDate || undefined,
    guideContentId: guide.contentId, quizContentId: quiz.contentId, practiceContentId: practice.contentId, worksheetContentId: pdf.contentId,
    lang: opts.lang, createdAt: new Date().toISOString(),
  };
  if (opts.isDemo) return test;

  const { data, error } = await createClient().from('kid_tests').insert({
    kid_id: kid.id, subject, title, topics: titles, test_date: test.testDate ?? null,
    guide_content_id: test.guideContentId ?? null, quiz_content_id: test.quizContentId ?? null,
    practice_content_id: test.practiceContentId ?? null, worksheet_content_id: test.worksheetContentId ?? null, lang: opts.lang,
  }).select('*').single();
  if (error || !data) { console.warn('Could not save test:', error); throw new Error('Could not save test'); }
  return testFromRow(data);
}

/** Saves a change to a test (practice results, the grade from school). Demo mode only updates the kid's local copy. */
export async function updateTest(kidId: string, test: KidTest, patch: Partial<KidTest>, isDemo: boolean): Promise<KidTest | null> {
  const next = { ...test, ...patch };
  if (isDemo || test.id.startsWith('demo-')) return next;
  const row: Record<string, unknown> = {};
  if ('practice' in patch) row.practice_stats = patch.practice ?? null;
  if ('practiceContentId' in patch) row.practice_content_id = patch.practiceContentId ?? null;
  if ('worksheetContentId' in patch) row.worksheet_content_id = patch.worksheetContentId ?? null;
  if ('resultGrade' in patch) row.result_grade = patch.resultGrade ?? null;
  if ('resultPct' in patch) row.result_pct = patch.resultPct ?? null;
  if ('resultNote' in patch) row.result_note = patch.resultNote ?? null;
  if ('resultAt' in patch) row.result_at = patch.resultAt ?? null;
  if ('testDate' in patch) row.test_date = patch.testDate ?? null;
  const { data, error } = await createClient().from('kid_tests').update(row).eq('id', test.id).eq('kid_id', kidId).select('*').single();
  if (error || !data) { console.warn('Could not update test:', error); return null; }
  return testFromRow(data);
}

export async function removeTest(id: string, isDemo: boolean): Promise<boolean> {
  if (isDemo || id.startsWith('demo-')) return true;
  const { error } = await createClient().from('kid_tests').delete().eq('id', id);
  if (error) console.warn('Could not remove test:', error);
  return !error;
}

/** Page each part of the study kit opens on */
export const KIT_ROUTES: Record<KitPart, string> = { guide: '/kids/guide', quiz: '/kids/quiz', practice: '/kids/test', pdf: '/kids/pdf' };

/**
 * Study params for opening one part of a test's study kit. `topics` are the kid's topics of the subject, used to
 * bring back the class notes of the ones the test covers. `memory` is what the subject remembers from other tests.
 */
export function testStudyParams(base: StudyParams, kid: Pick<Kid, 'grade'>, test: KidTest, kind: KitPart, topics: KidTopic[], ks: KidSubject | undefined, returnTo?: string, memory?: string[]): StudyParams {
  const covered = new Set(test.topics.map(norm));
  const contentId = { guide: test.guideContentId, quiz: test.quizContentId, practice: test.practiceContentId, pdf: test.worksheetContentId }[kind];
  return {
    ...base,
    subject: test.subject, topic: test.title, grade: kid.grade,
    topics: test.topics,
    contentId,
    pairedContentId: kind === 'guide' ? test.quizContentId : undefined,
    assignmentId: undefined, planItemId: undefined,
    // Same language as the subject's other content: the account language unless the parent set one for the subject
    contentLang: ks?.lang,
    source: testSource(topics.filter((t) => covered.has(norm(t.title)))),
    returnTo,
    testId: test.id,
    memory,
  };
}

/** True once the grade from school is in, or from the day of the test (when the grade can be added) */
export function testIsOver(test: KidTest, now = new Date()): boolean {
  return !!test.resultGrade || (!!test.testDate && daysUntil(test.testDate, now) <= 0);
}

const LETTERS: Record<string, number> = { 'A+': 98, A: 95, 'A-': 91, 'B+': 88, B: 85, 'B-': 81, 'C+': 78, C: 75, 'C-': 71, 'D+': 68, D: 65, 'D-': 61, E: 50, F: 50 };

/** Reads a school grade written in a common way ("92", "92%", "8/10", "17/20", "9.5", "B+") as 0-100 */
export function gradeToPct(input: string): number | undefined {
  const g = input.trim().toUpperCase().replace(',', '.');
  if (!g) return undefined;
  if (LETTERS[g] != null) return LETTERS[g];
  const frac = g.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (frac) {
    const [a, b] = [parseFloat(frac[1]), parseFloat(frac[2])];
    return b > 0 && a <= b ? Math.round((a / b) * 100) : undefined;
  }
  const num = g.match(/^(\d+(?:\.\d+)?)\s*%?$/);
  if (!num) return undefined;
  const n = parseFloat(num[1]);
  // 0-10 scales are common (e.g. 8.5); anything else above 10 is out of 100
  if (n <= 10 && !g.endsWith('%')) return Math.round(n * 10);
  return n <= 100 ? Math.round(n) : undefined;
}

/**
 * What the subject remembers from its school tests, as short lines for the AI, newest first: the practice score,
 * the topics that were weak, what was missed, and the grade from school with the note about it. Tests with nothing
 * to remember yet are left out. `tests` must be newest first.
 */
export function examMemory(tests: KidTest[], opts: { except?: string; max?: number } = {}): string[] {
  return tests
    .filter((t) => t.id !== opts.except && (t.practice || t.resultGrade))
    .slice(0, opts.max ?? 4)
    .map((t) => {
      const parts = [`"${t.title}" (${t.topics.join('; ')})${t.testDate ? `, ${t.testDate}` : ''}`];
      if (t.practice) parts.push(`practice test ${t.practice.best}% best`);
      if (t.practice?.weak.length) parts.push(`weak on: ${t.practice.weak.join(', ')}`);
      if (t.practice?.missed.length) parts.push(`missed: ${t.practice.missed.slice(0, 4).join('; ')}`);
      if (t.resultGrade) parts.push(`grade at school: ${t.resultGrade}${t.resultPct != null && String(t.resultPct) !== t.resultGrade ? ` (${t.resultPct}/100)` : ''}`);
      if (t.resultNote) parts.push(`note: ${t.resultNote}`);
      return parts.join(' · ').slice(0, 400);
    });
}

/**
 * Tests still coming up, across subjects: the ones dated today or later, and recent ones with no date and no grade yet.
 * Soonest first, dated before undated. Demo mode reads them from the kid.
 */
export async function loadUpcomingTests(kid: { id: string; tests?: KidTest[] }, isDemo: boolean, now = new Date()): Promise<KidTest[]> {
  let all: KidTest[];
  if (isDemo) all = [...(kid.tests || [])].reverse();
  else {
    const { data, error } = await createClient().from('kid_tests').select('*').eq('kid_id', kid.id).is('result_grade', null).order('created_at', { ascending: false }).limit(30);
    if (error) throw error;
    all = (data || []).map(testFromRow);
  }
  const recent = now.getTime() - 21 * 86400000;
  return all
    .filter((t) => !t.resultGrade && (t.testDate ? daysUntil(t.testDate, now) >= 0 : !!t.createdAt && new Date(t.createdAt).getTime() >= recent))
    .sort((a, b) => (a.testDate && b.testDate ? a.testDate.localeCompare(b.testDate) : a.testDate ? -1 : b.testDate ? 1 : 0));
}

/** Topics that were weak on earlier tests of the subject (practice under the pass mark), newest first */
export function examWeakTopics(tests: KidTest[]): string[] {
  return Array.from(new Set(tests.flatMap((t) => t.practice?.weak || []))).slice(0, 8);
}

/** Whole days from today until a yyyy-mm-dd date (negative once it has passed) */
export function daysUntil(date: string, now = new Date()): number {
  const target = new Date(date + 'T00:00');
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}
