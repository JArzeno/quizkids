'use client';
import React from 'react';
import { Ico } from './Icons';
import { useT } from '@/lib/i18n';
import type { Lang } from '@/types';

const QK_PLANS = {
  free: { id: 'free', nameKey: 'planFree', pitchKey: 'planFreePitch', price: { monthly: 0, yearly: 0 }, features: ['planFreeFeat1', 'planFreeFeat2', 'planFreeFeat3', 'planFreeFeat4'], badge: null },
  family: { id: 'family', nameKey: 'planFamily', pitchKey: 'planFamilyPitch', price: { monthly: 10, yearly: 96 }, features: ['planFamilyFeat1', 'planFamilyFeat2', 'planFamilyFeat3', 'planFamilyFeat4'], badge: 'popular' },
};

function BillingToggle({ lang, value, onChange }: { lang: Lang; value: string; onChange: (v: string) => void }) {
  const t = useT(lang);
  return (
    <div style={{ display: 'inline-flex', padding: 4, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, gap: 2 }}>
      {['monthly', 'yearly'].map((opt) => (
        <button key={opt} onClick={() => onChange(opt)} style={{ appearance: 'none', border: 0, padding: '8px 16px', borderRadius: 10, background: value === opt ? 'var(--ink)' : 'transparent', color: value === opt ? 'var(--surface)' : 'var(--ink-2)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {opt === 'monthly' ? t('billingMonthly') : t('billingYearly')}
          {opt === 'yearly' && (
            <span style={{ padding: '2px 7px', borderRadius: 999, background: value === 'yearly' ? 'var(--honey)' : 'var(--honey-l)', color: value === 'yearly' ? '#fff' : '#7C5410', fontSize: 10, fontWeight: 700, letterSpacing: '.04em' }}>{t('saveBadge')}</span>
          )}
        </button>
      ))}
    </div>
  );
}

function PricingCard({ lang, plan, cycle, current, onSelect, compact = false }: { lang: Lang; plan: typeof QK_PLANS.free | typeof QK_PLANS.family; cycle: string; current?: boolean; onSelect?: (id: string) => void; compact?: boolean }) {
  const t = useT(lang);
  const isFamily = plan.id === 'family';
  const price = plan.price[cycle as 'monthly' | 'yearly'];
  const isPopular = plan.badge === 'popular';

  return (
    <div style={{ position: 'relative', borderRadius: 24, padding: compact ? 20 : '28px 26px', background: isFamily ? 'linear-gradient(160deg, var(--primary-l) 0%, var(--surface) 80%)' : 'var(--surface)', border: '2px solid ' + (isFamily ? 'var(--primary)' : 'var(--line)'), boxShadow: isFamily ? 'var(--shadow-lg)' : 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: 18 }}>
      {isPopular && <div className="qk-sticker" style={{ position: 'absolute', top: -14, right: 18, background: 'var(--honey)', fontSize: 12, padding: '4px 12px', boxShadow: 'var(--shadow-sm)' }}>★ {t('popular')}</div>}
      {current && <div style={{ position: 'absolute', top: -12, left: 18, padding: '4px 12px', borderRadius: 999, background: 'var(--ink)', color: 'var(--surface)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 11 }}>{t('planFamilyCurrent').toUpperCase()}</div>}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: isFamily ? 'var(--primary)' : 'var(--surface-2)', color: isFamily ? '#fff' : 'var(--ink-3)', display: 'grid', placeItems: 'center' }}>
            {isFamily ? <Ico d={<path d="M11 20A7 7 0 014 13V6h7a7 7 0 010 14z" />} size={18} stroke={2} /> : <Ico d={<circle cx="12" cy="12" r="9" />} size={18} />}
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: compact ? 20 : 24, margin: 0 }}>{t(plan.nameKey)}</h3>
        </div>
        <p style={{ margin: '10px 0 0', color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.5 }}>{t(plan.pitchKey)}</p>
      </div>
      <div>
        {price === 0 ? (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: compact ? 36 : 48, lineHeight: 1 }}>$0</span>
            <span style={{ color: 'var(--ink-3)', fontSize: 14 }}>{lang === 'es' ? 'para siempre' : 'forever'}</span>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: compact ? 36 : 48, lineHeight: 1 }}>${cycle === 'yearly' ? 8 : price}</span>
              <span style={{ color: 'var(--ink-3)', fontSize: 14 }}>{t('perMonth')}</span>
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--ink-3)' }}>{cycle === 'yearly' ? t('billedYearly') : t('billedMonthly')}</div>
          </div>
        )}
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {plan.features.map((f) => (
          <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, lineHeight: 1.4 }}>
            <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 8, background: isFamily ? 'var(--primary)' : 'var(--primary-l)', color: isFamily ? '#fff' : 'var(--primary)', display: 'grid', placeItems: 'center', marginTop: 1 }}>
              <Ico d={<path d="M5 12l5 5L20 7" />} size={13} stroke={2.4} />
            </span>
            <span>{t(f)}</span>
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 'auto' }}>
        {current ? (
          <button disabled style={{ width: '100%', appearance: 'none', border: '1.5px solid var(--line)', background: 'var(--surface-2)', color: 'var(--ink-3)', padding: '12px 16px', borderRadius: 14, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, cursor: 'default' }}>{t('currentPlan')}</button>
        ) : (
          <button onClick={() => onSelect?.(plan.id)} style={{ width: '100%', appearance: 'none', border: isFamily ? '0' : '1.5px solid var(--line)', background: isFamily ? 'var(--primary)' : 'var(--surface)', color: isFamily ? '#fff' : 'var(--ink)', padding: '12px 16px', borderRadius: 14, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, cursor: 'pointer', boxShadow: isFamily ? '0 3px 0 var(--primary-d)' : 'none' }}>
            {isFamily ? t('planFamilyCta') : t('planFreeCta')}
          </button>
        )}
        {isFamily && !current && <div style={{ marginTop: 8, fontSize: 11, color: 'var(--ink-3)', textAlign: 'center' }}>{t('freeTrial')}</div>}
      </div>
    </div>
  );
}

export function PricingCards({ lang, cycle, setCycle, currentPlanId, onSelect, compact = false }: { lang: Lang; cycle: string; setCycle: (c: string) => void; currentPlanId?: string | null; onSelect?: (id: string) => void; compact?: boolean }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <BillingToggle lang={lang} value={cycle} onChange={setCycle} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 760, margin: '0 auto' }} className="qk-pricing-grid">
        <PricingCard lang={lang} plan={QK_PLANS.free} cycle={cycle} current={currentPlanId === 'free'} onSelect={onSelect} compact={compact} />
        <PricingCard lang={lang} plan={QK_PLANS.family} cycle={cycle} current={currentPlanId === 'family'} onSelect={onSelect} compact={compact} />
      </div>
      <style>{`@media (max-width: 720px) { .qk-pricing-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

export { QK_PLANS, BillingToggle };
