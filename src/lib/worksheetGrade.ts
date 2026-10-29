import type { WorksheetSection } from '@/types';
import { shuffledOrder } from '@/lib/worksheet';

/**
 * What a kid typed or picked on an interactive worksheet, keyed `${section type}.${item index}` (a false
 * true/false item's correction is `tf.${i}.fix`). Every value is a string so inputs stay controlled and the
 * whole thing saves as plain JSON:
 *   mc    → index of the picked choice          tf   → 'true' | 'false'
 *   fill  → the word typed or tapped            open → free text
 *   match → position of the picked letter in the shuffled right column
 */
export type WorksheetAnswers = Record<string, string>;

/** right/wrong are scored; blank counts as wrong; open answers are written for a grown-up to read, not scored */
export type Verdict = 'right' | 'wrong' | 'blank' | 'open';

export const answerKey = (type: WorksheetSection['type'], i: number) => `${type}.${i}`;

/** Lowercase, no accents or edge punctuation, so "Órbita " and "orbita" match */
export function normalizeAnswer(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/^[\s.,;:!?¡¿"'()]+|[\s.,;:!?¡¿"'()]+$/g, '').replace(/\s+/g, ' ');
}

/** Same shuffle the printed sheet uses, so the letters in the right column are the same everywhere */
export const matchOrder = (s: Extract<WorksheetSection, { type: 'match' }>) => shuffledOrder(s.items.length, s.items.map((x) => x.left).join('|'));

export function gradeSection(s: WorksheetSection, answers: WorksheetAnswers): Verdict[] {
  const ans = (i: number) => (answers[answerKey(s.type, i)] ?? '').trim();
  const grade = (i: number, ok: (a: string) => boolean): Verdict => (ans(i) === '' ? 'blank' : ok(ans(i)) ? 'right' : 'wrong');

  if (s.type === 'mc') return s.items.map((q, i) => grade(i, (a) => Number(a) === q.a));
  if (s.type === 'tf') return s.items.map((it, i) => grade(i, (a) => (a === 'true') === it.a));
  if (s.type === 'fill') return s.items.map((it, i) => grade(i, (a) => normalizeAnswer(a) === normalizeAnswer(it.a)));
  if (s.type === 'match') {
    const order = matchOrder(s);
    return s.items.map((_, i) => grade(i, (a) => order[Number(a)] === i));
  }
  return s.items.map(() => 'open' as const);
}

export interface WorksheetScore {
  correct: number;
  /** Items that can be scored (everything but written answers) */
  scored: number;
  /** Scored items left empty */
  blank: number;
}

export function scoreWorksheet(sections: WorksheetSection[], answers: WorksheetAnswers): WorksheetScore {
  const all = sections.flatMap((s) => gradeSection(s, answers));
  return {
    correct: all.filter((v) => v === 'right').length,
    scored: all.filter((v) => v !== 'open').length,
    blank: all.filter((v) => v === 'blank').length,
  };
}

/** Same 1–5 star scale the quiz uses, from the share of scored items that were right */
export function starsFor({ correct, scored }: WorksheetScore): number {
  const pct = scored ? (correct / scored) * 100 : 0;
  return pct >= 90 ? 5 : pct >= 75 ? 4 : pct >= 60 ? 3 : pct >= 40 ? 2 : 1;
}

/** Items answered so far (written answers count once anything is typed), for the "x of y answered" counter */
export function answeredCount(sections: WorksheetSection[], answers: WorksheetAnswers): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const s of sections) {
    s.items.forEach((_, i) => {
      total += 1;
      if ((answers[answerKey(s.type, i)] ?? '').trim() !== '') done += 1;
    });
  }
  return { done, total };
}
