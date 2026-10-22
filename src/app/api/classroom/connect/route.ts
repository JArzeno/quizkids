import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { authUrl, isConfigured, STATE_COOKIE } from '@/lib/google-classroom';

/** Starts the Google sign-in for Classroom (read-only scopes). */
export async function GET(req: NextRequest) {
  if (!isConfigured()) {
    return NextResponse.redirect(new URL('/dashboard/classroom?error=not_configured', req.url));
  }
  const state = crypto.randomBytes(16).toString('hex');
  const res = NextResponse.redirect(authUrl(req, state));
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/classroom',
    maxAge: 600,
  });
  return res;
}
