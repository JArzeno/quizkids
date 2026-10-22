import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/lib/store';
import { addCustomSubject } from '@/lib/customSubjects';
import { subjectLabelFields } from '@/lib/subjects';
import { addTopic, loadKidTopics } from '@/lib/topics';
import type { ClassroomCourseDetails, ClassroomItem } from '@/lib/google-classroom';
import type { CustomSubject, Kid, KidSubject, KidTopic } from '@/types';

// Google Classroom import: each Classroom class (course) becomes a subject of the kid, and the assignments and
// materials posted in it become the subject's topics, with the post's text as notes that ground generated content.

/** Builtin subject a Classroom class name clearly belongs to, or null */
export function guessSubject(name: string): string | null {
  const n = name.toLowerCase();
  if (/math|matem|álgebra|algebra|geometr|fraccion|fraction|cálculo|calculus/.test(n)) return 'math';
  if (/scien|cienc|biolog|chem|quím|physic|físic/.test(n)) return 'sci';
  if (/social|histor|geograf|geograph|civic|cívic/.test(n)) return 'soc';
  if (/french|francés|français/.test(n)) return 'fr';
  if (/\bart\b|\barts\b|arte|dibujo|draw|paint|pintura/.test(n) && !/language arts|\bela\b/.test(n)) return 'art';
  if (/language arts|\bela\b|reading|lectura|writing|escritura|lengua|literac|literat|phonics/.test(n)) return 'lang';
  return null;
}

/** Icon for a new subject made from a Classroom class (same set as the custom subject picker) */
export function guessIcon(name: string): string {
  const n = name.toLowerCase();
  if (/music|músic/.test(n)) return '🎵';
  if (/robot/.test(n)) return '🤖';
  if (/comput|coding|program|tech|informátic|tecnolog/.test(n)) return '💻';
  if (/\bpe\b|p\.e\.|physical|gym|sport|deport|educación física/.test(n)) return '⚽';
  if (/drama|theat|teatro/.test(n)) return '🎭';
  if (/english|inglés|spanish|español|idioma/.test(n)) return '🔤';
  if (/cook|cocina/.test(n)) return '🍳';
  return '📚';
}

/** One assignment or material of a Classroom class that can be imported as a topic */
export interface ImportableClass {
  id: string;
  title: string;
  unit?: string;
  kind: 'assignment' | 'material';
  /** Due date for assignments, post date otherwise (ISO) */
  date?: string;
  notes: string;
}

const MAX_TITLE = 100;
const norm = (s: string) => s.trim().toLowerCase();

function classNotes(course: ClassroomCourseDetails['course'], item: ClassroomItem) {
  return [
    `Google Classroom class: ${course.name}${course.section ? ` (${course.section})` : ''}`,
    item.topic ? `Unit: ${item.topic}` : '',
    `${item.kind === 'assignment' ? 'Assignment' : 'Class material'}: ${item.title}`,
    item.due ? `Due: ${item.due.slice(0, 10)}` : '',
    item.text && item.text !== item.title ? `\n${item.text}` : '',
    item.materials.length ? `\nAttached resources:\n- ${item.materials.map((m) => m.title).join('\n- ')}` : '',
  ].filter(Boolean).join('\n');
}

/**
 * Assignments and materials of a class, grouped by unit in the class's unit order (posts with no unit last).
 * Titles repeated inside a class ("Homework") get their date added so each one is its own topic.
 */
export function importableClasses(details: ClassroomCourseDetails, lang: string): ImportableClass[] {
  const posts = [...details.assignments, ...details.materials];
  const count = new Map<string, number>();
  posts.forEach((p) => count.set(norm(p.title), (count.get(norm(p.title)) || 0) + 1));
  const used = new Set<string>();

  const list = posts.map((p) => {
    const date = p.due || p.created;
    let title = p.title.trim().slice(0, MAX_TITLE);
    if ((count.get(norm(p.title)) || 0) > 1 && date) {
      title = `${title.slice(0, MAX_TITLE - 9)} (${new Date(date).toLocaleDateString(lang === 'es' ? 'es' : 'en', { month: 'short', day: 'numeric' })})`;
    }
    for (let i = 2; used.has(norm(title)); i++) title = `${p.title.trim().slice(0, MAX_TITLE - 5)} (${i})`;
    used.add(norm(title));
    return { id: p.id, title, unit: p.topic, kind: p.kind as ImportableClass['kind'], date, notes: classNotes(details.course, p) };
  });

  const unitOrder = (u?: string) => (u ? details.topics.indexOf(u) : Infinity);
  return list.sort((a, b) => unitOrder(a.unit) - unitOrder(b.unit));
}

/** Where a Classroom class goes: a subject that exists already, or a new custom subject */
export type SubjectTarget = { kind: 'existing'; id: string } | { kind: 'new'; name: string; icon: string };

/**
 * Default subject for each class, in order: a builtin subject the name clearly matches (only the first class that
 * matches it, so "English" and "Spanish" don't end up merged), a subject of the same name, or a new subject.
 */
export function defaultTargets(courses: { id: string; name: string }[], kid: Kid, custom: CustomSubject[]): Record<string, SubjectTarget> {
  const taken = new Set<string>();
  const targets: Record<string, SubjectTarget> = {};
  for (const c of courses) {
    const builtin = guessSubject(c.name);
    const sameName = custom.find((s) => norm(s.name) === norm(c.name))?.id
      || kid.subjects?.find((s) => s.name && norm(s.name) === norm(c.name))?.subject;
    if (builtin && !taken.has(builtin)) { targets[c.id] = { kind: 'existing', id: builtin }; taken.add(builtin); }
    else if (sameName) targets[c.id] = { kind: 'existing', id: sameName };
    else targets[c.id] = { kind: 'new', name: c.name.trim().slice(0, 40), icon: guessIcon(c.name) };
  }
  return targets;
}

export interface CourseImport {
  target: SubjectTarget;
  classes: ImportableClass[];
}

export interface ImportResult {
  /** Subjects that received the import, with the number of topics added or refreshed in each */
  subjects: { id: string; added: number }[];
  /** Subject each entry of the plan went to (same order), null when it could not be saved */
  subjectOf: (string | null)[];
  /** Classes or subjects that could not be saved */
  failed: number;
}

/**
 * Saves the picked Classroom classes on the kid: creates the new subjects, adds the subjects to the kid, and adds
 * each class as a topic. A topic that already exists keeps the parent's own notes; one imported from Classroom
 * before is refreshed.
 */
export async function importClassroom(kid: Kid, plan: CourseImport[], isDemo: boolean, onProgress?: (done: number, total: number) => void): Promise<ImportResult> {
  const supabase = createClient();
  const { updateKid } = useStore.getState();
  let failed = 0;

  // 1. Subjects: new ones are created once per name, and reuse a custom subject of the same name
  const subjectOf: (string | null)[] = [];
  const created = new Map<string, string>();
  for (const c of plan) {
    if (c.target.kind === 'existing') { subjectOf.push(c.target.id); continue; }
    const key = norm(c.target.name);
    const existing = created.get(key) || useStore.getState().customSubjects.find((s) => norm(s.name) === key)?.id;
    if (existing) { created.set(key, existing); subjectOf.push(existing); continue; }
    const subject = await addCustomSubject({ name: c.target.name.trim() || 'Class', icon: c.target.icon, color: '#3F7A4F' });
    if (subject) created.set(key, subject.id);
    else failed += 1 + c.classes.length;
    subjectOf.push(subject?.id ?? null);
  }

  // 2. Add the subjects the kid doesn't have yet
  let kidSubjects: KidSubject[] = useStore.getState().kids.find((k) => k.id === kid.id)?.subjects || kid.subjects || [];
  const custom = useStore.getState().customSubjects;
  for (const id of new Set(subjectOf.filter((x): x is string => !!x))) {
    if (kidSubjects.some((s) => s.subject === id)) continue;
    const labels = subjectLabelFields(id, custom);
    if (!isDemo) {
      const { error } = await supabase.from('kid_subjects').insert({ kid_id: kid.id, subject: id, ...labels });
      // 23505: added meanwhile on another device
      if (error && error.code !== '23505') {
        console.warn('Could not add subject:', error);
        // leave its classes out too, so no topics end up under a subject the kid doesn't have
        subjectOf.forEach((s, i) => { if (s === id) { failed += 1 + plan[i].classes.length; subjectOf[i] = null; } });
        continue;
      }
    }
    kidSubjects = [...kidSubjects, { subject: id, ...labels }];
  }
  updateKid(kid.id, { subjects: kidSubjects });

  // 3. Topics
  let topics: KidTopic[] = await loadKidTopics(useStore.getState().kids.find((k) => k.id === kid.id) || kid, isDemo).catch(() => []);
  const total = plan.reduce((n, c, i) => n + (subjectOf[i] ? c.classes.length : 0), 0);
  let done = 0;
  const added = new Map<string, number>();
  for (let i = 0; i < plan.length; i++) {
    const subject = subjectOf[i];
    if (!subject) continue;
    if (!added.has(subject)) added.set(subject, 0);
    for (const cls of plan[i].classes) {
      const same = topics.find((t) => t.subject === subject && norm(t.title) === norm(cls.title));
      if (same && same.notes && same.source !== 'classroom') { done++; onProgress?.(done, total); continue; }
      const saved = await addTopic(kid.id, subject, { title: cls.title, notes: cls.notes, source: 'classroom' }, isDemo, topics);
      if (saved) {
        topics = [saved, ...topics.filter((t) => t.id !== saved.id)];
        added.set(subject, (added.get(subject) || 0) + 1);
      } else failed++;
      done++;
      onProgress?.(done, total);
    }
  }
  // Demo mode keeps topics on the kid, oldest first
  if (isDemo) updateKid(kid.id, { topics: [...topics].reverse() });

  return { subjects: [...added].map(([id, n]) => ({ id, added: n })), subjectOf, failed };
}
