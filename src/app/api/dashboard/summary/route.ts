import { requireUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { route } from '@/lib/http';

/**
 * Everything the parent dashboard needs in one round trip: the kids on the
 * account plus the quiz results and study sessions belonging to them. The
 * per-kid rollup stays on the client, same as before the migration.
 */
export async function GET() {
  return route(async () => {
    const user = await requireUser();

    const kids = await query('select * from kids where parent_id = $1 order by created_at', [user.id]);
    if (kids.length === 0) return { kids, quizResults: [], studySessions: [] };

    const kidIds = kids.map((k) => k.id as string);

    const [quizResults, studySessions] = await Promise.all([
      query(
        `select kid_id, subject, topic, correct, total, stars, created_at
           from quiz_results
          where kid_id = any($1::uuid[])
          order by created_at`,
        [kidIds]
      ),
      query(
        `select kid_id, minutes from study_sessions where kid_id = any($1::uuid[])`,
        [kidIds]
      ),
    ]);

    return { kids, quizResults, studySessions };
  });
}
