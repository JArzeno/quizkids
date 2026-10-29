/**
 * Gets a quiz, guide or worksheet from its /api/generate route. Saved content is asked for first (`cacheOnly`), so
 * `onCreating` runs only when new content really has to be made: the screen says "Loading…" for saved content and
 * "Creating…" only while something new is written. `fresh` skips that check for requests that are always made new
 * (more questions, several topics). Returns the response body, or null when the route failed.
 */
export async function fetchContent<T>(path: string, body: Record<string, unknown>, onCreating: () => void, fresh = false): Promise<T | null> {
  const post = (b: Record<string, unknown>) => fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });
  if (!fresh) {
    try {
      const peek = await post({ ...body, cacheOnly: true });
      if (peek.ok) {
        const data = await peek.json();
        if (data?.cached !== false) return data as T;
      }
    } catch { /* not reachable: try making it below */ }
  }
  onCreating();
  const res = await post(body);
  return res.ok ? ((await res.json()) as T) : null;
}
