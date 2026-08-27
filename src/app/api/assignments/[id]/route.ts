import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { assertOwnsAssignment, badRequest, route } from '@/lib/http';

const STATUSES = new Set(['pending', 'completed']);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const user = await requireUser();
    const { id } = await params;
    await assertOwnsAssignment(user.id, id);

    const { status } = await req.json();
    if (!STATUSES.has(status)) throw badRequest('status must be "pending" or "completed"');

    const assignment = await queryOne(
      'update kid_assignments set status = $2 where id = $1 returning *',
      [id, status]
    );
    return { assignment };
  });
}
