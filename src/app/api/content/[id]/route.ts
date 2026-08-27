import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { badRequest, isUuid, notFound, route } from '@/lib/http';

/**
 * GET /api/content/:id — a cached quiz/guide/worksheet body.
 * Generated content is shared across accounts (it's a cache keyed by topic, not
 * per-family data), so any signed-in parent may read it — the same rule the old
 * `content_read` RLS policy enforced.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    await requireUser();
    const { id } = await params;
    if (!isUuid(id)) throw badRequest('Invalid content id');

    const row = await queryOne<{ id: string; content: unknown }>(
      'select id, content from generated_content where id = $1',
      [id]
    );
    if (!row) throw notFound('Content not found');
    return { content: row.content, id: row.id };
  });
}
