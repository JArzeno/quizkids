'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ICONS, Ico } from '@/components/ui/Icons';
import { Avatar, AVATARS } from '@/components/ui/Avatar';
import { Btn } from '@/components/ui/Btn';
import { PricingCards, QK_PLANS } from '@/components/ui/PricingCards';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';

export default function SettingsClient() {
  const store = useStore();
  const { lang, setLang, account, setAccount, kids, setKids, updateKid, removeKid, parentPrefs, setParentPrefs, parentPin, setParentPin, customSubjects, setCustomSubjects, plan, setPlan, palette, setPalette, gamification, setGamification, difficulty, setDifficulty, setMode } = store;
  const t = useT(lang);
  const router = useRouter();
  const [editingKidId, setEditingKidId] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState('');
  const [showAddSubject, setShowAddSubject] = React.useState(false);

  const fireToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  const PALETTES = [['#3F7A4F', 'forest'], ['#5A9F58', 'meadow'], ['#2F7C8A', 'ocean'], ['#9F5099', 'berry']];

  return (
    <AppShell>
      <div className="qk-screen qk-page-enter" style={{ padding: '28px clamp(20px, 5vw, 56px) 64px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div>
            <button onClick={() => router.push('/dashboard')} className="qk-btn qk-btn-ghost" style={{ padding: '6px 12px', fontSize: 13, marginBottom: 14 }}>{ICONS.back} <span>{t('back')}</span></button>
            <h1 className="qk-h1">{t('settings')}</h1>
            <p className="qk-sub">{t('settingsHi')}{account?.name?.split(' ')[0] || 'Ana'}.</p>
          </div>

          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '220px 1fr', gap: 28 }} className="qk-settings-grid">
            {/* sidebar */}
            <aside style={{ position: 'sticky', top: 0, alignSelf: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  { id: 'sec-account', label: t('settingsAccount') },
                  { id: 'sec-billing', label: t('settingsBilling') },
                  { id: 'sec-kids', label: t('settingsKids') },
                  { id: 'sec-security', label: t('settingsSecurity') },
                  { id: 'sec-prefs', label: t('settingsPrefs') },
                  { id: 'sec-danger', label: t('settingsDanger'), coral: true },
                ].map((s) => (
                  <button key={s.id} onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    style={{ appearance: 'none', border: 0, background: 'transparent', textAlign: 'left', padding: '10px 12px', borderRadius: 12, fontSize: 14, fontWeight: 600, color: s.coral ? 'var(--coral)' : 'var(--ink-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </aside>

            {/* content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* ACCOUNT */}
              <section id="sec-account" className="qk-card" style={{ padding: '22px 24px', scrollMarginTop: 24 }}>
                <h2 className="qk-h2" style={{ marginBottom: 18 }}>{t('settingsAccount')}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <Row label={t('fieldFullName')}><input className="qk-input" value={account?.name || ''} onChange={(e) => setAccount({ ...account!, name: e.target.value })} /></Row>
                  <Row label={t('fieldEmail')}><input className="qk-input" value={account?.email || ''} onChange={(e) => setAccount({ ...account!, email: e.target.value })} /></Row>
                </div>
                <div style={{ marginTop: 6, display: 'flex', justifyContent: 'flex-end' }}>
                  <Btn kind="primary" icon={ICONS.check} onClick={() => fireToast(t('saved'))}>{t('saveChanges')}</Btn>
                </div>
              </section>

              {/* BILLING */}
              <section id="sec-billing" className="qk-card" style={{ padding: '22px 24px', scrollMarginTop: 24 }}>
                <h2 className="qk-h2" style={{ marginBottom: 18 }}>{t('settingsBilling')}</h2>
                <PricingCards lang={lang} cycle={plan.cycle} setCycle={(c) => setPlan({ ...plan, cycle: c as 'monthly' | 'yearly' })} currentPlanId={plan.tier} onSelect={(tier) => { setPlan({ ...plan, tier: tier as 'free' | 'family', since: Date.now() }); fireToast(t('saved')); }} compact />
              </section>

              {/* KIDS */}
              <section id="sec-kids" className="qk-card" style={{ padding: '22px 24px', scrollMarginTop: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <h2 className="qk-h2">{t('settingsKids')}</h2>
                  <Btn kind="ghost" icon={ICONS.plus} onClick={() => router.push('/dashboard/add-kid')}>{t('addAnotherKid')}</Btn>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {kids.map((k) => (
                    <div key={k.id} className="qk-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--line)', boxShadow: 'none' }}>
                      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <Avatar id={k.avatar} size={48} ring={k.color || 'var(--primary)'} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17 }}>{k.name}</div>
                          <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{lang === 'es' ? 'Grado ' : 'Grade '}{k.grade} · <code style={{ fontFamily: 'ui-monospace, monospace' }}>{k.code}</code></div>
                        </div>
                        <button className="qk-btn qk-btn-ghost" style={{ fontSize: 13, padding: '8px 12px' }} onClick={() => setEditingKidId(editingKidId === k.id ? null : k.id)}>
                          {editingKidId === k.id ? (lang === 'es' ? 'Cerrar' : 'Close') : t('editKid')}
                        </button>
                      </div>
                      {editingKidId === k.id && (
                        <div style={{ padding: '18px 18px 20px', background: 'var(--surface-2)', borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <Row label={t('onbName')}><input className="qk-input" value={k.name} onChange={(e) => updateKid(k.id, { name: e.target.value })} /></Row>
                            <Row label={t('onbGrade')}>
                              <select className="qk-input" value={k.grade} onChange={(e) => updateKid(k.id, { grade: e.target.value })}>
                                {['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((g) => <option key={g} value={g}>{g === 'K' ? 'Kindergarten' : `Grade ${g}`}</option>)}
                              </select>
                            </Row>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, paddingTop: 8, borderTop: '1px dashed var(--line)' }}>
                            <button onClick={() => { if (confirm(t('deleteKidWarn'))) { removeKid(k.id); setEditingKidId(null); fireToast(t('saved')); } }} className="qk-btn qk-btn-ghost" style={{ color: 'var(--coral)', borderColor: 'var(--coral-l)', fontSize: 13 }}>{ICONS.trash}<span>{t('deleteKid')}</span></button>
                            <Btn kind="primary" icon={ICONS.check} onClick={() => { setEditingKidId(null); fireToast(t('saved')); }}>{t('saveChanges')}</Btn>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* SECURITY */}
              <section id="sec-security" className="qk-card" style={{ padding: '22px 24px', scrollMarginTop: 24 }}>
                <h2 className="qk-h2" style={{ marginBottom: 18 }}>{t('settingsSecurity')}</h2>
                <Row label={t('changePin')}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input className="qk-input" type="text" inputMode="numeric" maxLength={4} value={parentPin} onChange={(e) => setParentPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))} style={{ maxWidth: 120, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, letterSpacing: '.1em' }} />
                    <Btn kind="ghost" onClick={() => fireToast(t('pinSaved'))}>{t('save')}</Btn>
                  </div>
                </Row>
              </section>

              {/* PREFERENCES */}
              <section id="sec-prefs" className="qk-card" style={{ padding: '22px 24px', scrollMarginTop: 24 }}>
                <h2 className="qk-h2" style={{ marginBottom: 18 }}>{t('settingsPrefs')}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <Row label={t('appLanguage')}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[{ id: 'en', label: 'English', flag: '🇺🇸' }, { id: 'es', label: 'Español', flag: '🇪🇸' }].map((l) => (
                        <button key={l.id} onClick={() => setLang(l.id as 'en' | 'es')} className={`qk-chip${lang === l.id ? ' on' : ''}`}><span>{l.flag}</span><span>{l.label}</span></button>
                      ))}
                    </div>
                  </Row>
                  <Row label={lang === 'es' ? 'Tema de color' : 'Color theme'}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {PALETTES.map(([c, n]) => (
                        <button key={n} aria-label={n} onClick={() => setPalette(n)} style={{ width: 36, height: 36, borderRadius: '50%', background: c, border: '3px solid ' + (palette === n ? 'var(--ink)' : 'transparent'), cursor: 'pointer', padding: 0, transition: 'border-color .15s ease' }} />
                      ))}
                    </div>
                  </Row>
                </div>
              </section>

              {/* DANGER */}
              <section id="sec-danger" className="qk-card" style={{ padding: '22px 24px', scrollMarginTop: 24, borderColor: 'var(--coral)' }}>
                <h2 className="qk-h2" style={{ color: 'var(--coral)', marginBottom: 18 }}>{t('settingsDanger')}</h2>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button onClick={() => { setAccount(null); router.push('/'); }} className="qk-btn qk-btn-ghost" style={{ borderColor: 'var(--coral)', color: 'var(--coral)' }}>{t('signOut')}</button>
                  <button className="qk-btn" style={{ background: 'var(--coral)', color: '#fff' }}>{lang === 'es' ? 'Eliminar cuenta' : 'Delete account'}</button>
                </div>
              </section>
            </div>
          </div>
        </div>

        {toast && (
          <div style={{ position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)', padding: '12px 16px', background: 'var(--ink)', color: '#fff', borderRadius: 12, boxShadow: 'var(--shadow-lg)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8, animation: 'qk-toast-in .3s cubic-bezier(.2,.7,.2,1)', zIndex: 9999 }}>
            <span style={{ color: 'var(--honey)', display: 'inline-flex' }}>{ICONS.check}</span>{toast}
          </div>
        )}
        <style>{`@media (max-width: 800px) { .qk-settings-grid { grid-template-columns: 1fr !important; } .qk-settings-grid aside { position: static !important; } }`}</style>
      </div>
    </AppShell>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div className="qk-label">{label}</div>
      {children}
    </div>
  );
}
