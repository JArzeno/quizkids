import React from 'react';
import { Ico } from './Icons';

export function Stars({ count = 3, of = 5, size = 18 }: { count?: number; of?: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2, color: 'var(--honey)' }}>
      {Array.from({ length: of }).map((_, i) => (
        <span key={i} style={{ color: i < count ? 'var(--honey)' : 'rgba(31,51,38,.15)', display: 'inline-flex' }}>
          <Ico d={<path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />} fill="currentColor" stroke="none" size={size} />
        </span>
      ))}
    </span>
  );
}

export function StatCard({ icon, value, label, tone = 'primary' }: { icon: React.ReactNode; value: React.ReactNode; label: string; tone?: string }) {
  const toneColor: Record<string, string> = { primary: 'var(--primary)', honey: 'var(--honey)', coral: 'var(--coral)', sky: 'var(--sky)', berry: 'var(--berry)' };
  const toneBg: Record<string, string> = { primary: 'var(--primary-l)', honey: 'var(--honey-l)', coral: 'var(--coral-l)', sky: 'var(--sky-l)', berry: 'var(--berry-l)' };
  return (
    <div className="qk-card" style={{ padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: toneBg[tone], color: toneColor[tone], display: 'grid', placeItems: 'center' }}>{icon}</div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 24, lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>{label}</div>
        </div>
      </div>
    </div>
  );
}

export function ImgPlaceholder({ label, h = 160, tone = 'primary' }: { label: string; h?: number; tone?: string }) {
  const stripeColor: Record<string, string> = { primary: 'rgba(63,122,79,.18)', honey: 'rgba(226,154,43,.22)', coral: 'rgba(226,109,90,.22)', sky: 'rgba(107,168,201,.22)' };
  return (
    <div style={{ height: h, borderRadius: 18, border: '1.5px dashed var(--line)', background: `repeating-linear-gradient(135deg, ${stripeColor[tone] || stripeColor.primary} 0 10px, transparent 10px 24px), var(--surface-2)`, display: 'grid', placeItems: 'center', color: 'var(--ink-3)', fontFamily: 'ui-monospace, monospace', fontSize: 12, letterSpacing: '.04em' }}>
      {label}
    </div>
  );
}
