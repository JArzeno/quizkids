/** Reads the optional `topics` list of a generate request: 2+ topic names (max 8), or undefined for a single-topic request */
export function parseTopics(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const list = Array.from(new Set(v.filter((x): x is string => typeof x === 'string').map((x) => x.trim().slice(0, 100)).filter(Boolean))).slice(0, 8);
  return list.length > 1 ? list : undefined;
}
