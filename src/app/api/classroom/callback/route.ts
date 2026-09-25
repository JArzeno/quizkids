import { NextRequest, NextResponse } from 'next/server';
import { exchangeCode, STATE_COOKIE, writeTokens } from '@/lib/google-classroom';

/** Google redirects here after consent; stores tokens and returns to the Classroom page. */
export async function GET(req: NextRequest) {
  const back = (error?: string) => new URL(`/dashboard/classroom${error ? `?error=${error}` : ''}`, req.url);
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const expected = req.cookies.get(STATE_COOKIE)?.value;

  if (req.nextUrl.searchParams.get('error')) return NextResponse.redirect(back('denied'));
  if (!code || !state || state !== expected) return NextResponse.redirect(back('state'));

  try {
    const tokens = await exchangeCode(req, code);
    const res = NextResponse.redirect(back());
    writeTokens(res, tokens);
    res.cookies.set(STATE_COOKIE, '', { path: '/api/classroom', maxAge: 0 });
    return res;
  } catch (err) {
    console.error('Classroom OAuth error:', err);
    return NextResponse.redirect(back('oauth'));
  }
}
