import { NextRequest, NextResponse } from 'next/server';
import { clearTokens, readTokens, revoke } from '@/lib/google-classroom';

export async function POST(req: NextRequest) {
  const tokens = readTokens(req);
  if (tokens) await revoke(tokens);
  const res = NextResponse.json({ ok: true });
  clearTokens(res);
  return res;
}
