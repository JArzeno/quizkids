import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { assertOwnsKid, badRequest, route } from '@/lib/http';

/** GET /api/study-sessions?kidId=...&since=<iso> — minutes studied since a moment. */
export async function GET(req: NextRequest) {
  return route(async () => {
    const user = await requireUser();
    const kidId = req.nextUrl.searchParams.get('kidId');
    if (!kidId) throw badRequest('kidId is required');
    await assertOwnsKid(user.id, kidId);

    const since = req.nextUrl.searchParams.get('since');
    if (since && Number.isNaN(Date.parse(since))) throw badRequest('since must be an ISO timestamp');

    const row = await queryOne<{ minutes: string | null }>(
      `select coalesce(sum(minutes), 0)::text as minutes
         from study_sessions
        where kid_id = $1 and ($2::timestamptz is null or started_at >= $2::timestamptz)`,
      [kidId, since]
    );

    return { minutes: Number(row?.minutes ?? 0) };
  });
}

/** POST /api/study-sessions — record a finished study session. */
export async function POST(req: NextRequest) {
  return route(async () => {
    const user = await requireUser();
    const body = await req.json();

    const kidId = body.kid_id;
    if (typeof kidId !== 'string') throw badRequest('kid_id is required');
    await assertOwnsKid(user.id, kidId);

    const minutes = Number(body.minutes);
    if (!Number.isFinite(minutes) || minutes < 0) throw badRequest('minutes must be a positive number');

    const session = await queryOne(
      `insert into study_sessions (kid_id, minutes, started_at, ended_at)
       values ($1, $2, coalesce($3::timestamptz, now()), $4::timestamptz)
       returning *`,
      [kidId, Math.round(minutes), body.started_at ?? null, body.ended_at ?? null]
    );
    return { session };
  });
}
