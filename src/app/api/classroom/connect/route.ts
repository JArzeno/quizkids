import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { authUrl, isConfigured, NEXT_COOKIE, returnUrl, safeNext, STATE_COOKIE } from '@/lib/google-classroom';

/** Starts the Google sign-in for Classroom (read-only scopes). `?next=` is the dashboard page to come back to. */
export async function GET(req: NextRequest) {
  const next = req.nextUrl.searchParams.get('next');
  if (!isConfigured()) return NextResponse.redirect(returnUrl(req, next, 'not_configured'));

  const state = crypto.randomBytes(16).toString('hex');
  const res = NextResponse.redirect(authUrl(req, state));
  const cookie = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/api/classroom', maxAge: 600 };
  res.cookies.set(STATE_COOKIE, state, cookie);
  res.cookies.set(NEXT_COOKIE, safeNext(next), cookie);
  return res;
}
