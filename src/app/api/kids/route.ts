import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { badRequest, route } from '@/lib/http';

export async function GET() {
  return route(async () => {
    const user = await requireUser();
    const kids = await query(
      'select * from kids where parent_id = $1 order by created_at',
      [user.id]
    );
    return { kids };
  });
}

export async function POST(req: NextRequest) {
  return route(async () => {
    const user = await requireUser();
    const body = await req.json();

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) throw badRequest('A kid needs a name');

    const kid = await queryOne(
      `insert into kids (parent_id, name, grade, avatar, color, code, signature)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning *`,
      [
        user.id,
        name,
        body.grade || 'K',
        body.avatar || 'sprout',
        body.color || '#3F7A4F',
        body.code || null,
        body.signature || null,
      ]
    );
    return { kid };
  });
}
