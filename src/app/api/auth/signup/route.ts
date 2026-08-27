import { NextRequest } from 'next/server';
import { hashPassword, startSession } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { badRequest, route } from '@/lib/http';

export async function POST(req: NextRequest) {
  return route(async () => {
    const { name, email, password } = await req.json();

    if (typeof email !== 'string' || !email.includes('@')) throw badRequest('Enter a valid email');
    if (typeof password !== 'string' || password.length < 8) {
      throw badRequest('Password must be at least 8 characters');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await queryOne('select 1 from users where lower(email) = $1', [normalizedEmail]);
    if (existing) throw badRequest('An account with that email already exists');

    const user = await queryOne<{ id: string; email: string; name: string | null }>(
      `insert into users (email, password_hash, name)
       values ($1, $2, $3)
       returning id, email, name`,
      [normalizedEmail, await hashPassword(password), typeof name === 'string' ? name.trim() : null]
    );
    if (!user) throw new Error('Could not create the account');

    await startSession(user);
    return { user };
  });
}
