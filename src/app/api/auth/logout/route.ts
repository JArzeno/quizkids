import { endSession } from '@/lib/auth';
import { route } from '@/lib/http';

export async function POST() {
  return route(async () => {
    await endSession();
    return { ok: true };
  });
}
