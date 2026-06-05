'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Ico } from '@/components/ui/Icons';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';

export default function PinClient() {
  const { lang, parentPin, setMode } = useStore();
  const t = useT(lang);
  const router = useRouter();
  const [pin, setPin] = React.useState('');
  const [error, setError] = React.useState(false);
  const [shake, setShake] = React.useState(false);

  const tryConfirm = (full: string) => {
    if (full === parentPin) {
      setMode('parent');
      router.push('/dashboard');
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => { setPin(''); setShake(false); }, 500);
    }
  };

  const press = (digit: string) => {
    if (pin.length >= 4) return;
    const next = pin + digit;
    setError(false);
    setPin(next);
    if (next.length === 4) tryConfirm(next);
  };

  return (
    <div className="qk-screen qk-page-enter" style={{ padding: '40px clamp(20px, 5vw, 56px) 56px', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <button onClick={() => router.back()} className="qk-btn qk-btn-ghost" style={{ padding: '6px 12px', fontSize: 13 }}>
          <Ico d={<path d="M15 18l-6-6 6-6" />} size={16} /> <span>{t('switchProfile')}</span>
        </button>
        <div style={{ textAlign: 'center', marginTop: 24, marginBottom: 32 }}>
          <div style={{ width: 88, height: 88, margin: '0 auto', borderRadius: 24, background: 'linear-gradient(135deg, var(--ink) 0%, #2a3d2e 100%)', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 36, boxShadow: 'var(--shadow-lg)' }}>🔒</div>
          <h2 className="qk-h1" style={{ marginTop: 16, fontSize: 'clamp(22px, 2.8vw, 28px)' }}>{t('pinTitle')}</h2>
          <p className="qk-sub" style={{ margin: '6px auto 0', fontSize: 14 }}>{t('pinSub')}</p>
        </div>

        <div className={shake ? 'qk-shake' : ''} style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 8 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ width: 18, height: 18, borderRadius: '50%', background: i < pin.length ? (error ? 'var(--coral)' : 'var(--primary)') : 'var(--surface-2)', border: '1.5px solid ' + (error ? 'var(--coral)' : 'var(--line)'), transition: 'background .15s ease' }} />
          ))}
        </div>
        <div style={{ height: 18, textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--coral)' }}>{error ? t('pinWrong') : ''}</div>

        <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, maxWidth: 320, margin: '18px auto 0' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button key={n} onClick={() => press(String(n))} style={{ appearance: 'none', border: '1.5px solid var(--line)', background: 'var(--surface)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 24, height: 64, borderRadius: 16, cursor: 'pointer', transition: 'background .1s ease' }} onMouseDown={(e) => (e.currentTarget.style.background = 'var(--surface-2)')} onMouseUp={(e) => (e.currentTarget.style.background = 'var(--surface)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface)')}>{n}</button>
          ))}
          <button onClick={() => router.back()} style={{ appearance: 'none', border: 0, background: 'transparent', color: 'var(--ink-3)', fontSize: 13, cursor: 'pointer' }}>{t('forgotPin')}</button>
          <button onClick={() => press('0')} style={{ appearance: 'none', border: '1.5px solid var(--line)', background: 'var(--surface)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 24, height: 64, borderRadius: 16, cursor: 'pointer' }}>0</button>
          <button onClick={() => setPin((p) => p.slice(0, -1))} style={{ appearance: 'none', border: 0, background: 'transparent', color: 'var(--ink-2)', display: 'grid', placeItems: 'center', cursor: 'pointer' }} aria-label="Backspace">
            <Ico d={<g><path d="M22 5H8L2 12l6 7h14a2 2 0 002-2V7a2 2 0 00-2-2z" /><path d="M18 9l-6 6M12 9l6 6" /></g>} size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}
