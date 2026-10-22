import { NextRequest, NextResponse } from 'next/server';
import { exchangeCode, NEXT_COOKIE, returnUrl, STATE_COOKIE, writeTokens } from '@/lib/google-classroom';

/** Google redirects here after consent; stores tokens and returns to the page that started the sign-in. */
export async function GET(req: NextRequest) {
  const next = req.cookies.get(NEXT_COOKIE)?.value;
  const back = (error?: string) => {
    const res = NextResponse.redirect(returnUrl(req, next, error));
    res.cookies.set(STATE_COOKIE, '', { path: '/api/classroom', maxAge: 0 });
    res.cookies.set(NEXT_COOKIE, '', { path: '/api/classroom', maxAge: 0 });
    return res;
  };
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const expected = req.cookies.get(STATE_COOKIE)?.value;

  if (req.nextUrl.searchParams.get('error')) return back('denied');
  if (!code || !state || state !== expected) return back('state');

  try {
    const tokens = await exchangeCode(req, code);
    const res = back();
    writeTokens(res, tokens);
    return res;
  } catch (err) {
    console.error('Classroom OAuth error:', err);
    return back('oauth');
  }
}
