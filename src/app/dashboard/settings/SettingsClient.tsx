'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ICONS, Ico } from '@/components/ui/Icons';
import { Avatar, AVATARS } from '@/components/ui/Avatar';
import { Btn } from '@/components/ui/Btn';
import { PricingCards } from '@/components/ui/PricingCards';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';

const BUILTIN_SUBJECTS = [
  { id: 'sci', icon: '🔬' },
  { id: 'math', icon: '➗' },
  { id: 'lang', icon: '📖' },
  { id: 'soc', icon: '🌎' },
  { id: 'art', icon: '🎨' },
];

export default function SettingsClient() {
  const store = useStore();
  const { lang, setLang, account, setAccount, kids, setKids, updateKid, removeKid, parentPrefs, setParentPrefs, parentPin, setParentPin, customSubjects, setCustomSubjects, plan, setPlan, palette, setPalette, gamification, setGamification, difficulty, setDifficulty, setMode, setIsDemo } = store;
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
                  { id: 'sec-subjects', label: t('settingsSubjects') },
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
                <PricingCards lang={lang} cycle={plan.cycle} setCycle={(c) => { setPlan({ ...plan, cycle: c as 'monthly' | 'yearly' }); fireToast(t('saved')); }} kidsCount={kids.length || 1} current showCta={false} compact />
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

              {/* SUBJECTS */}
              <section id="sec-subjects" className="qk-card" style={{ padding: '22px 24px', scrollMarginTop: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <h2 className="qk-h2">{t('settingsSubjects')}</h2>
                  <Btn kind="ghost" icon={ICONS.plus} onClick={() => setShowAddSubject((v) => !v)}>{t('addCustomSubject')}</Btn>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                  {BUILTIN_SUBJECTS.map((s) => (
                    <div key={s.id} className="qk-card" style={{ padding: 14, boxShadow: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', fontSize: 20 }}>{s.icon}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>{t(s.id)}</div>
                    </div>
                  ))}
                  {(customSubjects || []).map((s) => (
                    <div key={s.id} className="qk-card" style={{ padding: 14, boxShadow: 'none', display: 'flex', alignItems: 'center', gap: 10, background: s.color + '22', border: '1px solid ' + s.color }}>
                      <div style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--surface)', color: s.color, display: 'grid', placeItems: 'center', fontSize: 20 }}>{s.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: s.color, fontWeight: 700 }}>{lang === 'es' ? 'PERSONAL' : 'CUSTOM'}</div>
                      </div>
                      <button onClick={() => setCustomSubjects(customSubjects.filter((x) => x.id !== s.id))} style={{ appearance: 'none', border: 0, background: 'transparent', color: 'var(--ink-3)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                        {React.cloneElement(ICONS.trash as React.ReactElement<{ size?: number }>, { size: 14 })}
                      </button>
                    </div>
                  ))}
                </div>
                {showAddSubject && (
                  <AddSubjectPanel
                    lang={lang}
                    onCancel={() => setShowAddSubject(false)}
                    onAdd={(s) => {
                      setCustomSubjects([...(customSubjects || []), { ...s, id: 'cus-' + Math.random().toString(36).slice(2, 7) }]);
                      setShowAddSubject(false);
                      fireToast(t('saved'));
                    }}
                  />
                )}
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
                  <button onClick={() => { setAccount(null); setIsDemo(false); setKids([]); router.push('/'); }} className="qk-btn qk-btn-ghost" style={{ borderColor: 'var(--coral)', color: 'var(--coral)' }}>{t('signOut')}</button>
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

function AddSubjectPanel({ lang, onCancel, onAdd }: { lang: 'en' | 'es'; onCancel: () => void; onAdd: (s: { name: string; icon: string; color: string }) => void }) {
  const t = useT(lang);
  const ICONS_GRID = ['🤖', '💻', '🔤', '🎵', '🌱', '🧪', '🎭', '🧮', '✏️', '🌍', '⚽', '🍳', '🦖', '🎨'];
  const COLORS = ['#3F7A4F', '#E29A2B', '#E26D5A', '#6BA8C9', '#B14F8C', '#7A5AE0', '#2F7C8A', '#5A9F58'];
  const [name, setName] = React.useState('');
  const [icon, setIcon] = React.useState(ICONS_GRID[0]);
  const [color, setColor] = React.useState(COLORS[0]);

  return (
    <div className="qk-card" style={{ marginTop: 14, padding: 18, background: 'var(--surface-2)', boxShadow: 'none', border: '1.5px dashed var(--primary)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17 }}>{t('addCustomSubject')}</div>
        <button onClick={onCancel} className="qk-btn qk-btn-ghost" style={{ padding: '4px 8px', fontSize: 13 }}>{t('cancel')}</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 14, alignItems: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--surface)', color, display: 'grid', placeItems: 'center', fontSize: 32, border: '2px solid ' + color }}>{icon}</div>
        <input className="qk-input" placeholder={t('customSubjectPh')} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </div>

      <div style={{ marginTop: 14 }}>
        <div className="qk-label" style={{ marginBottom: 8 }}>{t('customSubjectIcon')}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {ICONS_GRID.map((i) => (
            <button key={i} onClick={() => setIcon(i)} style={{ appearance: 'none', border: '2px solid ' + (i === icon ? color : 'transparent'), background: 'var(--surface)', width: 40, height: 40, borderRadius: 10, fontSize: 20, cursor: 'pointer' }}>{i}</button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div className="qk-label" style={{ marginBottom: 8 }}>{t('customSubjectColor')}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {COLORS.map((c) => (
            <button key={c} onClick={() => setColor(c)} aria-label={c}
              style={{ width: 34, height: 34, borderRadius: '50%', background: c, border: '3px solid ' + (color === c ? 'var(--ink)' : 'transparent'), cursor: 'pointer', padding: 0 }} />
          ))}
        </div>
      </div>

      <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Btn kind="primary" icon={ICONS.plus} disabled={!name.trim()} style={{ opacity: name.trim() ? 1 : .5 }}
          onClick={() => onAdd({ name: name.trim(), icon, color })}>
          {t('addCustomSubject')}
        </Btn>
      </div>
    </div>
  );
}
