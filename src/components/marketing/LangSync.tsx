'use client';
import React from 'react';
import type { Locale } from '@/lib/site';

/**
 * Keeps the rest of the site in the page's language: sets <html lang> (also after client-side navigation)
 * and, for visitors who aren't signed in, the app language used by sign-up and the demo.
 * Signed-in parents keep the language saved on their account.
 */
export function LangSync({ locale }: { locale: Locale }) {
  React.useEffect(() => {
    document.documentElement.lang = locale;
    let cancelled = false;
    import('@/lib/store').then(({ useStore }) => {
      if (cancelled) return;
      const { account, isDemo, lang } = useStore.getState();
      if ((account && !isDemo) || lang === locale) return;
      useStore.setState((s) => ({ lang: locale, studyParams: { ...s.studyParams, lang: locale } }));
    });
    return () => { cancelled = true; };
  }, [locale]);
  return null;
}
