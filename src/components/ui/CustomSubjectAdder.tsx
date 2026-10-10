'use client';
import React from 'react';
import { ICONS } from '@/components/ui/Icons';
import { Btn } from '@/components/ui/Btn';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { addCustomSubject } from '@/lib/customSubjects';
import type { SubjectOption } from '@/lib/subjects';
import type { Lang } from '@/types';

const ICON_CHOICES = ['📚', '🤖', '💻', '🔤', '🎵', '🌱', '🧪', '🎭', '🧮', '✏️', '🌍', '⚽', '🍳', '🦖'];
const COLORS = ['#3F7A4F', '#E29A2B', '#E26D5A', '#6BA8C9', '#B14F8C', '#7A5AE0', '#2F7C8A', '#5A9F58'];

/**
 * "Add your own" entry for a subject picker: creates a custom subject on the parent's account and hands back its id.
 * A name matching a subject already in `options` picks that one instead of creating a duplicate.
 * When open, the form takes a full row of the surrounding grid or flex-wrap list.
 */
export function CustomSubjectAdder({ lang, options, variant, onAdded }: {
  lang: Lang;
  options: SubjectOption[];
  variant: 'tile' | 'chip';
  onAdded: (id: string) => void;
}) {
  const t = useT(lang);
  const customCount = useStore((s) => s.customSubjects.length);
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [icon, setIcon] = React.useState(ICON_CHOICES[0]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(false);
  const canAdd = !!name.trim() && !saving;

  const close = () => { setOpen(false); setName(''); setIcon(ICON_CHOICES[0]); setError(false); };

  const submit = async () => {
    if (!canAdd) return;
    const trimmed = name.trim();
    const existing = options.find((o) => o.label.trim().toLowerCase() === trimmed.toLowerCase());
    if (existing) { onAdded(existing.id); close(); return; }
    setSaving(true);
    setError(false);
    const created = await addCustomSubject({ name: trimmed, icon, color: COLORS[customCount % COLORS.length] });
    setSaving(false);
    if (!created) { setError(true); return; }
    onAdded(created.id);
    close();
  };

  if (!open) {
    return variant === 'tile' ? (
      <button onClick={() => setOpen(true)} style={{ appearance: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 16, background: 'transparent', border: '2px dashed var(--line)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: 'var(--ink-2)', textAlign: 'left' }}>
        <span style={{ fontSize: 22, display: 'grid', placeItems: 'center', width: 22 }}>{ICONS.plus}</span>
        <span style={{ flex: 1 }}>{t('otherSubject')}</span>
      </button>
    ) : (
      <button className="qk-chip" onClick={() => setOpen(true)} style={{ borderStyle: 'dashed' }}>{ICONS.plus} {t('otherSubject')}</button>
    );
  }

  return (
    <div style={{ gridColumn: '1 / -1', flexBasis: '100%', padding: 14, borderRadius: 16, background: 'var(--surface-2)', border: '1.5px dashed var(--primary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 24, width: 32, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
        <input className="qk-input" placeholder={t('customSubjectPh')} value={name} maxLength={40} autoFocus
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } else if (e.key === 'Escape') close(); }}
          style={{ fontSize: 15, minWidth: 0 }} />
      </div>
      <div className="qk-label" style={{ marginTop: 12, marginBottom: 8 }}>{t('customSubjectIcon')}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {ICON_CHOICES.map((i) => (
          <button key={i} onClick={() => setIcon(i)} style={{ appearance: 'none', border: '2px solid ' + (i === icon ? 'var(--primary)' : 'transparent'), background: 'var(--surface)', width: 38, height: 38, borderRadius: 10, fontSize: 19, cursor: 'pointer', padding: 0 }}>{i}</button>
        ))}
      </div>
      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        {error && <div style={{ flex: '1 1 200px', fontSize: 13, color: 'var(--coral)', fontWeight: 600 }}>{t('customSubjectSaveError')}</div>}
        <button className="qk-btn qk-btn-ghost" style={{ fontSize: 13, padding: '8px 12px' }} onClick={close}>{t('cancel')}</button>
        <Btn kind="primary" icon={ICONS.plus} disabled={!canAdd} style={{ opacity: canAdd ? 1 : .5 }} onClick={submit}>{t('otherSubjectAdd')}</Btn>
      </div>
    </div>
  );
}
