'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Ico, ICONS } from '@/components/ui/Icons';
import { Avatar } from '@/components/ui/Avatar';
import { Btn } from '@/components/ui/Btn';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';

export default function AuthClient() {
  const { lang, setAccount, setIsDemo, setKids } = useStore();
  const t = useT(lang);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = React.useState<'signin' | 'signup'>(
    searchParams.get('tab') === 'signin' ? 'signin' : 'signup'
  );
  const [form, setForm] = React.useState({ name: '', email: '', password: '', remember: true, terms: false });
  const [showPw, setShowPw] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const pwScore = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();
  const pwLabel = pwScore <= 1 ? t('pwStrengthWeak') : pwScore <= 3 ? t('pwStrengthOk') : t('pwStrengthGood');
  const pwColor = pwScore <= 1 ? 'var(--coral)' : pwScore <= 3 ? 'var(--honey)' : 'var(--primary)';

  const canSubmit = tab === 'signin'
    ? form.email.includes('@') && form.password.length > 0
    : form.name.trim().length > 0 && form.email.includes('@') && form.password.length >= 8 && form.terms;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setIsDemo(false);
    setKids([]);
    setError(null);
    const supabase = createClient();

    if (tab === 'signup') {
      const { error: err } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { name: form.name } },
      });
      setLoading(false);
      if (err) { setError(err.message); return; }
      setAccount({ name: form.name, email: form.email });
      router.push('/auth/onboarding');
    } else {
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      setLoading(false);
      if (err) { setError(err.message); return; }
      const name = data.user?.user_metadata?.name || data.user?.email || '';
      setAccount({ name, email: form.email });
      const { data: kidsData } = await supabase
        .from('kids')
        .select('*')
        .eq('parent_id', data.user.id)
        .order('created_at');
      if (kidsData) {
        setKids(kidsData.map((k) => ({
          id: k.id,
          parent_id: k.parent_id,
          name: k.name,
          grade: k.grade,
          avatar: k.avatar || 'sprout',
          color: k.color || '#3F7A4F',
          code: k.code,
          streak: k.streak || 0,
          stars: k.stars || 0,
          minutes_total: k.minutes_total || 0,
          weekly: k.weekly_pct || 0,
          goal_min: k.goal_min || 30,
          lastSubject: k.last_subject || undefined,
          recent: [],
        })));
      }
      router.push('/profile');
    }
  };

  return (
    <div className="qk-page-enter" style={{ minHeight: '100dvh', display: 'grid', gridTemplateColumns: '1.05fr 1fr' }} data-palette="forest">
      {/* LEFT */}
      <aside style={{ padding: '56px clamp(28px, 5vw, 64px)', background: 'linear-gradient(160deg, var(--primary-l) 0%, var(--honey-l) 100%)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '100dvh' }}>
        <div aria-hidden style={{ position: 'absolute', inset: 0, opacity: .18, backgroundImage: 'radial-gradient(var(--primary) 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />
        <div style={{ position: 'relative' }}>
          <Link href="/" className="qk-brand" style={{ textDecoration: 'none' }}>
            <span className="qk-brand-mark"><Ico d={<path d="M11 20A7 7 0 014 13V6h7a7 7 0 010 14z" />} size={18} stroke={2} /></span>
            QuizKids
          </Link>
        </div>
        <div style={{ position: 'relative', margin: '32px 0' }}>
          <h1 className="qk-h1" style={{ fontSize: 'clamp(28px, 3.4vw, 40px)' }}>
            {lang === 'es' ? (<>Un rinconcito <span className="qk-underline">amigable</span> para estudiar.</>) : (<>A cozy place to <span className="qk-underline">love learning</span>.</>)}
          </h1>
          <div style={{ position: 'relative', height: 200, marginTop: 28 }}>
            <div className="qk-card" style={{ position: 'absolute', left: 0, top: 14, width: '68%', padding: 14, transform: 'rotate(-3deg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar id="fox" size={36} />
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14 }}>Mateo · Grade 3</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Solar System · 5 ⭐</div>
                </div>
              </div>
              <div className="qk-progress" style={{ marginTop: 10, height: 6 }}><span style={{ width: '72%' }} /></div>
            </div>
            <div style={{ position: 'absolute', right: '6%', top: 0, transform: 'rotate(6deg)' }}><Avatar id="sprout" size={88} /></div>
            <div className="qk-sticker" style={{ position: 'absolute', right: '-2%', top: '54%', fontSize: 13 }}>7 day streak 🔥</div>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '32px 0 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[{ icon: ICONS.shuffle, label: t('vp1') }, { icon: ICONS.book, label: t('vp2') }, { icon: ICONS.leaf, label: t('vp3') }].map((v, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, color: 'var(--ink-2)' }}>
                <span style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--surface)', color: 'var(--primary)', display: 'grid', placeItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
                  {React.cloneElement(v.icon as React.ReactElement<{ size?: number }>, { size: 16 })}
                </span>
                <span style={{ fontWeight: 600 }}>{v.label}</span>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex' }}>
            {['bee', 'owl', 'frog', 'bear'].map((a, i) => (
              <div key={a} style={{ marginLeft: i ? -10 : 0, borderRadius: '50%', background: 'var(--surface)', border: '2.5px solid var(--surface)' }}><Avatar id={a} size={32} /></div>
            ))}
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
            <span style={{ display: 'inline-flex', color: 'var(--honey)' }}>{ICONS.star}</span>{' '}
            <strong>{t('socialProof')}</strong>
          </div>
        </div>
      </aside>

      {/* RIGHT */}
      <main style={{ padding: '40px clamp(24px, 5vw, 56px) 56px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          <div style={{ display: 'inline-flex', padding: 4, background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 14 }}>
            {([['signin', t('tabSignIn')], ['signup', t('tabSignUp')]] as ['signin' | 'signup', string][]).map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} style={{ appearance: 'none', border: 0, padding: '8px 16px', borderRadius: 10, background: tab === id ? 'var(--surface)' : 'transparent', boxShadow: tab === id ? 'var(--shadow-sm)' : 'none', color: tab === id ? 'var(--ink)' : 'var(--ink-3)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all .15s ease' }}>{label}</button>
            ))}
          </div>
          <h2 className="qk-h1" style={{ marginTop: 18, fontSize: 'clamp(24px, 2.8vw, 30px)' }}>
            {tab === 'signin' ? t('authSignInTitle') : t('authSignUpTitle')}
          </h2>
          <p className="qk-sub" style={{ margin: '6px 0 0', fontSize: 15 }}>
            {tab === 'signin' ? t('authSignInSub') : t('authSignUpSub')}
          </p>

          <form onSubmit={submit} style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {tab === 'signup' && (
              <div className="qk-field">
                <label className="qk-label">{t('fieldName')}</label>
                <input className="qk-input" placeholder={t('fieldNamePh')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
            )}
            <div className="qk-field">
              <label className="qk-label">{t('fieldEmail')}</label>
              <input className="qk-input" type="email" placeholder={t('fieldEmailPh')} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="qk-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <label className="qk-label">{t('fieldPassword')}</label>
                {tab === 'signin' && <button type="button" style={{ appearance: 'none', border: 0, background: 'transparent', color: 'var(--primary)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{t('forgotPw')}</button>}
              </div>
              <div style={{ position: 'relative' }}>
                <input className="qk-input" type={showPw ? 'text' : 'password'} placeholder={t('fieldPasswordPh')} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={{ paddingRight: 42 }} />
                <button type="button" onClick={() => setShowPw((v) => !v)} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', appearance: 'none', border: 0, background: 'transparent', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', color: 'var(--ink-3)', display: 'grid', placeItems: 'center' }}>
                  <Ico d={<g><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></g>} size={16} />
                </button>
              </div>
              {tab === 'signup' && form.password && (
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 4, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(pwScore / 4) * 100}%`, background: pwColor, transition: 'width .2s ease' }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: pwColor, textTransform: 'uppercase', letterSpacing: '.04em' }}>{pwLabel}</span>
                </div>
              )}
            </div>
            {tab === 'signin' ? (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-2)', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.remember} onChange={(e) => setForm({ ...form, remember: e.target.checked })} />
                {t('rememberMe')}
              </label>
            ) : (
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--ink-2)', cursor: 'pointer', lineHeight: 1.4 }}>
                <input type="checkbox" checked={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.checked })} style={{ marginTop: 3 }} />
                <span>{t('agreeTerms')}</span>
              </label>
            )}
            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--coral-l, #fde8e8)', color: 'var(--coral, #c0392b)', fontSize: 13, fontWeight: 600 }}>
                {error}
              </div>
            )}
            <Btn kind="primary" type="submit" disabled={!canSubmit || loading} style={{ opacity: canSubmit && !loading ? 1 : .5, marginTop: 6 }}>
              {loading ? (lang === 'es' ? 'Entrando…' : 'Signing in…') : (tab === 'signin' ? t('signInBtn') : t('signUpBtn'))}
            </Btn>
          </form>

          <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 14, color: 'var(--ink-3)', fontSize: 12 }}>
            <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            <span style={{ textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700 }}>{t('orContinue')}</span>
            <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          </div>
          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button type="button" className="qk-btn qk-btn-ghost" style={{ fontSize: 14, padding: '10px 12px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z" /><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18A11 11 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.83z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 002.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" /></svg>
              Google
            </button>
            <button type="button" className="qk-btn qk-btn-ghost" style={{ fontSize: 14, padding: '10px 12px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12.5c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9s-2-.9-3.4-.9c-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.3 2.5 1.3-.1 1.8-.9 3.5-.9s2.1.9 3.4.8c1.4 0 2.3-1.2 3.2-2.4 1-1.4 1.4-2.7 1.4-2.8-.1 0-2.7-1-2.7-4.1zM14 5.4c.7-.9 1.2-2.1 1.1-3.4-1 0-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.2 1.2.1 2.3-.6 3-1.4z" /></svg>
              Apple
            </button>
          </div>
          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'var(--ink-2)' }}>
            {tab === 'signin' ? (
              <>{t('noAccount')} <button type="button" onClick={() => setTab('signup')} style={{ appearance: 'none', border: 0, background: 'transparent', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}>{t('createOne')}</button></>
            ) : (
              <>{t('hasAccount')} <button type="button" onClick={() => setTab('signin')} style={{ appearance: 'none', border: 0, background: 'transparent', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}>{t('signInLink')}</button></>
            )}
          </div>
        </div>
      </main>
      <style>{`@media (max-width: 880px) { [data-palette="forest"] > aside { display: none !important; } [data-palette="forest"] > main { grid-column: 1 / -1; } }`}</style>
    </div>
  );
}
