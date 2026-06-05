'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ICONS } from '@/components/ui/Icons';
import { Avatar } from '@/components/ui/Avatar';
import { Btn } from '@/components/ui/Btn';
import { PricingCards } from '@/components/ui/PricingCards';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import type { ParentPrefs } from '@/types';

const ROLES = [
  { id: 'mom', icon: '👩' }, { id: 'dad', icon: '👨' }, { id: 'guardian', icon: '🧑' },
  { id: 'teacher', icon: '🧑‍🏫' }, { id: 'other', icon: '✨' },
];
const STEPS = 5;

export default function OnboardingClient() {
  const { lang, account, parentPrefs, setParentPrefs, setPlan, setMode } = useStore();
  const t = useT(lang);
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [prefs, setPrefs] = React.useState<ParentPrefs>(parentPrefs);

  const canNext = [
    () => !!prefs.role,
    () => (prefs.kidsCount || 0) > 0 && (prefs.langs || []).length > 0,
    () => true,
    () => !!(prefs as any).plan?.tier,
    () => true,
  ][step]?.() ?? true;

  const finish = (addKid: boolean) => {
    setParentPrefs(prefs);
    if ((prefs as any).plan) setPlan({ ...(prefs as any).plan, since: Date.now() });
    setMode('parent');
    router.push(addKid ? '/dashboard/add-kid' : '/profile');
  };

  return (
    <div className="qk-screen qk-page-enter" style={{ padding: '40px clamp(20px, 5vw, 56px) 64px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              {(account?.name || 'A').trim().charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 14 }}>{account?.name || 'Ana'}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{account?.email || '—'}</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{t('pobStep')} {step + 1} {t('of')} {STEPS}</div>
        </div>
        <div className="qk-progress" style={{ marginBottom: 28 }}><span style={{ width: `${((step + 1) / STEPS) * 100}%` }} /></div>

        <div className="qk-card qk-slide-up" style={{ padding: 'clamp(24px, 4vw, 36px)' }}>
          {step === 0 && (
            <div>
              <h2 className="qk-h1" style={{ fontSize: 'clamp(22px, 2.6vw, 30px)' }}>{t('pobTitle1')}</h2>
              <p className="qk-sub" style={{ marginTop: 6, marginBottom: 22 }}>{t('pobSub1')}</p>
              <div className="qk-label" style={{ marginBottom: 10 }}>{t('pobYouAre')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                {ROLES.map((r) => {
                  const on = prefs.role === r.id;
                  return (
                    <button key={r.id} onClick={() => setPrefs({ ...prefs, role: r.id })} className="qk-wiggle" style={{ appearance: 'none', padding: '14px 8px', background: on ? 'var(--primary-l)' : 'var(--surface-2)', border: '2px solid ' + (on ? 'var(--primary)' : 'transparent'), borderRadius: 14, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'all .15s ease' }}>
                      <span style={{ fontSize: 28 }}>{r.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)' }}>{t(`role${r.id.charAt(0).toUpperCase() + r.id.slice(1)}`)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="qk-h1" style={{ fontSize: 'clamp(22px, 2.6vw, 30px)' }}>{t('pobTitle2')}</h2>
              <p className="qk-sub" style={{ marginTop: 6, marginBottom: 22 }}>{t('pobSub2')}</p>
              <div className="qk-label" style={{ marginBottom: 10 }}>{t('pobKidsCount')}</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {([1, 2, 3, '4+'] as const).map((n) => {
                  const v = n === '4+' ? 4 : n as number;
                  const on = prefs.kidsCount === v;
                  return <button key={String(n)} onClick={() => setPrefs({ ...prefs, kidsCount: v })} className={`qk-chip${on ? ' on' : ''}`} style={{ minWidth: 54, justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 16 }}>{n}</button>;
                })}
              </div>
              <div style={{ marginTop: 24 }}>
                <div className="qk-label" style={{ marginBottom: 10 }}>{t('pobLangs')}</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {[{ id: 'en', label: 'English', flag: '🇺🇸' }, { id: 'es', label: 'Español', flag: '🇪🇸' }, { id: 'pt', label: 'Português', flag: '🇧🇷' }, { id: 'fr', label: 'Français', flag: '🇫🇷' }, { id: 'other', label: lang === 'es' ? 'Otro' : 'Other', flag: '🌐' }].map((l) => {
                    const on = (prefs.langs || []).includes(l.id);
                    return <button key={l.id} onClick={() => setPrefs({ ...prefs, langs: on ? (prefs.langs || []).filter((x) => x !== l.id) : [...(prefs.langs || []), l.id] })} className={`qk-chip${on ? ' on' : ''}`}><span>{l.flag}</span><span>{l.label}</span></button>;
                  })}
                </div>
              </div>
              <div style={{ marginTop: 24 }}>
                <div className="qk-label" style={{ marginBottom: 10 }}>{t('pobWhere')}</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {[{ id: 'home', label: t('whereHome'), icon: '🏠' }, { id: 'on-go', label: t('whereOnGo'), icon: '🚗' }, { id: 'class', label: t('whereClass'), icon: '🏫' }].map((w) => {
                    const on = (prefs.where || []).includes(w.id);
                    return <button key={w.id} onClick={() => setPrefs({ ...prefs, where: on ? (prefs.where || []).filter((x) => x !== w.id) : [...(prefs.where || []), w.id] })} className={`qk-chip${on ? ' on' : ''}`}><span>{w.icon}</span><span>{w.label}</span></button>;
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="qk-h1" style={{ fontSize: 'clamp(22px, 2.6vw, 30px)' }}>{t('pobTitle3')}</h2>
              <p className="qk-sub" style={{ marginTop: 6, marginBottom: 22 }}>{t('pobSub3')}</p>
              <div className="qk-label" style={{ marginBottom: 10 }}>{t('pobGoal')} · {lang === 'es' ? 'por peque' : 'per kid'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[15, 30, 60, 90].map((m) => {
                  const on = prefs.goalMin === m;
                  return <button key={m} onClick={() => setPrefs({ ...prefs, goalMin: m })} style={{ appearance: 'none', padding: '14px 10px', background: on ? 'var(--primary-l)' : 'var(--surface-2)', border: '2px solid ' + (on ? 'var(--primary)' : 'transparent'), borderRadius: 14, cursor: 'pointer', transition: 'all .15s ease' }}><div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>{m}</div><div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{t('minutes')} / {lang === 'es' ? 'día' : 'day'}</div></button>;
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="qk-h1" style={{ fontSize: 'clamp(22px, 2.6vw, 30px)' }}>{t('pobPlanTitle')}</h2>
              <p className="qk-sub" style={{ marginTop: 6, marginBottom: 22 }}>{t('pobPlanSub')}</p>
              <PricingCards lang={lang} cycle={(prefs as any).plan?.cycle || 'monthly'} setCycle={(c) => setPrefs({ ...prefs, plan: { ...((prefs as any).plan || { tier: 'free' }), cycle: c } } as any)} currentPlanId={null} onSelect={(tier) => setPrefs({ ...prefs, plan: { tier, cycle: (prefs as any).plan?.cycle || 'monthly' } } as any)} compact />
            </div>
          )}

          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ display: 'inline-flex', gap: -12 }}>
                {['sprout', 'fox', 'bee', 'owl'].map((a, i) => (
                  <div key={a} style={{ marginLeft: i ? -16 : 0, borderRadius: '50%', background: 'var(--surface)', border: '4px solid var(--surface)', transform: `rotate(${[-6, 2, -3, 4][i]}deg)` }}><Avatar id={a} size={68} /></div>
                ))}
              </div>
              <h2 className="qk-h1" style={{ fontSize: 'clamp(24px, 3vw, 34px)', marginTop: 18 }}>{t('pobFinishTitle')}</h2>
              <p className="qk-sub" style={{ margin: '6px auto 24px' }}>{t('pobFinishSub')}</p>
              <div style={{ display: 'inline-flex', gap: 10 }}>
                <Btn kind="ghost" onClick={() => finish(false)}>{t('pobLater')}</Btn>
                <Btn kind="primary" icon={ICONS.plus} onClick={() => finish(true)}>{t('pobAddFirst')}</Btn>
              </div>
            </div>
          )}

          {step < 4 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, gap: 12 }}>
              <button className="qk-btn qk-btn-ghost" onClick={() => step === 0 ? router.push('/auth') : setStep((s) => s - 1)}>
                {ICONS.back} <span>{t('back')}</span>
              </button>
              <Btn kind="primary" disabled={!canNext} onClick={() => setStep((s) => s + 1)} iconRight={ICONS.next} style={{ opacity: canNext ? 1 : .5 }}>{t('next')}</Btn>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
