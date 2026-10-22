import type { KidSubject } from '@/types';

export const BUILTIN_SUBJECTS = [
  { id: 'math', en: 'Math', es: 'Matemáticas', icon: '➗' },
  { id: 'lang', en: 'Language Arts', es: 'Lenguaje', icon: '📖' },
  { id: 'sci', en: 'Science', es: 'Ciencia', icon: '🔬' },
  { id: 'soc', en: 'Social Studies', es: 'Sociales', icon: '🌎' },
  { id: 'fr', en: 'French', es: 'Francés', icon: '🇫🇷' },
  { id: 'art', en: 'Art', es: 'Arte', icon: '🎨' },
];

export interface SubjectOption { id: string; label: string; icon: string }

type Custom = { id: string; name: string; icon: string };

export function subjectOptions(lang: string, custom: Custom[] = []): SubjectOption[] {
  return [
    ...BUILTIN_SUBJECTS.map((s) => ({ id: s.id, label: lang === 'es' ? s.es : s.en, icon: s.icon })),
    ...custom.map((s) => ({ id: s.id, label: s.name, icon: s.icon })),
  ];
}

/** Label of a subject. Falls back to the name/icon stored on the kid's subject row (so a custom subject the parent deleted keeps its label), then to the raw id. */
export function subjectInfo(id: string, lang: string, custom: Custom[] = [], stored?: { name?: string; icon?: string }): SubjectOption {
  return subjectOptions(lang, custom).find((s) => s.id === id) || { id, label: stored?.name || id, icon: stored?.icon || '📚' };
}

/** subjectInfo for a subject of a kid: uses the name/icon saved on the kid's row when the custom subject no longer exists */
export function kidSubjectInfo(kidSubjects: KidSubject[] | undefined, id: string, lang: string, custom: Custom[] = []): SubjectOption {
  return subjectInfo(id, lang, custom, kidSubjects?.find((s) => s.subject === id));
}

/** Name/icon to save on a kid's subject (row and local state): set for custom subjects so they outlive the parent deleting them, empty for builtin ones */
export function subjectLabelFields(id: string, custom: Custom[] = []): { name?: string; icon?: string } {
  const c = custom.find((s) => s.id === id);
  return c ? { name: c.name, icon: c.icon } : {};
}

/** English name of a subject for AI prompts */
export function subjectPromptName(id: string, custom: Custom[] = []): string {
  return BUILTIN_SUBJECTS.find((s) => s.id === id)?.en || custom.find((s) => s.id === id)?.name || id;
}

export function gradeToNumber(grade: string): number {
  return grade.toUpperCase() === 'K' ? 0 : Math.max(0, parseInt(grade, 10) || 0);
}

export function levelLabel(level: number, lang: string): string {
  if (level <= 0) return lang === 'es' ? 'Kínder' : 'Kindergarten';
  return (lang === 'es' ? 'Grado ' : 'Grade ') + level;
}

/** Row shape of public.kid_subjects → app shape */
export function fromRow(r: Record<string, unknown>): KidSubject {
  return {
    subject: r.subject as string,
    lang: ((r.lang as string) || 'en') as 'en' | 'es' | 'fr',
    focus: (r.focus as string) || undefined,
    level: r.level == null ? undefined : (r.level as number),
    strongTopics: (r.strong_topics as string[]) || [],
    weakTopics: (r.weak_topics as string[]) || [],
    placementAccuracy: r.placement_accuracy == null ? undefined : (r.placement_accuracy as number),
    placedAt: (r.placed_at as string) || undefined,
    levelUpdatedAt: (r.level_updated_at as string) || undefined,
    paused: r.paused === true,
    name: (r.name as string) || undefined,
    icon: (r.icon as string) || undefined,
  };
}
