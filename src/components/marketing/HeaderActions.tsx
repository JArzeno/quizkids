'use client';
import React from 'react';
import Link from 'next/link';

/** Whether the app store saved in this browser holds a signed-in (non-demo) parent. Read straight from storage so the header doesn't load the store. */
function hasAccount(): boolean {
  try {
    const state = JSON.parse(localStorage.getItem('quizkids-store') || '{}').state;
    return !!state?.account && !state?.isDemo;
  } catch {
    return false;
  }
}

/** Sign in + start trial, or a dashboard link once we know a parent is signed in. Renders the signed-out version on the server. */
export function HeaderActions({ signIn, start, dashboard }: { signIn: string; start: string; dashboard: string }) {
  const [signedIn, setSignedIn] = React.useState(false);
  React.useEffect(() => { setSignedIn(hasAccount()); }, []);

  if (signedIn) {
    return (
      <div className="mk-actions">
        <Link href="/dashboard" className="qk-btn qk-btn-primary mk-btn-sm">{dashboard}</Link>
      </div>
    );
  }
  return (
    <div className="mk-actions">
      <Link href="/auth?tab=signin" className="mk-signin">{signIn}</Link>
      <Link href="/auth" className="qk-btn qk-btn-primary mk-btn-sm">{start}</Link>
    </div>
  );
}
