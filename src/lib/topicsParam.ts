/** Reads the optional `topics` list of a generate request: 1-8 topic names, or [] when there is none */
export function listedTopics(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return Array.from(new Set(v.filter((x): x is string => typeof x === 'string').map((x) => x.trim().slice(0, 100)).filter(Boolean))).slice(0, 8);
}

/** The `topics` list of a generate request when it has 2+ topics (max 8), or undefined for a single-topic request */
export function parseTopics(v: unknown): string[] | undefined {
  const list = listedTopics(v);
  return list.length > 1 ? list : undefined;
}

/**
 * What the content is about. A school test is named by the parent or kid ("Unit 2 test"), so when it covers a
 * single topic the content is about that topic, not the name.
 */
export function promptTopic(topic: string, v: unknown): string {
  const list = listedTopics(v);
  return list.length === 1 ? list[0] : topic;
}
