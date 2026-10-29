import type { GradedAnswer, PracticeItem, PracticeItemType, PracticeStats, PracticeTest } from '@/types';

/** Bump when the practice test format changes, so cached tests in the old format are not served */
export const PRACTICE_VERSION = 1;

/** Score (overall and per topic) that counts as ready for the real test */
export const PRACTICE_PASS = 70;

export const PRACTICE_ORDER: PracticeItemType[] = ['mc', 'tf', 'fill', 'short'];

const MAX_ITEMS = 24;
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const BLANK = /_{2,}|\[blank\]|…{2,}|\.{4,}/i;

/** Lowercase, no accents, no punctuation: for comparing short answers */
export const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}\s.,-]/gu, ' ').replace(/\s+/g, ' ').trim();

function normalizeItem(x: Record<string, unknown>, topicOf: (t: unknown) => string | undefined): PracticeItem | null {
  const topic = topicOf(x.topic);
  if (x.type === 'mc') {
    const q = str(x.q);
    const choices = Array.isArray(x.choices) ? x.choices.map(str).filter(Boolean).slice(0, 4) : [];
    const a = Number(x.a);
    return q && choices.length >= 2 && Number.isInteger(a) && a >= 0 && a < choices.length ? { type: 'mc', topic, q, choices, a } : null;
  }
  if (x.type === 'tf') {
    const s = str(x.s);
    const a = x.a === true || x.a === 'true';
    const fix = str(x.fix);
    return s ? { type: 'tf', topic, s, a, ...(!a && fix ? { fix } : {}) } : null;
  }
  if (x.type === 'fill') {
    const s = str(x.s).replace(BLANK, '___');
    const a = str(x.a);
    return a && s.split('___').length === 2 ? { type: 'fill', topic, s, a } : null;
  }
  if (x.type === 'short') {
    const q = str(x.q);
    const a = str(x.a);
    const points = Array.isArray(x.points) ? x.points.map(str).filter(Boolean).slice(0, 5) : [];
    return q && a ? { type: 'short', topic, q, a, points } : null;
  }
  return null;
}

/**
 * Cleans model output into a practice test: drops malformed items and groups them by type, in exam order.
 * With `topics`, each item's topic is matched to one of them (written back exactly as given) or dropped;
 * without, topics are kept as they are (a saved test).
 */
export function normalizePractice(v: unknown, topics?: string[]): PracticeTest {
  const raw = v && typeof v === 'object' ? (v as { items?: unknown }) : {};
  const byName = new Map((topics || []).map((t) => [t.trim().toLowerCase(), t]));
  const topicOf = (t: unknown) => (topics ? (typeof t === 'string' ? byName.get(t.trim().toLowerCase()) : undefined) : str(t) || undefined);
  const items = (Array.isArray(raw.items) ? raw.items : [])
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map((x) => normalizeItem(x, topicOf))
    .filter((x): x is PracticeItem => !!x);
  const ordered = PRACTICE_ORDER.flatMap((type) => items.filter((x) => x.type === type)).slice(0, MAX_ITEMS);
  return { items: ordered, v: PRACTICE_VERSION };
}

/** A cached practice test in the current format, or null */
export function toPractice(v: unknown): PracticeTest | null {
  if (!v || typeof v !== 'object' || (v as { v?: unknown }).v !== PRACTICE_VERSION) return null;
  const p = normalizePractice(v);
  return p.items.length ? p : null;
}

/** Written answers count double */
export const itemPoints = (it: PracticeItem) => (it.type === 'short' ? 2 : 1);

export type PracticeAnswer = number | boolean | string | undefined;

/** True once the kid gave some answer to the item */
export function answered(it: PracticeItem, ans: PracticeAnswer): boolean {
  if (it.type === 'mc') return typeof ans === 'number';
  if (it.type === 'tf') return typeof ans === 'boolean';
  return typeof ans === 'string' && ans.trim().length > 0;
}

/**
 * Grades what can be checked without the AI: choices, true/false, exact fill-ins and blank answers.
 * Returns null for answers the AI has to read (written answers, fill-ins that are not an exact match).
 */
export function gradeLocally(it: PracticeItem, ans: PracticeAnswer): GradedAnswer | null {
  const wrong: GradedAnswer = { verdict: 'wrong', feedback: '' };
  if (it.type === 'mc') return ans === it.a ? { verdict: 'correct', feedback: '' } : wrong;
  if (it.type === 'tf') return ans === it.a ? { verdict: 'correct', feedback: '' } : wrong;
  if (typeof ans !== 'string' || !ans.trim()) return wrong;
  if (it.type === 'fill' && fold(ans) === fold(it.a)) return { verdict: 'correct', feedback: '' };
  return null;
}

const earned = (it: PracticeItem, g: GradedAnswer | undefined) => (!g ? 0 : g.verdict === 'correct' ? itemPoints(it) : g.verdict === 'partial' ? itemPoints(it) / 2 : 0);

export interface PracticeScore {
  points: number;
  max: number;
  pct: number;
  /** Score 0-100 per topic (items without a topic are left out) */
  byTopic: Record<string, number>;
}

export function scorePractice(items: PracticeItem[], graded: GradedAnswer[]): PracticeScore {
  const tally = new Map<string, { got: number; max: number }>();
  let points = 0;
  let max = 0;
  items.forEach((it, i) => {
    const got = earned(it, graded[i]);
    points += got;
    max += itemPoints(it);
    if (!it.topic) return;
    const row = tally.get(it.topic) || { got: 0, max: 0 };
    tally.set(it.topic, { got: row.got + got, max: row.max + itemPoints(it) });
  });
  const byTopic = Object.fromEntries(Array.from(tally, ([topic, r]) => [topic, Math.round((r.got / r.max) * 100)]));
  return { points, max, pct: max ? Math.round((points / max) * 100) : 0, byTopic };
}

/** Short note on what one missed item was about, for the subject's memory */
function missedNote(it: PracticeItem, g: GradedAnswer): string[] {
  if (g.missing?.length) return g.missing;
  const text = it.type === 'tf' || it.type === 'fill' ? it.s : it.q;
  return [text.length > 90 ? text.slice(0, 87) + '…' : text];
}

/** Stats to save on the test after a practice attempt */
export function practiceStats(prev: PracticeStats | undefined, items: PracticeItem[], graded: GradedAnswer[], now = new Date()): PracticeStats {
  const score = scorePractice(items, graded);
  const missed = Array.from(new Set(items.flatMap((it, i) => (graded[i] && graded[i].verdict !== 'correct' ? missedNote(it, graded[i]) : [])))).slice(0, 6);
  return {
    attempts: (prev?.attempts || 0) + 1,
    last: score.pct,
    best: Math.max(prev?.best ?? 0, score.pct),
    at: now.toISOString(),
    byTopic: score.byTopic,
    weak: Object.entries(score.byTopic).filter(([, pct]) => pct < PRACTICE_PASS).map(([topic]) => topic),
    missed,
  };
}

const STOP = new Set(['the', 'and', 'that', 'this', 'with', 'from', 'they', 'them', 'there', 'their', 'have', 'because', 'which', 'when', 'what', 'into', 'para', 'como', 'pero', 'porque', 'esta', 'este', 'estos', 'tiene', 'cuando', 'donde', 'sobre', 'entre', 'también']);
const words = (s: string) => new Set(fold(s).split(/[\s.,-]+/).filter((w) => w.length >= 4 && !STOP.has(w)));

/** Edits needed to turn one string into the other */
function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cur = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
  }
  return row[b.length];
}

/**
 * Offline grade for an answer the AI could not read. A fill-in passes with a small spelling slip; a written answer
 * is judged by how many words of its key ideas (or the model answer) it shares.
 */
export function fallbackGrade(model: string, points: string[], answer: string, lang: string, kind: 'fill' | 'short' = 'short'): GradedAnswer {
  const es = lang === 'es';
  if (kind === 'fill') {
    const [a, b] = [fold(answer), fold(model)];
    const ok = !!a && distance(a, b) <= Math.max(1, Math.floor(b.length / 5));
    return ok ? { verdict: 'correct', feedback: '' } : { verdict: 'wrong', feedback: '' };
  }
  const given = words(answer);
  const key = words(points.length ? points.join(' ') : model);
  if (given.size === 0 || key.size === 0) return { verdict: 'wrong', feedback: es ? 'Compara tu respuesta con la respuesta completa.' : 'Compare your answer with the complete answer.' };
  const hit = Array.from(key).filter((w) => given.has(w)).length / key.size;
  if (hit >= 0.5) return { verdict: 'correct', feedback: es ? '¡Bien! Mira la respuesta completa por si quieres agregar algo.' : 'Nice! Check the complete answer for anything you could add.' };
  if (hit >= 0.15) return { verdict: 'partial', feedback: es ? 'Vas bien, pero le faltan ideas. Mira la respuesta completa.' : "You're on the right track, but some ideas are missing. Look at the complete answer." };
  return { verdict: 'wrong', feedback: es ? 'No es del todo correcto. Lee la respuesta completa y vuelve a intentarlo.' : "That's not quite it. Read the complete answer and try again." };
}
