'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { Ico } from '@/components/ui/Icons';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';

export default function KidCodeClient() {
  const { lang, kids, setActiveKidId, setMode } = useStore();
  const t = useT(lang);
  const router = useRouter();
  const [code, setCode] = React.useState(['', '', '', '', '', '']);
  const [error, setError] = React.useState(false);
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);

  const codes = React.useMemo(() => {
    const map: Record<string, string> = {};
    kids.forEach((k) => { map[k.id] = k.code || (k.name.toUpperCase().replace(/[^A-Z]/g, '') + '12345').slice(0, 6); });
    return map;
  }, [kids]);

  const fullCode = code.join('').toUpperCase();
  const matchKid = kids.find((k) => codes[k.id] === fullCode);

  React.useEffect(() => {
    if (code.every((c) => c !== '')) {
      if (matchKid) { setError(false); setTimeout(() => { setActiveKidId(matchKid.id); setMode('kid'); router.push('/kids/home'); }, 200); }
      else setError(true);
    } else setError(false);
  }, [fullCode]);

  const setAt = (i: number, v: string) => {
    v = v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 1);
    setCode((prev) => { const next = [...prev]; next[i] = v; return next; });
    if (v && refs.current[i + 1]) refs.current[i + 1]!.focus();
  };

  return (
    <div className="qk-screen qk-page-enter" style={{ padding: '40px clamp(20px, 5vw, 56px) 56px', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <button onClick={() => router.back()} className="qk-btn qk-btn-ghost" style={{ padding: '6px 12px', fontSize: 13 }}>
          <Ico d={<path d="M15 18l-6-6 6-6" />} size={16} /> <span>{t('switchProfile')}</span>
        </button>
        <div style={{ textAlign: 'center', marginTop: 24, marginBottom: 32 }}>
          <div style={{ display: 'inline-flex' }}>
            {kids.slice(0, 3).map((k, i) => (
              <div key={k.id} style={{ marginLeft: i ? -10 : 0, borderRadius: '50%', background: 'var(--surface)', border: '3px solid var(--surface)', transform: `rotate(${[-4, 2, -2][i] || 0}deg)` }}><Avatar id={k.avatar} size={72} /></div>
            ))}
          </div>
          <h2 className="qk-h1" style={{ marginTop: 18, fontSize: 'clamp(22px, 2.8vw, 30px)' }}>{t('kidCodeTitle')}</h2>
          <p className="qk-sub" style={{ margin: '6px auto 0', fontSize: 14 }}>{t('kidCodeSub')}</p>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {code.map((c, i) => (
            <input key={i} ref={(el) => { refs.current[i] = el; }} value={c}
              onChange={(e) => setAt(i, e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Backspace' && !code[i] && refs.current[i - 1]) refs.current[i - 1]!.focus(); }}
              maxLength={1}
              style={{ width: 'clamp(40px, 12vw, 56px)', height: 'clamp(48px, 14vw, 68px)', border: '2px solid ' + (error ? 'var(--coral)' : c ? 'var(--primary)' : 'var(--line)'), background: c ? 'var(--primary-l)' : 'var(--surface)', borderRadius: 14, textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(22px, 4vw, 30px)', color: 'var(--ink)', textTransform: 'uppercase', outline: 'none', transition: 'all .15s ease' }}
            />
          ))}
        </div>
        <div style={{ height: 24, textAlign: 'center', marginTop: 14, fontSize: 14, fontWeight: 700, color: 'var(--coral)' }}>{error ? t('kidCodeBad') : ''}</div>

        <details style={{ marginTop: 18, fontSize: 13, color: 'var(--ink-3)' }}>
          <summary style={{ cursor: 'pointer', textAlign: 'center', fontWeight: 600 }}>{lang === 'es' ? 'Ver códigos de prueba' : 'See demo codes'}</summary>
          <div style={{ marginTop: 12, padding: 14, background: 'var(--surface-2)', borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {kids.map((k) => (
              <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar id={k.avatar} size={28} />
                <span style={{ flex: 1, fontWeight: 700, color: 'var(--ink)' }}>{k.name}</span>
                <code style={{ fontFamily: 'ui-monospace, monospace', padding: '4px 10px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, fontWeight: 700, letterSpacing: '.08em' }}>{codes[k.id]}</code>
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}
