import type { QuizQuestion, Worksheet, WorksheetSection, WorksheetSectionType } from '@/types';

/** Bump when the worksheet format changes, so cached worksheets in the old format are not served */
export const WORKSHEET_VERSION = 2;

export const SECTION_ORDER: WorksheetSectionType[] = ['mc', 'tf', 'fill', 'match', 'open'];

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const BLANK = /_{2,}|\[blank\]|…{2,}|\.{4,}/i;

/** Small string hash, so shuffles are random-looking but the same on every render and print */
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Deterministic shuffle of 0..n-1 that never leaves the list in its original order (n > 1) */
export function shuffledOrder(n: number, seed: string): number[] {
  const idx = Array.from({ length: n }, (_, i) => i);
  let h = hash(seed) || 1;
  for (let i = n - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    const j = h % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  if (n > 1 && idx.every((v, i) => v === i)) idx.push(idx.shift()!);
  return idx;
}

function normalizeSection(s: unknown): WorksheetSection | null {
  if (!s || typeof s !== 'object') return null;
  const { type, items, bank } = s as { type?: unknown; items?: unknown; bank?: unknown };
  const list = Array.isArray(items) ? items.filter((x) => x && typeof x === 'object') : [];

  if (type === 'mc') {
    const out = list
      .map((x) => ({ q: str(x.q), choices: Array.isArray(x.choices) ? x.choices.map(str).filter(Boolean).slice(0, 4) : [], a: Number(x.a) }))
      .filter((x) => x.q && x.choices.length >= 2 && Number.isInteger(x.a) && x.a >= 0 && x.a < x.choices.length);
    return out.length ? { type, items: out } : null;
  }
  if (type === 'tf') {
    const out = list
      .map((x) => ({ s: str(x.s), a: x.a === true || x.a === 'true', fix: str(x.fix) }))
      .filter((x) => x.s)
      .map((x) => (x.a || !x.fix ? { s: x.s, a: x.a } : x));
    return out.length ? { type, items: out } : null;
  }
  if (type === 'fill') {
    const out = list
      .map((x) => ({ s: str(x.s).replace(BLANK, '___'), a: str(x.a) }))
      .filter((x) => x.a && x.s.split('___').length === 2);
    if (!out.length) return null;
    const words = Array.isArray(bank) ? bank.map(str).filter(Boolean) : [];
    if (!words.length) return { type, items: out };
    // The bank must hold every answer; extras are kept as distractors. Alphabetical so it gives nothing away.
    const all = Array.from(new Map([...out.map((x) => x.a), ...words].map((w) => [w.toLowerCase(), w])).values()).slice(0, out.length + 3);
    return { type, bank: all.sort((a, b) => a.localeCompare(b)), items: out };
  }
  if (type === 'match') {
    const out = list.map((x) => ({ left: str(x.left), right: str(x.right) })).filter((x) => x.left && x.right).slice(0, 6);
    return out.length >= 3 ? { type, items: out } : null;
  }
  if (type === 'open') {
    const out = list
      .map((x) => ({ q: str(x.q), a: str(x.a), lines: Math.min(6, Math.max(2, Math.round(Number(x.lines) || 3))) }))
      .filter((x) => x.q);
    return out.length ? { type, items: out } : null;
  }
  return null;
}

/** Cleans model output into a worksheet: drops malformed items, one section per type, in a fixed order */
export function normalizeWorksheet(v: unknown): Worksheet {
  const raw = v && typeof v === 'object' ? (v as { sections?: unknown; bonus?: unknown }) : {};
  const byType = new Map<WorksheetSectionType, WorksheetSection>();
  for (const s of Array.isArray(raw.sections) ? raw.sections : []) {
    const n = normalizeSection(s);
    if (n && !byType.has(n.type)) byType.set(n.type, n);
  }
  const sections = SECTION_ORDER.map((t) => byType.get(t)).filter((s): s is WorksheetSection => !!s);
  return { sections, bonus: str(raw.bonus), v: WORKSHEET_VERSION };
}

/** Accepts both the current format and old cached worksheets ({ questions, bonus }) */
export function toWorksheet(v: unknown): Worksheet | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as { sections?: unknown; questions?: QuizQuestion[]; bonus?: unknown };
  if (Array.isArray(o.sections)) {
    const w = normalizeWorksheet(o);
    return w.sections.length ? w : null;
  }
  if (Array.isArray(o.questions)) {
    const mc = normalizeSection({ type: 'mc', items: o.questions });
    return mc ? { sections: [mc], bonus: str(o.bonus) } : null;
  }
  return null;
}
