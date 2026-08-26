'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Ico, ICONS } from '@/components/ui/Icons';
import { Avatar } from '@/components/ui/Avatar';
import { StudyTimerBadge } from '@/components/ui/SessionPill';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';
import { useStudyTimer } from '@/lib/session';

export function AppShell({ children, showNav = true }: { children: React.ReactNode; showNav?: boolean }) {
  const { lang, setLang, mode, kids, activeKidId, setMode, palette, font, setAccount, setKids, setIsDemo, clearSession } = useStore();
  const t = useT(lang);
  const router = useRouter();
  const pathname = usePathname();
  const activeKid = kids.find((k) => k.id === activeKidId) || kids[0];
  const account = useStore((s) => s.account);
  const isDemo = useStore((s) => s.isDemo);
  const timer = useStudyTimer();

  const handleLogout = async () => {
    const supabase = createClient();
    if (timer.running) await timer.end();
    await supabase.auth.signOut();
    setAccount(null);
    setKids([]);
    setIsDemo(false);
    setMode('parent');
    clearSession();
    router.push('/auth');
  };

  React.useEffect(() => {
    const el = document.documentElement;
    el.setAttribute('data-palette', palette);
    el.setAttribute('data-font', font);
  }, [palette, font]);

  /**
   * Changing who is using the app always goes through the profile picker, so a kid
   * can never land in the parent dashboard (or another kid's space) by tapping a
   * toggle. The picker asks parent-or-kid, and the parent tile asks for the PIN.
   */
  const switchUser = async () => {
    if (!kids.length) { router.push('/dashboard/add-kid'); return; }
    if (timer.running) await timer.end();
    router.push('/profile');
  };

  return (
    <div className="qk-app">
      {isDemo && (
        <div style={{ background: 'var(--honey)', color: '#fff', textAlign: 'center', padding: '7px 16px', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <span>{lang === 'es' ? 'Estás viendo un demo.' : "You're viewing a demo."}</span>
          <Link href="/auth" style={{ color: '#fff', textDecoration: 'underline', fontWeight: 700 }}>{lang === 'es' ? 'Crear cuenta gratis →' : 'Sign up free →'}</Link>
        </div>
      )}
      {showNav && (
        <header className="qk-chrome">
          <Link href="/" className="qk-brand" style={{ textDecoration: 'none' }}>
            <span className="qk-brand-mark">
              <Ico d={<path d="M11 20A7 7 0 014 13V6h7a7 7 0 010 14z" />} size={18} stroke={2} />
            </span>
            QuizKids
          </Link>
          <div className="qk-chrome-right">
            {/* live study clock — visible from any screen while a session runs */}
            {timer.running && pathname !== '/kids/home' && (
              <StudyTimerBadge lang={lang} timer={timer} onTogglePause={timer.toggle} />
            )}
            {/* who's using the app — always via the profile picker */}
            {kids.length > 0 && account && !isDemo && (
              <button onClick={() => void switchUser()} title={t('switchUser')}
                style={{ appearance: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '3px 12px 3px 3px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 999, fontSize: 13, fontWeight: 700, color: 'var(--ink-2)', cursor: 'pointer' }}>
                {mode === 'kid' && activeKid
                  ? <Avatar id={activeKid.avatar} size={24} />
                  : <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--ink)', color: 'var(--surface)', display: 'grid', placeItems: 'center' }}>
                      <Ico d={<g><circle cx="12" cy="8" r="4" /><path d="M4 22c0-4 4-6 8-6s8 2 8 6" /></g>} size={13} />
                    </span>}
                <span>{mode === 'kid' ? (activeKid?.name || t('kid')) : t('parent')}</span>
                <span style={{ color: 'var(--ink-3)', display: 'inline-flex' }}>
                  <Ico d={<path d="M6 9l6 6 6-6" />} size={14} />
                </span>
              </button>
            )}
            {/* settings gear */}
            {mode === 'parent' && account && !isDemo && (
              <Link href="/dashboard/settings" className="qk-iconbtn" title="Settings" style={{ display: 'grid', placeItems: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33 1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82 1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
              </Link>
            )}
            {/* log out */}
            {account && !isDemo && (
              <button onClick={handleLogout} className="qk-iconbtn" title={lang === 'es' ? 'Cerrar sesión' : 'Log out'} style={{ display: 'grid', placeItems: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            )}
            <div className="qk-lang" role="tablist" aria-label="language">
              <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
              <button className={lang === 'es' ? 'on' : ''} onClick={() => setLang('es')}>ES</button>
            </div>
          </div>
        </header>
      )}
      <main className="qk-page-enter">{children}</main>
    </div>
  );
}
