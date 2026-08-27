import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { assertOwnsAssignment, assertOwnsKid, badRequest, route } from '@/lib/http';

/** POST /api/quiz-results — store a completed quiz and close out its assignment. */
export async function POST(req: NextRequest) {
  return route(async () => {
    const user = await requireUser();
    const body = await req.json();

    const kidId = body.kid_id;
    if (typeof kidId !== 'string') throw badRequest('kid_id is required');
    await assertOwnsKid(user.id, kidId);

    // A missing link can arrive as null, undefined or '' depending on the caller;
    // anything else has to be a real assignment on this account.
    const assignmentId = body.assignment_id == null || body.assignment_id === '' ? null : body.assignment_id;
    if (assignmentId !== null) await assertOwnsAssignment(user.id, assignmentId);

    const result = await queryOne(
      `insert into quiz_results
         (kid_id, assignment_id, subject, topic, grade, difficulty, total, correct, stars, lang)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       returning *`,
      [
        kidId,
        assignmentId,
        body.subject ?? null,
        body.topic ?? null,
        body.grade ?? null,
        body.difficulty ?? null,
        body.total ?? null,
        body.correct ?? null,
        body.stars ?? 0,
        body.lang ?? 'en',
      ]
    );

    // Saving a result implies the assignment is done — one round trip instead of two.
    if (assignmentId !== null) {
      await queryOne('update kid_assignments set status = $2 where id = $1 returning id', [
        assignmentId,
        'completed',
      ]);
    }

    return { result };
  });
}
