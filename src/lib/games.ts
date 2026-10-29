/** Ways to learn a subject: "flip" is the flashcard quiz, "tf" and "fill" are quick games played on /kids/subject/[subject]/play */
export type GameMode = 'flip' | 'tf' | 'fill';
export type GameKind = Exclude<GameMode, 'flip'>;

/** Bump when a game's format changes, so cached rounds in the old format are not served */
export const GAME_VERSION = 1;

/** Most topics one round can mix (same limit as a school test) */
export const MAX_GAME_TOPICS = 8;

export interface TfItem {
  topic?: string;
  /** A statement, not a question */
  s: string;
  a: boolean;
  /** The corrected statement, for false ones */
  fix?: string;
}

export interface FillItem {
  topic?: string;
  /** Sentence with exactly one "___" blank */
  s: string;
  a: string;
  /** The answer and its look-alikes, in the order the kid sees them */
  choices: string[];
}

export interface GameItems {
  tf: TfItem[];
  fill: FillItem[];
}

export interface GameRound<K extends GameKind = GameKind> {
  items: GameItems[K];
  v: number;
}

export interface GameMeta {
  id: GameMode;
  emoji: string;
  /** Color family: --{tone}-l for the background, --{tone} for the accent */
  tone: 'primary' | 'sky' | 'honey' | 'coral' | 'berry';
  en: { title: string; sub: string };
  es: { title: string; sub: string };
}

export const GAME_MODES: GameMeta[] = [
  { id: 'flip', emoji: '🃏', tone: 'primary', en: { title: 'Flip cards', sub: 'Pick the answer, flip for a hint' }, es: { title: 'Tarjetas', sub: 'Elige la respuesta, gira para una pista' } },
  { id: 'tf', emoji: '⚡', tone: 'sky', en: { title: 'True or false', sub: 'Read the card and decide fast' }, es: { title: 'Verdadero o falso', sub: 'Lee la tarjeta y decide rápido' } },
  { id: 'fill', emoji: '🧩', tone: 'coral', en: { title: 'Fill the blank', sub: 'Finish the sentence with the right word' }, es: { title: 'Completa la oración', sub: 'Termina la oración con la palabra correcta' } },
];

export const isGameMode = (v: unknown): v is GameMode => GAME_MODES.some((m) => m.id === v);

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const BLANK = /_{2,}|\[blank\]|…{2,}|\.{4,}/i;
/** Case and spacing do not tell two choices apart; accents do ("esta" and "está" are different words) */
const fold = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

export function shuffle<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Stars for a finished round, 1-5, like the quiz and practice test */
export const starsFor = (pct: number) => (pct >= 90 ? 5 : pct >= 75 ? 4 : pct >= 60 ? 3 : pct >= 40 ? 2 : 1);

/**
 * Cleans model output into a round: drops malformed items. With `topics`, each item's topic is matched to one of
 * them (written back exactly as given) or dropped; without, topics are kept as they are (a saved round).
 */
export function normalizeGame<K extends GameKind>(kind: K, v: unknown, topics?: string[]): GameRound<K> {
  const raw = v && typeof v === 'object' ? (v as { items?: unknown }) : {};
  const byName = new Map((topics || []).map((t) => [t.trim().toLowerCase(), t]));
  const topicOf = (t: unknown) => (topics ? (typeof t === 'string' ? byName.get(t.trim().toLowerCase()) : undefined) : str(t) || undefined);
  const list = (Array.isArray(raw.items) ? raw.items : []).filter((x): x is Record<string, unknown> => !!x && typeof x === 'object');

  if (kind === 'tf') {
    const items = list.flatMap((x): TfItem[] => {
      const s = str(x.s);
      const a = x.a === true || x.a === 'true';
      const fix = str(x.fix);
      return s ? [{ topic: topicOf(x.topic), s, a, ...(!a && fix ? { fix } : {}) }] : [];
    });
    return { items: items as GameItems[K], v: GAME_VERSION };
  }

  const items = list.flatMap((x): FillItem[] => {
    const s = str(x.s).replace(BLANK, '___');
    const a = str(x.a);
    if (!a || s.split('___').length !== 2) return [];
    // The answer plus its look-alikes, once each, up to 4 tiles
    const seen = new Set([fold(a)]);
    const others = [...(Array.isArray(x.wrong) ? x.wrong : []), ...(Array.isArray(x.choices) ? x.choices : [])]
      .map(str)
      .filter((c) => c && !seen.has(fold(c)) && !!seen.add(fold(c)));
    const choices = shuffle([a, ...others.slice(0, 3)]);
    return choices.length >= 3 ? [{ topic: topicOf(x.topic), s, a, choices }] : [];
  });
  return { items: items as GameItems[K], v: GAME_VERSION };
}

/** A cached round in the current format, or null */
export function toGame<K extends GameKind>(kind: K, v: unknown): GameRound<K> | null {
  if (!v || typeof v !== 'object' || (v as { v?: unknown }).v !== GAME_VERSION) return null;
  const round = normalizeGame(kind, v);
  return round.items.length ? round : null;
}

/** The text of an item, to tell kids' earlier rounds apart (sent as `exclude` when asking for new ones) */
export const itemText = (it: TfItem | FillItem) => it.s;

/** Sample rounds for when a new one cannot be made (no connection, demo) */
export function sampleGame<K extends GameKind>(kind: K, lang: string, topics: string[]): GameRound<K> {
  const es = lang === 'es';
  const tf: TfItem[] = es
    ? [
      { s: 'La Tierra gira alrededor del Sol.', a: true },
      { s: 'La Luna produce su propia luz.', a: false, fix: 'La Luna refleja la luz del Sol.' },
      { s: 'Marte es conocido como el Planeta Rojo.', a: true },
      { s: 'El Sol es un planeta.', a: false, fix: 'El Sol es una estrella.' },
      { s: 'Júpiter es el planeta más grande.', a: true },
      { s: 'Mercurio es el planeta más lejano del Sol.', a: false, fix: 'Mercurio es el planeta más cercano al Sol.' },
    ]
    : [
      { s: 'Earth goes around the Sun.', a: true },
      { s: 'The Moon makes its own light.', a: false, fix: 'The Moon reflects light from the Sun.' },
      { s: 'Mars is known as the Red Planet.', a: true },
      { s: 'The Sun is a planet.', a: false, fix: 'The Sun is a star.' },
      { s: 'Jupiter is the largest planet.', a: true },
      { s: 'Mercury is the planet farthest from the Sun.', a: false, fix: 'Mercury is the planet closest to the Sun.' },
    ];
  const fill: FillItem[] = (es
    ? [
      { s: 'El camino de un planeta alrededor del Sol se llama ___.', a: 'órbita', choices: ['órbita', 'estrella', 'cometa', 'luna'] },
      { s: 'La Tierra tarda un ___ en dar la vuelta al Sol.', a: 'año', choices: ['año', 'día', 'mes', 'minuto'] },
      { s: 'El planeta con anillos famosos es ___.', a: 'Saturno', choices: ['Saturno', 'Marte', 'Venus', 'Mercurio'] },
      { s: 'El Sol es una ___.', a: 'estrella', choices: ['estrella', 'luna', 'nube', 'roca'] },
      { s: 'La ___ da vueltas alrededor de la Tierra.', a: 'Luna', choices: ['Luna', 'Estrella', 'Marte', 'Nube'] },
    ]
    : [
      { s: 'The path a planet follows around the Sun is called an ___.', a: 'orbit', choices: ['orbit', 'star', 'comet', 'moon'] },
      { s: 'Earth takes one ___ to go around the Sun.', a: 'year', choices: ['year', 'day', 'month', 'minute'] },
      { s: 'The planet with famous rings is ___.', a: 'Saturn', choices: ['Saturn', 'Mars', 'Venus', 'Mercury'] },
      { s: 'The Sun is a ___.', a: 'star', choices: ['star', 'moon', 'cloud', 'rock'] },
      { s: 'The ___ goes around the Earth.', a: 'Moon', choices: ['Moon', 'Star', 'Mars', 'Cloud'] },
    ]).map((x) => ({ ...x, choices: shuffle(x.choices) }));
  // Samples are not about the real topics: spread them over the picked ones so the per-topic view still works
  const spread = <T extends { topic?: string }>(items: T[]): T[] => items.map((it, i) => ({ ...it, topic: topics[i % Math.max(1, topics.length)] }));
  return { items: (kind === 'tf' ? spread(tf) : spread(fill)) as GameItems[K], v: GAME_VERSION };
}
