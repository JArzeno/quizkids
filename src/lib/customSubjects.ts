import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/lib/store';
import type { CustomSubject } from '@/types';

// Custom subjects live on the parent's account (public.custom_subjects) so every device shows their name and icon.
// Demo mode keeps them in this browser only.

function fromRow(r: Record<string, unknown>): CustomSubject {
  return { id: r.id as string, name: r.name as string, icon: (r.icon as string) || '📚', color: (r.color as string) || '#3F7A4F' };
}

const savesToAccount = () => {
  const { isDemo, account } = useStore.getState();
  return !isDemo && !!account;
};

/**
 * Loads the account's custom subjects into the store. The first time on a browser that still has subjects
 * created before they were saved to the account, those are uploaded so other devices get them too.
 */
export async function loadCustomSubjects(userId: string): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase.from('custom_subjects').select('id, name, icon, color').order('created_at');
  if (error) { console.warn('Could not load custom subjects:', error); return; }
  let list = (data || []).map(fromRow);

  const { customSubjects: local, customSubjectsOwner } = useStore.getState();
  if (customSubjectsOwner === null) {
    const missing = local.filter((s) => !list.some((r) => r.id === s.id));
    if (missing.length > 0) {
      const { error: upErr } = await supabase.from('custom_subjects').insert(missing.map(({ id, name, icon, color }) => ({ id, name, icon, color })));
      // Keep the local ones and try again on the next load
      if (upErr) { console.warn('Could not save custom subjects to the account:', upErr); return; }
      list = [...list, ...missing];
    }
  }
  useStore.setState({ customSubjects: list, customSubjectsOwner: userId });
}

/** Creates a custom subject. Returns null when it could not be saved to the account. */
export async function addCustomSubject(input: Omit<CustomSubject, 'id'>): Promise<CustomSubject | null> {
  const subject: CustomSubject = { ...input, id: 'cus-' + Math.random().toString(36).slice(2, 7) };
  if (savesToAccount()) {
    const { error } = await createClient().from('custom_subjects').insert(subject);
    if (error) { console.warn('Could not add custom subject:', error); return null; }
  }
  useStore.setState((s) => ({ customSubjects: [...s.customSubjects, subject] }));
  return subject;
}

export async function removeCustomSubject(id: string): Promise<boolean> {
  if (savesToAccount()) {
    const { error } = await createClient().from('custom_subjects').delete().eq('id', id);
    if (error) { console.warn('Could not remove custom subject:', error); return false; }
  }
  useStore.setState((s) => ({ customSubjects: s.customSubjects.filter((x) => x.id !== id) }));
  return true;
}
