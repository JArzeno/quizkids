'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Ico, ICONS } from '@/components/ui/Icons';
import { Avatar } from '@/components/ui/Avatar';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';

export function AppShell({ children, showNav = true }: { children: React.ReactNode; showNav?: boolean }) {
  const { lang, setLang, mode, kids, activeKidId, setMode, setActiveKidId, palette, font, setAccount, setKids, setIsDemo } = useStore();
  const t = useT(lang);
  const router = useRouter();
  const activeKid = kids.find((k) => k.id === activeKidId) || kids[0];
  const account = useStore((s) => s.account);
  const isDemo = useStore((s) => s.isDemo);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setAccount(null);
    setKids([]);
    setIsDemo(false);
    setMode('parent');
    router.push('/auth');
  };

  // Pull the language saved on the account (e.g. changed on another device)
  React.useEffect(() => {
    if (!account || isDemo) return;
    createClient().auth.getUser().then(({ data }) => {
      const saved = data.user?.user_metadata?.lang;
      if ((saved === 'en' || saved === 'es') && saved !== useStore.getState().lang) {
        useStore.setState((s) => ({ lang: saved, studyParams: { ...s.studyParams, lang: saved } }));
      }
    }).catch(() => {});
  }, [account?.email, isDemo]);

  React.useEffect(() => { document.documentElement.lang = lang; }, [lang]);

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
      // Netflix-style: leaving a kid profile back to parent needs the PIN
      router.push('/profile/pin');
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
            {account && !isDemo ? (
              <UserMenu
                lang={lang}
                name={mode === 'kid' && activeKid ? activeKid.name : account.name}
                email={mode === 'kid' ? '' : account.email}
                kidAvatar={mode === 'kid' && activeKid ? activeKid.avatar : undefined}
                showSettings={mode === 'parent'}
                onLogout={handleLogout}
              />
            ) : (
              <div className="qk-lang" role="tablist" aria-label="language">
                <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
                <button className={lang === 'es' ? 'on' : ''} onClick={() => setLang('es')}>ES</button>
              </div>
            )}
          </div>
        </header>
      )}
      <main className="qk-page-enter">{children}</main>
    </div>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function UserMenu({ lang, name, email, kidAvatar, showSettings, onLogout }: {
  lang: 'en' | 'es'; name: string; email: string; kidAvatar?: string; showSettings: boolean; onLogout: () => void;
}) {
  const t = useT(lang);
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const displayName = name || email.split('@')[0] || '';

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const icon = (size: number) => kidAvatar
    ? <Avatar id={kidAvatar} size={size} />
    : <span className="qk-user-initials" style={{ width: size, height: size, fontSize: size * 0.4 }}>{initials(displayName)}</span>;

  return (
    <div className="qk-user" ref={ref}>
      <button className={`qk-user-btn${open ? ' on' : ''}`} onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
        {icon(28)}
        <span className="qk-user-name">{displayName}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="qk-user-menu" role="menu">
          <div className="qk-user-head">
            {icon(40)}
            <div style={{ minWidth: 0 }}>
              <div className="qk-user-head-name">{displayName}</div>
              {email && <div className="qk-user-head-email">{email}</div>}
            </div>
          </div>
          {showSettings && (
            <Link href="/dashboard/settings" className="qk-user-item" role="menuitem" onClick={() => setOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33 1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82 1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
              <span>{t('settings')}</span>
            </Link>
          )}
          <button className="qk-user-item qk-user-logout" role="menuitem" onClick={() => { setOpen(false); onLogout(); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>{lang === 'es' ? 'Cerrar sesión' : 'Log out'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
