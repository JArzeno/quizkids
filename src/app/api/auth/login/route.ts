import { NextRequest } from 'next/server';
import { startSession, verifyPassword } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { HttpError, route } from '@/lib/http';

export async function POST(req: NextRequest) {
  return route(async () => {
    const { email, password } = await req.json();
    if (typeof email !== 'string' || typeof password !== 'string') {
      throw new HttpError(400, 'Enter your email and password');
    }

    const user = await queryOne<{ id: string; email: string; name: string | null; password_hash: string }>(
      'select id, email, name, password_hash from users where lower(email) = $1',
      [email.trim().toLowerCase()]
    );

    // Same message either way so the response can't be used to probe for accounts.
    const invalid = new HttpError(401, 'Invalid email or password');
    if (!user || !(await verifyPassword(password, user.password_hash))) throw invalid;

    const session = { id: user.id, email: user.email, name: user.name };
    await startSession(session);
    return { user: session };
  });
}
