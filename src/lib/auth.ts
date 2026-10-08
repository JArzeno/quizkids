import { useStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { endStudySession } from '@/lib/studyTimer';

/** Ends the Supabase session and clears the signed-in account from the store */
export async function signOut() {
  // Save the running study time while still signed in
  await endStudySession();
  await createClient().auth.signOut();
  const { setAccount, setKids, setCustomSubjects, setIsDemo, setMode } = useStore.getState();
  setAccount(null);
  setKids([]);
  setCustomSubjects([]);
  setIsDemo(false);
  setMode('parent');
}
