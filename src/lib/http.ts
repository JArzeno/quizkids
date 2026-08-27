import { NextResponse } from 'next/server';
import { UnauthorizedError } from '@/lib/auth';
import { queryOne } from '@/lib/db';

/**
 * Wraps a route handler so thrown errors become sensible JSON responses.
 * Replaces what Supabase RLS used to do for us: an ownership check that fails
 * closed, surfaced as 401/403 rather than a 500.
 */
export async function route<T>(fn: () => Promise<T>): Promise<NextResponse> {
  try {
    return NextResponse.json(await fn());
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    }
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('API error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}

export const badRequest = (message: string) => new HttpError(400, message);
export const forbidden = (message = 'Not allowed') => new HttpError(403, message);
export const notFound = (message = 'Not found') => new HttpError(404, message);

/** Throws unless the kid belongs to the signed-in parent. */
export async function assertOwnsKid(parentId: string, kidId: string): Promise<void> {
  if (!isUuid(kidId)) throw badRequest('Invalid kid id');
  const kid = await queryOne('select 1 from kids where id = $1 and parent_id = $2', [kidId, parentId]);
  if (!kid) throw forbidden('That kid is not on your account');
}

/** Throws unless the assignment belongs to one of the signed-in parent's kids. */
export async function assertOwnsAssignment(parentId: string, assignmentId: string): Promise<void> {
  if (!isUuid(assignmentId)) throw badRequest('Invalid assignment id');
  const row = await queryOne(
    `select 1 from kid_assignments a
       join kids k on k.id = a.kid_id
      where a.id = $1 and k.parent_id = $2`,
    [assignmentId, parentId]
  );
  if (!row) throw forbidden('That assignment is not on your account');
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Postgres throws on a malformed uuid literal, so ids are shape-checked first. */
export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}
