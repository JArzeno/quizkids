/** Levels and medals: a kid's level comes from the stars (points) they have earned; each level from 2 up unlocks a medal */

export interface Level {
  n: number;
  /** Stars needed to reach this level */
  from: number;
  medal: MedalId;
  en: string;
  es: string;
}

export type MedalId = 'seed' | 'rocket' | 'bolt' | 'shield' | 'compass' | 'gem' | 'crown' | 'galaxy' | 'trophy' | 'sun';

export const LEVELS: Level[] = [
  { n: 1, from: 0, medal: 'seed', en: 'Seedling', es: 'Semillita' },
  { n: 2, from: 10, medal: 'rocket', en: 'Rocket', es: 'Cohete' },
  { n: 3, from: 25, medal: 'bolt', en: 'Lightning', es: 'Relámpago' },
  { n: 4, from: 50, medal: 'shield', en: 'Guardian', es: 'Guardián' },
  { n: 5, from: 90, medal: 'compass', en: 'Explorer', es: 'Explorador' },
  { n: 6, from: 140, medal: 'gem', en: 'Gem Hunter', es: 'Cazagemas' },
  { n: 7, from: 200, medal: 'crown', en: 'Champion', es: 'Campeón' },
  { n: 8, from: 280, medal: 'galaxy', en: 'Star Traveler', es: 'Viajero estelar' },
  { n: 9, from: 380, medal: 'trophy', en: 'Legend', es: 'Leyenda' },
  { n: 10, from: 500, medal: 'sun', en: 'Super Brain', es: 'Supercerebro' },
];

export interface LevelInfo {
  level: Level;
  next: Level | null;
  /** Stars earned inside this level, and the stars this level spans (0 for the last level) */
  into: number;
  span: number;
  /** 0-100 toward the next level (100 at the top) */
  pct: number;
  stars: number;
}

export function levelFor(stars: number): LevelInfo {
  const s = Math.max(0, Math.floor(stars || 0));
  let idx = 0;
  LEVELS.forEach((l, i) => { if (s >= l.from) idx = i; });
  const level = LEVELS[idx];
  const next = LEVELS[idx + 1] ?? null;
  const span = next ? next.from - level.from : 0;
  const into = s - level.from;
  return { level, next, into, span, pct: next ? Math.round((into / span) * 100) : 100, stars: s };
}

/** Levels gained going from `before` to `after` stars (the new ones, in order) */
export function levelsGained(before: number, after: number): Level[] {
  const a = levelFor(before).level.n;
  const b = levelFor(after).level.n;
  return LEVELS.filter((l) => l.n > a && l.n <= b);
}

/** Medals a kid has won with `stars` (level 1 starts with its seedling medal) */
export const medalsFor = (stars: number): Level[] => LEVELS.filter((l) => stars >= l.from);
