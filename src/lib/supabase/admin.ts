import { createClient } from '@supabase/supabase-js';

/** Server-only client with the service role key. It bypasses RLS, so use it only for shared caches the browser must not write. Null when the key isn't configured. */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
