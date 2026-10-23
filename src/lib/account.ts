import type { Account } from '@/types';

/** Name to greet the parent with: the first name given at sign up, or the first word of the full name on older accounts */
export function firstNameOf(account: Pick<Account, 'name' | 'firstName'> | null | undefined): string {
  return account?.firstName?.trim() || (account?.name || '').trim().split(/\s+/)[0] || '';
}

export function fullName(first: string, last: string): string {
  return [first.trim(), last.trim()].filter(Boolean).join(' ');
}

/** Account from a Supabase user: names come from the sign up metadata, falling back to the email */
export function accountFromUser(user: { email?: string | null; user_metadata?: Record<string, unknown> | null }): Account {
  const meta = user.user_metadata || {};
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const firstName = str(meta.first_name);
  const lastName = str(meta.last_name);
  const email = user.email || '';
  return { name: str(meta.name) || fullName(firstName, lastName) || email, email, ...(firstName ? { firstName, lastName } : {}) };
}

/** Metadata saved on the Supabase user for these names (`name` stays the full name, which the profiles trigger reads) */
export function nameMetadata(first: string, last: string) {
  return { name: fullName(first, last), first_name: first.trim(), last_name: last.trim() };
}
