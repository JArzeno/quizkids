'use client';
import React from 'react';
import { Ico } from './Icons';
import { useT } from '@/lib/i18n';
import type { Lang } from '@/types';

const QK_PLAN = {
  nameKey: 'planFamily',
  pitchKey: 'planFamilyPitch',
  price: { monthly: 10, yearly: 96 },
  perKid: { monthly: 5, yearly: 48 },
  features: ['planFamilyFeat1', 'planFamilyFeat2', 'planFamilyFeat3', 'planFamilyFeat4'],
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

export function PricingCards({ lang, cycle, setCycle, kidsCount = 1, current = false, showCta = true, ctaLabel, onSelect, compact = false }: { lang: Lang; cycle: string; setCycle: (c: string) => void; kidsCount?: number; current?: boolean; showCta?: boolean; ctaLabel?: string; onSelect?: () => void; compact?: boolean }) {
  const t = useT(lang);
  const c = cycle as 'monthly' | 'yearly';
  const base = QK_PLAN.price[c];
  const perKid = QK_PLAN.perKid[c];
  const extraKids = Math.max(0, kidsCount - 1);
  const total = base + extraKids * perKid;
  const unit = c === 'yearly' ? t('perYear') : t('perMonth');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <BillingToggle lang={lang} value={cycle} onChange={setCycle} />
      </div>
      <div style={{ position: 'relative', borderRadius: 24, padding: compact ? 20 : '28px 26px', maxWidth: 440, margin: '0 auto', background: 'linear-gradient(160deg, var(--primary-l) 0%, var(--surface) 80%)', border: '2px solid var(--primary)', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {current && <div style={{ position: 'absolute', top: -12, left: 18, padding: '4px 12px', borderRadius: 999, background: 'var(--ink)', color: 'var(--surface)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 11 }}>{t('planFamilyCurrent').toUpperCase()}</div>}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary)', color: '#fff', display: 'grid', placeItems: 'center' }}>
              <Ico d={<path d="M11 20A7 7 0 014 13V6h7a7 7 0 010 14z" />} size={18} stroke={2} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: compact ? 20 : 24, margin: 0 }}>{t(QK_PLAN.nameKey)}</h3>
          </div>
          <p style={{ margin: '10px 0 0', color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.5 }}>{t(QK_PLAN.pitchKey)}</p>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: compact ? 36 : 48, lineHeight: 1 }}>${total}</span>
            <span style={{ color: 'var(--ink-3)', fontSize: 14 }}>{unit}</span>
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: 'var(--ink-3)' }}>
            {c === 'yearly' ? (lang === 'es' ? 'Facturado anualmente' : 'Billed yearly') : t('billedMonthly')}
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-3)', background: 'var(--surface-2)', display: 'inline-block', padding: '4px 10px', borderRadius: 999 }}>
            ${base}{unit} base + ${perKid}{unit} {lang === 'es' ? 'por peque adicional' : 'per additional kid'}
          </div>
          {extraKids > 0 && (
            <div style={{ marginTop: 8, fontSize: 13, color: 'var(--ink-2)', fontWeight: 600 }}>
              {lang === 'es' ? `Total para ${kidsCount} peques: $${total}${unit}` : `Total for ${kidsCount} kids: $${total}${unit}`}
            </div>
          )}
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {QK_PLAN.features.map((f) => (
            <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, lineHeight: 1.4 }}>
              <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 8, background: 'var(--primary)', color: '#fff', display: 'grid', placeItems: 'center', marginTop: 1 }}>
                <Ico d={<path d="M5 12l5 5L20 7" />} size={13} stroke={2.4} />
              </span>
              <span>{t(f)}</span>
            </li>
          ))}
        </ul>
        {showCta && (
          <div style={{ marginTop: 'auto' }}>
            <button onClick={() => onSelect?.()} style={{ width: '100%', appearance: 'none', border: 0, background: 'var(--primary)', color: '#fff', padding: '12px 16px', borderRadius: 14, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, cursor: 'pointer', boxShadow: '0 3px 0 var(--primary-d)' }}>
              {ctaLabel || t('planFamilyCta')}
            </button>
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--ink-3)', textAlign: 'center' }}>{t('freeTrial')}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export { QK_PLAN };
