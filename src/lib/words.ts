import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/lib/store';
import { shuffle } from '@/lib/games';
import { daysUntil } from '@/lib/tests';
import { isContentLang } from '@/lib/languages';
import type { WordList, WordStat } from '@/types';

/**
 * Word lists: words (or sentences) a grown-up adds so the kid can practice spelling them, e.g. for a dictation or a
 * spelling olympiad. Two games: "write" (hear it, type it) and "pick" (choose the one spelled right). Everything is
 * checked here, no AI: the wrong spellings come from the usual spelling mix-ups of the language (b/v, h, accents…).
 */

export type WordGame = 'write' | 'pick';

export const MAX_WORDS = 300;
/** Long enough for a short paragraph (the olympiad's last stage) */
export const MAX_ENTRY = 600;

export interface WordGameMeta {
  id: WordGame;
  emoji: string;
  tone: 'primary' | 'sky' | 'honey' | 'coral' | 'berry';
  en: { title: string; sub: string };
  es: { title: string; sub: string };
}

export const WORD_GAMES: WordGameMeta[] = [
  { id: 'write', emoji: '✏️', tone: 'berry', en: { title: 'Write the word', sub: 'Listen and write it right' }, es: { title: 'Escribe la palabra', sub: 'Escucha y escríbela bien' } },
  { id: 'pick', emoji: '🔍', tone: 'sky', en: { title: 'Which one is right?', sub: 'Pick the one spelled right' }, es: { title: '¿Cuál está bien escrita?', sub: 'Elige la que está bien escrita' } },
];

export const isWordGame = (v: unknown): v is WordGame => v === 'write' || v === 'pick';

// ---- entries ---------------------------------------------------------------------------------------------------

export interface WordEntry {
  /** The word or sentence to spell */
  w: string;
  /** A sentence to hear the word in (words that sound alike: tuvo / tubo) */
  hint?: string;
}

/** A pick round card: the entry plus the spellings shown, the right one among them */
export interface PickItem extends WordEntry { choices: string[] }

const squash = (s: string) => s.normalize('NFC').trim().replace(/\s+/g, ' ');

/** "tuvo (Él tuvo suerte)" → the word and the sentence to hear it in; anything else is the word (or sentence) itself */
export function parseEntry(raw: string): WordEntry {
  const s = squash(raw);
  const m = s.match(/^([^\s()]+)\s*\((.+)\)$/);
  return m ? { w: m[1], hint: m[2].trim() } : { w: s };
}

/** Key a word's stats are saved under */
export const wordKey = (w: string) => squash(w).toLowerCase();

const isSentence = (w: string) => /\s/.test(w.trim());

/**
 * What a grown-up typed or pasted → entries. One per line; a line of single words split by commas (or semicolons,
 * tabs) is several words. Bullets and numbering are dropped and a word given twice is kept once.
 */
export function parseWordText(text: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (x: string) => {
    const s = squash(x).replace(/^[,;]+|[,;]+$/g, '').trim().slice(0, MAX_ENTRY);
    const key = s && wordKey(parseEntry(s).w);
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push(s);
  };
  text.split(/\r?\n/).forEach((line) => {
    const l = line.replace(/^\s*(?:[-*•·▪◦–]+|\d{1,3}\s*[.)-])\s*/, '').trim();
    if (!l) return;
    const sentence = /[.!?…]$/.test(l) || /^[¿¡]/.test(l);
    const parts = l.split(/[,;\t]/).map((p) => p.trim()).filter(Boolean);
    if (!sentence && parts.length > 1 && parts.every((p) => !/\s/.test(p) || /^[^\s()]+\s*\(.+\)$/.test(p))) parts.forEach(push);
    else push(l);
  });
  return out.slice(0, MAX_WORDS);
}

/** The hint sentence with the word hidden, to show on screen without giving the answer away */
export function maskedHint(e: WordEntry): string | undefined {
  if (!e.hint) return undefined;
  const esc = e.w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return e.hint.replace(new RegExp(`(^|[^\\p{L}])${esc}(?![\\p{L}])`, 'giu'), '$1___');
}

// ---- checking an answer ------------------------------------------------------------------------------------------

const clean = (s: string) => squash(s).replace(/[‘’´`]/g, "'").replace(/[“”«»]/g, '"');
const edges = (s: string) => s.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');

/** Capitals only count when the word has them (names, the start of a sentence) */
const caseMatters = (target: string) => target !== target.toLowerCase();

/**
 * True when `typed` spells `target` right. Accents always count; capitals only when the word has them; for a single
 * word, punctuation around it does not.
 */
export function isRight(target: string, typed: string): boolean {
  let t = clean(target);
  let y = clean(typed);
  if (!isSentence(t)) { t = edges(t); y = edges(y); }
  if (!y) return false;
  return caseMatters(t) ? t === y : t === y.toLowerCase();
}

type Op = { k: '=' | '-' | '+'; t: string };

/** Lines two token lists up (longest common subsequence): '-' only in a, '+' only in b */
function align(a: string[], b: string[], eq: (x: string, y: string) => boolean): Op[] {
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = eq(a[i], b[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ops: Op[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (eq(a[i], b[j])) { ops.push({ k: '=', t: a[i] }); i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) ops.push({ k: '-', t: a[i++] });
    else ops.push({ k: '+', t: b[j++] });
  }
  while (i < n) ops.push({ k: '-', t: a[i++] });
  while (j < m) ops.push({ k: '+', t: b[j++] });
  return ops;
}

export interface DiffToken { t: string; ok: boolean }

/**
 * The right spelling and the kid's answer side by side: in `want`, the letters (or words, for a sentence) the kid
 * missed are marked; in `got`, the ones that do not belong. `sep` joins the tokens.
 */
export function spellDiff(target: string, typed: string): { want: DiffToken[]; got: DiffToken[]; sep: string } {
  const t = clean(target);
  const y = clean(typed);
  const sentence = isSentence(t);
  const loose = !caseMatters(t);
  const eq = (a: string, b: string) => (loose ? a.toLowerCase() === b.toLowerCase() : a === b);
  const split = (s: string) => (sentence ? s.split(' ') : Array.from(s));
  const ops = align(split(t), split(y), eq);
  return {
    want: ops.filter((o) => o.k !== '+').map((o) => ({ t: o.t, ok: o.k === '=' })),
    got: ops.filter((o) => o.k !== '-').map((o) => ({ t: o.t, ok: o.k === '=' })),
    sep: sentence ? ' ' : '',
  };
}

const ACUTE = 'áéíóú';
const plain = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Short tips on what went wrong in a word ("It has an h", "It's spelled with v, not b"), at most two */
export function spellTips(target: string, typed: string, uiLang: string): string[] {
  const es = uiLang === 'es';
  const t = edges(clean(target)).toLowerCase();
  const y = edges(clean(typed)).toLowerCase();
  if (!y || isSentence(t)) return [];
  if (t === y) return caseMatters(edges(clean(target))) ? [es ? 'Lleva mayúscula.' : 'It needs a capital letter.'] : [];
  if (plain(t) === plain(y)) {
    // Only the accent is off
    const acc = Array.from(t).find((c) => ACUTE.includes(c));
    if (acc) return [es ? `La tilde va en la «${acc}».` : `The accent goes on «${acc}».`];
    if (t.includes('ñ') && !y.includes('ñ')) return [es ? 'Lleva ñ.' : 'It has an ñ.'];
    if (t.includes('ü') && !y.includes('ü')) return [es ? 'Lleva diéresis: «ü».' : 'It has a «ü».'];
    return [es ? 'No lleva tilde.' : 'No accent here.'];
  }
  const tips: string[] = [];
  const add = (s: string) => { if (!tips.includes(s)) tips.push(s); };
  const ops = align(Array.from(t), Array.from(y), (a, b) => a === b);
  // Runs of changes: what the word has there (want) against what the kid wrote (got)
  const runs: Array<{ want: string; got: string }> = [];
  ops.forEach((o, i) => {
    if (o.k === '=') return;
    const prev = ops[i - 1];
    if (!prev || prev.k === '=') runs.push({ want: '', got: '' });
    const run = runs[runs.length - 1];
    if (o.k === '-') run.want += o.t; else run.got += o.t;
  });
  for (const { want, got } of runs) {
    if (want && got && plain(want) === plain(got)) {
      const acc = Array.from(want).find((c) => ACUTE.includes(c));
      if (acc) add(es ? `Lleva tilde en la «${acc}».` : `It has an accent: «${acc}».`);
      else if (want.includes('ñ')) add(es ? 'Lleva ñ.' : 'It has an ñ.');
      else if (want.includes('ü')) add(es ? 'Lleva diéresis: «ü».' : 'It has a «ü».');
      else add(es ? 'No lleva tilde ahí.' : 'No accent there.');
    } else if (want === 'h' && !got) add(es ? 'Lleva h, aunque no suena.' : 'It has a silent h.');
    else if (got === 'h' && !want) add(es ? 'No lleva h.' : 'There is no h.');
    else if (want && got) add(es ? `Se escribe con «${want}», no con «${got}».` : `It's spelled with «${want}», not «${got}».`);
    else if (want) add(es ? `Te faltó «${want}».` : `You missed «${want}».`);
    else add(es ? `Sobra «${got}».` : `There's no «${got}».`);
    if (tips.length >= 2) break;
  }
  return tips;
}

// ---- wrong spellings for the pick game -----------------------------------------------------------------------------

type Rule = [RegExp, (m: string) => string];
const V = 'aeiouáéíóú';
const EI = '[eiéí]';

/** The usual mix-ups in Spanish spelling: letters that sound alike, the silent h, accents */
const ES_RULES: Rule[] = [
  [/b/g, () => 'v'], [/v/g, () => 'b'],
  [/ll/g, () => 'y'], [new RegExp(`y(?=[${V}])`, 'g'), () => 'll'],
  [new RegExp(`c(?=${EI})`, 'g'), () => 's'], [/z/g, () => 's'], [new RegExp(`s(?=${EI})`, 'g'), () => 'c'], [/s(?=[aouáóú])/g, () => 'z'],
  [new RegExp(`g(?=${EI})`, 'g'), () => 'j'], [new RegExp(`j(?=${EI})`, 'g'), () => 'g'],
  [/rr/g, () => 'r'], [new RegExp(`[${V}]r(?=[${V}])`, 'g'), (m) => m + 'r'],
  [/x/g, () => 's'], [/cc/g, () => 'c'], [new RegExp(`sc(?=${EI})`, 'g'), () => 's'],
  [/mb/g, () => 'nb'], [/mp/g, () => 'np'],
  [new RegExp(`qu(?=${EI})`, 'g'), () => 'k'], [new RegExp(`gu(?=${EI})`, 'g'), () => 'g'], [/gü/g, () => 'gu'],
  [/ñ/g, () => 'n'], [/(?:[aeiou])y$/g, (m) => m[0] + 'i'],
];

const EN_RULES: Rule[] = [
  [/ie/g, () => 'ei'], [/ei/g, () => 'ie'],
  [/([bcdfgklmnprstz])\1/g, (m) => m[0]], [/[aeiou][bdglmnpt](?=[aeiouy])/g, (m) => m + m[1]],
  [/ph/g, () => 'f'], [/c(?=[aou])/g, () => 'k'], [/ck/g, () => 'k'], [/tion/g, () => 'sion'],
  [/([^aeiou])e$/g, (m) => m[0]], [/ea/g, () => 'ee'], [/ee/g, () => 'ea'], [/wh/g, () => 'w'], [/kn/g, () => 'n'], [/ou/g, () => 'ow'],
];

const FR_RULES: Rule[] = [
  [/é/g, () => 'e'], [/è/g, () => 'é'], [/ê/g, () => 'è'], [/à/g, () => 'a'], [/ç/g, () => 'c'],
  [/([lmnprst])\1/g, (m) => m[0]], [/eau/g, () => 'au'], [/ph/g, () => 'f'], [/(?:[aeiou])s(?=[aeiou])/g, (m) => m + 's'],
];

const ACCENT_ON: Record<string, string> = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' };
const ACCENT_OFF: Record<string, string> = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' };

/** Every wrong spelling one mix-up away from a single lowercase word */
function variantsOf(word: string, lang: string): Set<string> {
  const out = new Set<string>();
  const rules = lang === 'en' ? EN_RULES : lang === 'fr' ? FR_RULES : ES_RULES;
  for (const [re, rep] of rules) {
    const r = new RegExp(re.source, 'g');
    let m: RegExpExecArray | null;
    while ((m = r.exec(word))) {
      out.add(word.slice(0, m.index) + rep(m[0]) + word.slice(m.index + m[0].length));
      if (!m[0]) r.lastIndex++;
    }
  }
  if (lang === 'es') {
    // The silent h: left out, or added before a vowel at the start
    Array.from(word).forEach((c, i) => { if (c === 'h' && word[i - 1] !== 'c') out.add(word.slice(0, i) + word.slice(i + 1)); });
    if (new RegExp(`^[${V}]`).test(word)) out.add('h' + word);
    // Accents: dropped, or put on a vowel that has none
    const chars = Array.from(word);
    const accented = chars.findIndex((c) => c in ACCENT_OFF);
    if (accented >= 0) out.add(chars.map((c, i) => (i === accented ? ACCENT_OFF[c] : c)).join(''));
    const vowels = chars.map((c, i) => (c in ACCENT_ON ? i : -1)).filter((i) => i >= 0);
    if (chars.length >= 3) {
      vowels.slice(-2).forEach((vi) => {
        const next = chars.map((c, i) => (i === vi ? ACCENT_ON[c] : i === accented ? ACCENT_OFF[c] : c)).join('');
        if (next !== word) out.add(next);
      });
    }
  }
  out.delete(word);
  return out;
}

/** Plain slips any word can get: a doubled letter, a missing one, two swapped */
function slipsOf(word: string): string[] {
  const chars = Array.from(word);
  if (chars.length < 3) return [word + word[word.length - 1]];
  const out: string[] = [];
  const mid = 1 + Math.floor((chars.length - 2) / 2);
  out.push([...chars.slice(0, mid), chars[mid], ...chars.slice(mid)].join(''));
  out.push([...chars.slice(0, mid), ...chars.slice(mid + 1)].join(''));
  if (chars[mid] !== chars[mid + 1] && mid + 1 < chars.length) out.push([...chars.slice(0, mid), chars[mid + 1], chars[mid], ...chars.slice(mid + 2)].join(''));
  return out.filter((x) => x !== word);
}

const withCase = (like: string, w: string) => (like[0] && like[0] !== like[0].toLowerCase() ? w.charAt(0).toUpperCase() + w.slice(1) : w);

function wrongWords(word: string, lang: string): string[] {
  const core = word.toLowerCase();
  const list = Array.from(variantsOf(core, lang));
  return (list.length >= 3 ? list : [...list, ...slipsOf(core).filter((x) => !list.includes(x))]).map((x) => withCase(word, x));
}

/**
 * The spellings shown in a pick round: the right one and up to three wrong ones, shuffled. `avoid` holds the other
 * entries of the list, so a wrong spelling is never another word the kid has to learn (tuvo / tubo).
 */
export function pickChoices(entry: string, lang: string, avoid: Set<string>): string[] {
  const right = squash(entry);
  const ok = (x: string) => x !== right && !avoid.has(wordKey(x));
  let wrong: string[];
  if (!isSentence(right)) {
    const core = edges(right);
    const at = right.indexOf(core);
    wrong = shuffle(wrongWords(core, lang)).map((x) => right.slice(0, at) + x + right.slice(at + core.length));
  } else {
    // A sentence: each wrong one has one word misspelled, a different word each time when it can
    const words = right.split(' ');
    const spots = shuffle(words.map((w, i) => ({ i, core: edges(w) })).filter((s) => Array.from(s.core).length >= 3))
      .map((s) => ({ ...s, opts: shuffle(wrongWords(s.core, lang)) }));
    const made: string[] = [];
    for (let round = 0; made.length < 3 && round < 3; round++) {
      for (const s of spots) {
        const pick = s.opts[round];
        if (!pick) continue;
        const next = words.map((w, i) => (i === s.i ? w.replace(s.core, pick) : w)).join(' ');
        if (!made.includes(next)) made.push(next);
        if (made.length >= 3) break;
      }
    }
    wrong = made;
  }
  const unique = Array.from(new Set(wrong.filter(ok))).slice(0, 3);
  return shuffle([right, ...unique]);
}

// ---- picking the words of a round --------------------------------------------------------------------------------

export type WordFilter = 'all' | 'missed' | 'new';

export const isMissed = (stats: WordList['stats'], w: string) => stats[wordKey(w)]?.last === false;
export const isNew = (stats: WordList['stats'], w: string) => !stats[wordKey(w)];
export const isKnown = (stats: WordList['stats'], w: string) => stats[wordKey(w)]?.last === true;

export function filterEntries(entries: WordEntry[], stats: WordList['stats'], filter: WordFilter): WordEntry[] {
  if (filter === 'missed') return entries.filter((e) => isMissed(stats, e.w));
  if (filter === 'new') return entries.filter((e) => isNew(stats, e.w));
  return entries;
}

/** Up to `count` entries for a round: the ones missed last time first, then new ones, then the rest; shuffled */
export function roundEntries(pool: WordEntry[], stats: WordList['stats'], count: number | null): WordEntry[] {
  if (count == null || pool.length <= count) return shuffle(pool);
  const missed = shuffle(pool.filter((e) => isMissed(stats, e.w)));
  const fresh = shuffle(pool.filter((e) => isNew(stats, e.w)));
  // Known words: the ones practiced longest ago first
  const known = pool.filter((e) => isKnown(stats, e.w)).sort((a, b) => (stats[wordKey(a.w)]!.at < stats[wordKey(b.w)]!.at ? -1 : 1));
  return shuffle([...missed, ...fresh, ...known].slice(0, count));
}

/** Stats after a round. `played` is each entry with whether it was right on the first try. */
export function nextStats(prev: WordList['stats'], played: Array<{ w: string; ok: boolean }>, at = new Date().toISOString()): WordList['stats'] {
  const next = { ...prev };
  played.forEach(({ w, ok }) => {
    const k = wordKey(w);
    const s: WordStat = next[k] || { ok: 0, miss: 0, last: false, at };
    next[k] = { ok: s.ok + (ok ? 1 : 0), miss: s.miss + (ok ? 0 : 1), last: ok, at };
  });
  return next;
}

// ---- saving --------------------------------------------------------------------------------------------------------

export function wordListFromRow(r: Record<string, unknown>): WordList {
  return {
    id: r.id as string,
    subject: r.subject as string,
    title: r.title as string,
    words: (r.words as string[]) || [],
    testDate: (r.test_date as string) || undefined,
    lang: isContentLang(r.lang) ? r.lang : undefined,
    createdAt: (r.created_at as string) || undefined,
    stats: r.stats && typeof r.stats === 'object' ? (r.stats as WordList['stats']) : {},
  };
}

// The demo has no database: its lists live on the kid in the store
const demoLists = (kidId: string) => useStore.getState().kids.find((k) => k.id === kidId)?.wordLists || [];
const saveDemo = (kidId: string, lists: WordList[]) => useStore.getState().updateKid(kidId, { wordLists: lists });

/** Lists of a kid in one subject, newest first */
export async function loadWordLists(kidId: string, subject: string, isDemo: boolean): Promise<WordList[]> {
  if (isDemo) return demoLists(kidId).filter((l) => l.subject === subject).reverse();
  const { data, error } = await createClient().from('kid_word_lists').select('*').eq('kid_id', kidId).eq('subject', subject).order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(wordListFromRow);
}

/** Lists across subjects whose dictation is today or later, soonest first */
export async function loadUpcomingWordLists(kidId: string, isDemo: boolean, now = new Date()): Promise<WordList[]> {
  let all: WordList[];
  if (isDemo) all = demoLists(kidId);
  else {
    const { data, error } = await createClient().from('kid_word_lists').select('*').eq('kid_id', kidId).not('test_date', 'is', null).order('test_date').limit(20);
    if (error) throw error;
    all = (data || []).map(wordListFromRow);
  }
  return all.filter((l) => l.testDate && daysUntil(l.testDate, now) >= 0).sort((a, b) => a.testDate!.localeCompare(b.testDate!));
}

export interface WordListInput { title: string; words: string[]; testDate?: string; lang?: WordList['lang'] }

/** Adds a list, or saves changes to `existing`. Stats of words that are no longer in the list are dropped. */
export async function saveWordList(kidId: string, subject: string, input: WordListInput, isDemo: boolean, existing?: WordList): Promise<WordList> {
  const words = input.words.slice(0, MAX_WORDS);
  const keys = new Set(words.map((w) => wordKey(parseEntry(w).w)));
  const stats = Object.fromEntries(Object.entries(existing?.stats || {}).filter(([k]) => keys.has(k)));
  const title = input.title.trim().slice(0, 80);
  if (isDemo) {
    const list: WordList = { id: existing?.id || 'demo-' + Math.random().toString(36).slice(2, 9), subject, title, words, testDate: input.testDate || undefined, lang: input.lang ?? existing?.lang, createdAt: existing?.createdAt || new Date().toISOString(), stats };
    const all = demoLists(kidId);
    saveDemo(kidId, existing ? all.map((l) => (l.id === list.id ? list : l)) : [...all, list]);
    return list;
  }
  const row = { title, words, test_date: input.testDate || null, lang: input.lang ?? existing?.lang ?? null, stats };
  const supabase = createClient();
  const { data, error } = existing
    ? await supabase.from('kid_word_lists').update(row).eq('id', existing.id).eq('kid_id', kidId).select('*').single()
    : await supabase.from('kid_word_lists').insert({ ...row, kid_id: kidId, subject }).select('*').single();
  if (error || !data) { console.warn('Could not save word list:', error); throw new Error('Could not save word list'); }
  return wordListFromRow(data);
}

export async function saveWordStats(kidId: string, list: WordList, stats: WordList['stats'], isDemo: boolean): Promise<void> {
  if (isDemo) { saveDemo(kidId, demoLists(kidId).map((l) => (l.id === list.id ? { ...l, stats } : l))); return; }
  const { error } = await createClient().from('kid_word_lists').update({ stats }).eq('id', list.id).eq('kid_id', kidId);
  if (error) console.warn('Could not save word stats:', error);
}

export async function removeWordList(kidId: string, id: string, isDemo: boolean): Promise<boolean> {
  if (isDemo) { saveDemo(kidId, demoLists(kidId).filter((l) => l.id !== id)); return true; }
  const { error } = await createClient().from('kid_word_lists').delete().eq('id', id).eq('kid_id', kidId);
  if (error) console.warn('Could not remove word list:', error);
  return !error;
}

/** "Today", "Tomorrow", "In 5 days", or the date once it has passed */
export function dateLabel(date: string, lang: string): string {
  const es = lang === 'es';
  const d = daysUntil(date);
  if (d === 0) return es ? '¡Hoy!' : 'Today!';
  if (d === 1) return es ? 'Mañana' : 'Tomorrow';
  if (d > 1) return es ? `En ${d} días` : `In ${d} days`;
  return new Date(date + 'T00:00').toLocaleDateString(es ? 'es-DO' : 'en-US', { month: 'short', day: 'numeric' });
}

/** The list to open first: the next dictation coming up, else the newest. `lists` must be newest first. */
export function defaultWordList(lists: WordList[]): WordList | undefined {
  const coming = lists.filter((l) => l.testDate && daysUntil(l.testDate) >= 0).sort((a, b) => a.testDate!.localeCompare(b.testDate!));
  return coming[0] || lists[0];
}

/** How far the kid is with a list: words right the last time, and the ones to go over again */
export function listProgress(list: WordList): { total: number; known: number; missed: string[] } {
  const entries = list.words.map(parseEntry);
  return {
    total: entries.length,
    known: entries.filter((e) => isKnown(list.stats, e.w)).length,
    missed: entries.filter((e) => isMissed(list.stats, e.w)).map((e) => e.w),
  };
}
