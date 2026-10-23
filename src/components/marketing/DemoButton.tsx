'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import type { Locale } from '@/lib/site';

/** "See a demo": loads the demo family into the app store and opens the parent dashboard. The store is imported on click so marketing pages don't ship it up front. */
export function DemoButton({ locale, className, children }: { locale: Locale; className?: string; children: React.ReactNode }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  const start = async () => {
    setBusy(true);
    const { useStore, DEMO_KIDS } = await import('@/lib/store');
    const s = useStore.getState();
    if (s.account && !s.isDemo) {
      router.push('/dashboard');
      return;
    }
    s.setIsDemo(true);
    s.setAccount(null);
    s.setKids(DEMO_KIDS);
    s.setActiveKidId(DEMO_KIDS[0]?.id || null);
    s.setMode('parent');
    useStore.setState((st) => ({ lang: locale, studyParams: { ...st.studyParams, lang: locale } }));
    router.push('/dashboard');
  };

  return (
    <button type="button" onClick={start} className={className} disabled={busy} aria-busy={busy}>
      {children}
    </button>
  );
}
