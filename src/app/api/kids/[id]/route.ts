import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { assertOwnsKid, badRequest, notFound, route } from '@/lib/http';

// Only these columns can be written from the client. Anything else in the body
// is ignored, so a caller can't reassign parent_id or invent columns.
const UPDATABLE = [
  'name',
  'grade',
  'avatar',
  'color',
  'goal_min',
  'streak',
  'stars',
  'minutes_total',
  'weekly_pct',
  'last_subject',
  'signature',
] as const;

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  return route(async () => {
    const user = await requireUser();
    const { id } = await params;
    await assertOwnsKid(user.id, id);

    const body = (await req.json()) as Record<string, unknown>;
    const columns = UPDATABLE.filter((c) => body[c] !== undefined);
    if (columns.length === 0) throw badRequest('Nothing to update');

    const assignments = columns.map((c, i) => `${c} = $${i + 3}`).join(', ');
    const kid = await queryOne(
      `update kids set ${assignments} where id = $1 and parent_id = $2 returning *`,
      [id, user.id, ...columns.map((c) => body[c])]
    );
    if (!kid) throw notFound('Kid not found');
    return { kid };
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  return route(async () => {
    const user = await requireUser();
    const { id } = await params;
    await assertOwnsKid(user.id, id);
    await queryOne('delete from kids where id = $1 and parent_id = $2 returning id', [id, user.id]);
    return { ok: true };
  });
}
