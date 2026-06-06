'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Ico, ICONS } from '@/components/ui/Icons';
import { Avatar } from '@/components/ui/Avatar';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';

export function AppShell({ children, showNav = true }: { children: React.ReactNode; showNav?: boolean }) {
  const { lang, setLang, mode, kids, activeKidId, setMode, setActiveKidId, palette, font } = useStore();
  const t = useT(lang);
  const router = useRouter();
  const activeKid = kids.find((k) => k.id === activeKidId) || kids[0];
  const account = useStore((s) => s.account);
  const isDemo = useStore((s) => s.isDemo);

  React.useEffect(() => {
    const el = document.documentElement;
    el.setAttribute('data-palette', palette);
    el.setAttribute('data-font', font);
  }, [palette, font]);

  const switchMode = (next: 'parent' | 'kid') => {
    if (next === mode) return;
    if (next === 'kid') {
      const target = activeKid || kids[0];
      if (!target) { router.push('/dashboard/add-kid'); return; }
      setActiveKidId(target.id);
      setMode('kid');
      router.push('/kids/home');
    } else {
      setMode('parent');
      router.push(kids.length ? '/dashboard' : '/');
    }
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
            {/* role switcher */}
            {kids.length > 0 && account && !isDemo && (
              <div style={{ display: 'inline-flex', padding: 3, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 999, gap: 2, fontSize: 13, fontWeight: 700 }}>
                <button onClick={() => switchMode('parent')} style={{ appearance: 'none', border: 0, background: mode === 'parent' ? 'var(--ink)' : 'transparent', color: mode === 'parent' ? 'var(--surface)' : 'var(--ink-2)', padding: '5px 12px 5px 10px', borderRadius: 999, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Ico d={<g><circle cx="12" cy="8" r="4" /><path d="M4 22c0-4 4-6 8-6s8 2 8 6" /></g>} size={13} />
                  <span>{t('parent')}</span>
                </button>
                <button onClick={() => switchMode('kid')} style={{ appearance: 'none', border: 0, background: mode === 'kid' ? 'var(--ink)' : 'transparent', color: mode === 'kid' ? 'var(--surface)' : 'var(--ink-2)', padding: '3px 10px 3px 4px', borderRadius: 999, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {activeKid ? <Avatar id={activeKid.avatar} size={22} /> : <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--honey-l)', display: 'inline-block' }} />}
                  <span>{t('kid')}</span>
                </button>
              </div>
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
