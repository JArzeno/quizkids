import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { assertOwnsKid, badRequest, isUuid, route } from '@/lib/http';

/** GET /api/assignments?kidId=... — a kid's assignments, newest first. */
export async function GET(req: NextRequest) {
  return route(async () => {
    const user = await requireUser();
    const kidId = req.nextUrl.searchParams.get('kidId');
    if (!kidId) throw badRequest('kidId is required');
    await assertOwnsKid(user.id, kidId);

    const assignments = await query(
      `select id, subject, topic, grade, type, status, assigned_at, content_id
         from kid_assignments
        where kid_id = $1
        order by assigned_at desc
        limit 40`,
      [kidId]
    );

    // The kid home screen stitches quiz scores onto assignments, so they ship together.
    const results = await query(
      'select assignment_id, stars, correct, total from quiz_results where kid_id = $1',
      [kidId]
    );

    return { assignments, results };
  });
}

/** POST /api/assignments — hand a freshly generated piece of content to a kid. */
export async function POST(req: NextRequest) {
  return route(async () => {
    const user = await requireUser();
    const body = await req.json();

    const kidId = body.kid_id;
    if (typeof kidId !== 'string') throw badRequest('kid_id is required');
    await assertOwnsKid(user.id, kidId);

    const contentId = body.content_id == null || body.content_id === '' ? null : body.content_id;
    if (contentId !== null && !isUuid(contentId)) throw badRequest('Invalid content_id');

    const assignment = await queryOne(
      `insert into kid_assignments (kid_id, content_id, subject, topic, grade, type, status)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning *`,
      [
        kidId,
        contentId,
        body.subject ?? null,
        body.topic ?? null,
        body.grade ?? null,
        body.type ?? null,
        body.status ?? 'pending',
      ]
    );
    return { assignment };
  });
}
