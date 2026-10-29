'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { useProfileSwitch } from '@/lib/profileSwitchState';

/**
 * Full-screen greeting played while switching between the parent and a kid (see lib/profileSwitch). Lives in the root
 * layout so it stays up across the navigation; it imports no app store or strings, so marketing pages stay light.
 */
export function ProfileSwitchOverlay() {
  const { target, origin, phase, from } = useProfileSwitch();
  const pathname = usePathname();

  // The new page is showing: fade out over it
  React.useEffect(() => {
    if (!target || phase !== 'in' || !from || pathname === from) return;
    const id = window.setTimeout(() => useProfileSwitch.setState({ phase: 'out' }), 120);
    return () => window.clearTimeout(id);
  }, [pathname, target, phase, from]);

  React.useEffect(() => {
    if (phase !== 'out') return;
    const id = window.setTimeout(() => useProfileSwitch.setState({ target: null, origin: null, phase: 'in', from: null }), 350);
    return () => window.clearTimeout(id);
  }, [phase]);

  // Never leave the screen covered if the page takes too long or the navigation didn't happen
  React.useEffect(() => {
    if (!target) return;
    const id = window.setTimeout(() => {
      if (useProfileSwitch.getState().phase === 'in') useProfileSwitch.setState({ phase: 'out' });
    }, 4000);
    return () => window.clearTimeout(id);
  }, [target]);

  if (!target) return null;
  const kid = target.kind === 'kid';
  const style = {
    '--qk-switch-x': origin ? `${origin.x}px` : '50%',
    '--qk-switch-y': origin ? `${origin.y}px` : '50%',
    background: kid ? 'linear-gradient(135deg, var(--primary-l) 0%, var(--honey-l) 100%)' : 'linear-gradient(135deg, var(--ink) 0%, #2a3d2e 100%)',
    color: kid ? 'var(--ink)' : '#fff',
  } as React.CSSProperties;

  return (
    <div className={`qk-switch${phase === 'out' ? ' out' : ''}`} style={style} aria-live="polite">
      <div aria-hidden style={{ position: 'absolute', inset: 0, opacity: kid ? 0.16 : 0.12, backgroundImage: `radial-gradient(${kid ? 'var(--primary)' : 'rgba(255,255,255,.8)'} 1.5px, transparent 1.5px)`, backgroundSize: '22px 22px' }} />
      <div className="qk-switch-card" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, textAlign: 'center' }}>
        {target.kind === 'kid' ? (
          <Avatar id={target.avatar} size={132} ring={target.color || 'var(--primary)'} />
        ) : (
          <div style={{ width: 120, height: 120, borderRadius: 32, background: 'rgba(255,255,255,.12)', border: '2px solid rgba(255,255,255,.3)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 56 }}>
            {target.initial}
          </div>
        )}
        <div>
          <div className="qk-h1" style={{ fontSize: 'clamp(28px, 5vw, 42px)', color: 'inherit' }}>
            {target.title}
          </div>
          <div style={{ marginTop: 8, fontSize: 16, fontWeight: 600, opacity: 0.75 }}>{target.sub}</div>
        </div>
      </div>
    </div>
  );
}
