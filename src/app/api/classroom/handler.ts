import { NextRequest, NextResponse } from 'next/server';
import { clearTokens, freshTokens, isConfigured, NotConnectedError, readTokens, writeTokens } from '@/lib/google-classroom';

/** Runs a Classroom call with a valid access token; 503 = not set up, 401 = needs (re)connect. */
export async function withClassroom<T>(req: NextRequest, fn: (accessToken: string) => Promise<T>) {
  if (!isConfigured()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  const stored = readTokens(req);
  if (!stored) return NextResponse.json({ error: 'not_connected' }, { status: 401 });

  try {
    const { tokens, refreshed } = await freshTokens(stored);
    const res = NextResponse.json(await fn(tokens.access_token));
    if (refreshed) writeTokens(res, tokens);
    return res;
  } catch (err) {
    if (err instanceof NotConnectedError) {
      const res = NextResponse.json({ error: 'not_connected' }, { status: 401 });
      clearTokens(res);
      return res;
    }
    console.error('Classroom API error:', err);
    return NextResponse.json({ error: 'classroom_failed' }, { status: 502 });
  }
}
