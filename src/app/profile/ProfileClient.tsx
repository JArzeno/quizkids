'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Ico, ICONS } from '@/components/ui/Icons';
import { Avatar } from '@/components/ui/Avatar';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';

export default function ProfileClient() {
  const { lang, kids, account, setMode, setActiveKidId, setAccount, setIsDemo, setKids } = useStore();
  const t = useT(lang);
  const router = useRouter();

  const pickParent = () => router.push('/profile/pin');
  const pickKid = (id: string) => { setActiveKidId(id); setMode('kid'); router.push('/kids/home'); };
  const signOut = () => { setAccount(null); setIsDemo(false); setKids([]); router.push('/'); };

  return (
    <div className="qk-screen qk-page-enter" style={{ padding: '40px clamp(20px, 5vw, 56px) 56px', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', width: '100%', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span className="qk-eyebrow">QuizKids · {account?.name || 'Ana Martinez'}</span>
          <h1 className="qk-h1" style={{ marginTop: 12, fontSize: 'clamp(28px, 4vw, 44px)' }}>{t('whoTitle')}</h1>
          <p className="qk-sub" style={{ margin: '10px auto 0' }}>{t('whoSub')}</p>
        </div>

        <div className="qk-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 24, maxWidth: 840, margin: '0 auto', width: '100%' }}>
          {/* parent tile */}
          <ProfileTile label={t('parentProfile')} sub={account?.name || 'Ana'} onClick={pickParent} badge={ICONS.spark}>
            <div style={{ width: '100%', aspectRatio: '1', borderRadius: 24, background: 'linear-gradient(135deg, var(--ink) 0%, #2a3d2e 100%)', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'clamp(36px, 5vw, 56px)', boxShadow: 'var(--shadow-lg)', position: 'relative', overflow: 'hidden' }}>
              <div aria-hidden style={{ position: 'absolute', inset: 0, opacity: .16, backgroundImage: 'radial-gradient(rgba(255,255,255,.7) 1.5px, transparent 1.5px)', backgroundSize: '18px 18px' }} />
              <span style={{ position: 'relative' }}>{(account?.name || 'A').trim().charAt(0).toUpperCase()}</span>
            </div>
          </ProfileTile>

          {kids.map((k) => (
            <ProfileTile key={k.id} label={k.name} sub={(lang === 'es' ? 'Grado ' : 'Grade ') + k.grade} onClick={() => pickKid(k.id)}>
              <div style={{ width: '100%', aspectRatio: '1', borderRadius: 24, background: 'var(--surface)', border: '3px solid ' + (k.color || 'var(--primary)'), display: 'grid', placeItems: 'center', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
                <div style={{ transform: 'scale(1.05)' }}><Avatar id={k.avatar} size={120} /></div>
              </div>
            </ProfileTile>
          ))}

          <ProfileTile label={t('addProfile')} onClick={() => router.push('/dashboard/add-kid')}>
            <div style={{ width: '100%', aspectRatio: '1', borderRadius: 24, background: 'transparent', border: '3px dashed var(--line)', display: 'grid', placeItems: 'center', color: 'var(--ink-3)' }}>
              <Ico d={<path d="M12 5v14M5 12h14" />} size={48} stroke={2} />
            </div>
          </ProfileTile>
        </div>

        <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
          <button onClick={() => router.push('/profile/kid-code')} className="qk-btn qk-btn-ghost" style={{ fontSize: 14, padding: '10px 16px' }}>
            <Ico d={<g><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a4 4 0 018 0v2" /></g>} size={16} />
            <span>{t('useKidCode')}</span>
          </button>
          <button onClick={signOut} style={{ appearance: 'none', border: 0, background: 'transparent', color: 'var(--ink-3)', fontSize: 14, padding: '10px 16px', cursor: 'pointer' }}>{t('signOut')}</button>
        </div>
      </div>
    </div>
  );
}

function ProfileTile({ label, sub, badge, onClick, children }: { label: string; sub?: string; badge?: React.ReactNode; onClick?: () => void; children?: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ appearance: 'none', border: 0, background: 'transparent', padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, transition: 'transform .2s cubic-bezier(.2,.7,.2,1)', position: 'relative' }} className="qk-profile-tile">
      <div style={{ width: '100%', position: 'relative' }}>
        {children}
        {badge && (
          <div style={{ position: 'absolute', right: -6, top: -6, width: 34, height: 34, borderRadius: '50%', background: 'var(--honey)', color: '#fff', display: 'grid', placeItems: 'center', border: '3px solid var(--bg)', boxShadow: 'var(--shadow-sm)' }}>
            {React.cloneElement(badge as React.ReactElement<{ size?: number }>, { size: 14 })}
          </div>
        )}
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: 'var(--ink)' }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>}
      </div>
      <style>{`.qk-profile-tile:hover { transform: translateY(-4px); }`}</style>
    </button>
  );
}
