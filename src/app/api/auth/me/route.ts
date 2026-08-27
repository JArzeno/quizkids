import { getSessionUser } from '@/lib/auth';
import { route } from '@/lib/http';

export async function GET() {
  return route(async () => ({ user: await getSessionUser() }));
}
