'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ICONS } from '@/components/ui/Icons';
import { Avatar, AVATARS } from '@/components/ui/Avatar';
import { Btn } from '@/components/ui/Btn';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';
import { subjectOptions } from '@/lib/subjects';
import type { KidSubject } from '@/types';

const STEPS = 5;
const COLORS = [['#3F7A4F', 'leaf'], ['#E29A2B', 'honey'], ['#E26D5A', 'coral'], ['#6BA8C9', 'sky'], ['#B14F8C', 'berry'], ['#7A5AE0', 'violet']];

export default function AddKidClient() {
  const { lang, kids, addKid, setActiveKidId, customSubjects } = useStore();
  const t = useT(lang);
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [draft, setDraft] = React.useState({ name: '', grade: '', avatar: '', color: '#3F7A4F', signature: '' });
  // subject id -> optional focus note; presence of the key means the subject is selected
  const [subjects, setSubjects] = React.useState<Record<string, string>>({});
  const [subjectLangs, setSubjectLangs] = React.useState<Record<string, 'en' | 'es' | 'fr'>>({});
  const subjectList = subjectOptions(lang, customSubjects);
  const toggleSubject = (id: string) => setSubjects((cur) => {
    const next = { ...cur };
    if (id in next) delete next[id]; else next[id] = '';
    return next;
  });
  const kidSubjects: KidSubject[] = Object.entries(subjects).map(([subject, focus]) => ({ subject, lang: subjectLangs[subject] || (subject === 'fr' ? 'fr' : lang), focus: focus.trim() || undefined }));

  const canNext = [
    () => draft.name.trim().length > 0,
    () => !!draft.grade,
    () => Object.keys(subjects).length > 0,
    () => !!draft.avatar,
    () => true,
  ][step]();

  const finish = async () => {
    const code = (draft.name.toUpperCase().replace(/[^A-Z]/g, '') + '12345').slice(0, 6);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('kids')
        .insert({
          parent_id: user.id,
          name: draft.name.trim() || 'New kid',
          grade: draft.grade || 'K',
          avatar: draft.avatar || 'sprout',
          color: draft.color,
          code,
          signature: draft.signature || null,
        })
        .select()
        .single();
      if (!error && data) {
        if (kidSubjects.length > 0) {
          const { error: subjErr } = await supabase.from('kid_subjects').insert(kidSubjects.map((ks) => ({ kid_id: data.id, subject: ks.subject, lang: ks.lang ?? 'en', focus: ks.focus ?? null })));
          if (subjErr) console.warn('Could not save subjects:', subjErr);
        }
        addKid({ id: data.id, parent_id: user.id, name: data.name, grade: data.grade, avatar: data.avatar, color: data.color, code: data.code, streak: 0, stars: 0, minutes_total: 0, weekly: 0, goal_min: 30, recent: [], signature: draft.signature, subjects: kidSubjects });
        setActiveKidId(data.id);
      }
    } else {
      const id = (draft.name.trim().toLowerCase() || 'kid') + '-' + Math.random().toString(36).slice(2, 5);
      addKid({ id, parent_id: 'demo', name: draft.name.trim() || 'New kid', grade: draft.grade || 'K', avatar: draft.avatar || 'sprout', color: draft.color, code, streak: 0, stars: 0, minutes_total: 0, weekly: 0, goal_min: 30, recent: [], signature: draft.signature, subjects: kidSubjects });
      setActiveKidId(id);
    }
    router.push('/dashboard');
  };

  return (
    <AppShell>
      <div className="qk-screen qk-page-enter">
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
            <button className="qk-btn qk-btn-ghost" onClick={() => step === 0 ? router.back() : setStep((s) => s - 1)}>{ICONS.back} <span>{t('back')}</span></button>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{t('onbStep')} {step + 1} {t('of')} {STEPS}</div>
          </div>
          <div className="qk-progress" style={{ marginBottom: 24 }}><span style={{ width: `${((step + 1) / STEPS) * 100}%` }} /></div>

          <div className="qk-card qk-slide-up" style={{ padding: 'clamp(20px, 5vw, 32px)' }}>
            {step === 0 && (
              <div>
                <h2 className="qk-h2">{t('onbName')}</h2>
                <p className="qk-sub" style={{ marginTop: 6, marginBottom: 20 }}>{lang === 'es' ? 'Lo usaremos para saludar a tu peque.' : "We'll use this to greet your child."}</p>
                <input className="qk-input" placeholder={t('onbNamePh')} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} autoFocus style={{ fontFamily: 'var(--font-display)', fontSize: 22 }} />
                <div style={{ marginTop: 24 }}>
                  <div className="qk-label" style={{ marginBottom: 10 }}>{t('chooseColor')}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {COLORS.map(([c]) => (
                      <button key={c} onClick={() => setDraft({ ...draft, color: c })} style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid ' + (draft.color === c ? 'var(--ink)' : 'transparent'), background: c, cursor: 'pointer', padding: 0, transition: 'border-color .15s ease' }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="qk-h2">{t('onbGrade')}</h2>
                <p className="qk-sub" style={{ marginTop: 6, marginBottom: 20 }}>{lang === 'es' ? 'Esto nos ayuda a ajustar las preguntas.' : 'This helps us tune the questions.'}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((g) => (
                    <button key={g} onClick={() => setDraft({ ...draft, grade: g })} className={`qk-chip${draft.grade === g ? ' on' : ''}`} style={{ minWidth: 54, justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 16 }}>
                      {g === 'K' ? (lang === 'es' ? 'Kínder' : 'K') : g}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="qk-h2">{t('subjectsStep').replace('{name}', draft.name.trim() || (lang === 'es' ? 'tu peque' : 'your kid'))}</h2>
                <p className="qk-sub" style={{ marginTop: 6, marginBottom: 20 }}>{t('subjectsStepSub')}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
                  {subjectList.map((s) => {
                    const on = s.id in subjects;
                    return (
                      <button key={s.id} onClick={() => toggleSubject(s.id)} style={{ appearance: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 16, background: on ? 'var(--primary-l)' : 'var(--surface-2)', border: '2px solid ' + (on ? 'var(--primary)' : 'transparent'), cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: 'var(--ink)', textAlign: 'left' }}>
                        <span style={{ fontSize: 22 }}>{s.icon}</span>
                        <span style={{ flex: 1 }}>{s.label}</span>
                        {on && <span style={{ color: 'var(--primary)' }}>{ICONS.check}</span>}
                      </button>
                    );
                  })}
                </div>
                {Object.keys(subjects).length > 0 ? (
                  <div style={{ marginTop: 22, display: 'grid', gap: 10 }}>
                    {Object.keys(subjects).map((id) => {
                      const s = subjectList.find((x) => x.id === id);
                      if (!s) return null;
                      return (
                        <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{s.icon}</span>
                          <input className="qk-input" placeholder={`${s.label} · ${t('focusPh')}`} value={subjects[id]} maxLength={120} onChange={(e) => setSubjects({ ...subjects, [id]: e.target.value })} style={{ fontSize: 14, minWidth: 0 }} />
                          <select className="qk-input" aria-label={t('subjectLang')} value={subjectLangs[id] || (id === 'fr' ? 'fr' : lang)} onChange={(e) => setSubjectLangs({ ...subjectLangs, [id]: e.target.value as 'en' | 'es' | 'fr' })} style={{ width: 'auto', fontSize: 14 }}>
                            <option value="en">English</option><option value="es">Español</option><option value="fr">Français</option>
                          </select>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ marginTop: 18, fontSize: 13, color: 'var(--ink-3)' }}>{t('subjectsNeedOne')}</div>
                )}
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="qk-h2">{t('onbAvatar')}</h2>
                <p className="qk-sub" style={{ marginTop: 6, marginBottom: 20 }}>{lang === 'es' ? 'Elige un amiguito que les represente.' : 'Pick a little friend to represent them.'}</p>
                <div className="qk-avatar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 'clamp(8px, 2.5vw, 14px)' }}>
                  {AVATARS.map((a) => {
                    const on = draft.avatar === a.id;
                    return (
                      <button key={a.id} onClick={() => setDraft({ ...draft, avatar: a.id })} className="qk-wiggle" style={{ appearance: 'none', minWidth: 0, padding: 'clamp(8px, 2.5vw, 14px)', borderRadius: 18, background: on ? 'var(--primary-l)' : 'var(--surface-2)', border: '2px solid ' + (on ? 'var(--primary)' : 'transparent'), cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'all .15s ease' }}>
                        <Avatar id={a.id} size={64} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)' }}>{a.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="qk-h2">{t('onbSig')}</h2>
                <p className="qk-sub" style={{ marginTop: 6, marginBottom: 20 }}>{t('onbSigSub')}</p>
                <SignatureCanvas value={draft.signature} onChange={(v) => setDraft({ ...draft, signature: v })} />
                <div style={{ marginTop: 24, padding: 16, background: 'var(--surface-2)', borderRadius: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <Avatar id={draft.avatar || 'sprout'} size={56} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20 }}>{draft.name || (lang === 'es' ? 'Tu peque' : 'Your kid')}</div>
                    <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{lang === 'es' ? 'Grado ' : 'Grade '}{draft.grade || '?'}{draft.color && <span style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 8, width: 12, height: 12, borderRadius: '50%', background: draft.color }} />}</div>
                  </div>
                </div>
                {kids.length >= 1 && (
                  <div style={{ marginTop: 14, fontSize: 12, color: 'var(--ink-3)', textAlign: 'center' }}>
                    {lang === 'es' ? '+$5/mes se sumarán a tu facturación por este peque adicional.' : '+$5/month will be added to your billing for this additional kid.'}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', marginTop: 32, gap: 12 }}>
              <button className="qk-btn qk-btn-ghost" onClick={() => step === 0 ? router.back() : setStep((s) => s - 1)}>{ICONS.back} <span>{t('back')}</span></button>
              {step < STEPS - 1
                ? <Btn kind="primary" disabled={!canNext} onClick={() => setStep((s) => s + 1)} iconRight={ICONS.next} style={{ opacity: canNext ? 1 : .5 }}>{t('next')}</Btn>
                : <Btn kind="primary" onClick={finish} icon={ICONS.check}>{t('finishSetup')}</Btn>}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function SignatureCanvas({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = React.useRef<HTMLCanvasElement>(null);
  const drawing = React.useRef(false);
  const last = React.useRef<{ x: number; y: number } | null>(null);

  React.useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * dpr; c.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1F3326'; ctx.lineWidth = 2.4;
    if (value) { const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height); img.src = value; }
  }, []);

  const pos = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    const p = (e as React.TouchEvent).touches ? (e as React.TouchEvent).touches[0] : (e as React.MouseEvent);
    return { x: p.clientX - rect.left, y: p.clientY - rect.top };
  };

  return (
    <div>
      <div style={{ background: 'var(--surface)', border: '1.5px dashed var(--line)', borderRadius: 18, height: 160, position: 'relative', backgroundImage: 'linear-gradient(transparent calc(100% - 30px), var(--line) 0)' }}>
        <canvas ref={ref} style={{ width: '100%', height: '100%', touchAction: 'none', cursor: 'crosshair' }}
          onMouseDown={(e) => { e.preventDefault(); drawing.current = true; last.current = pos(e); }}
          onMouseMove={(e) => { if (!drawing.current) return; const ctx = ref.current!.getContext('2d')!; const p = pos(e); ctx.beginPath(); ctx.moveTo(last.current!.x, last.current!.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last.current = p; }}
          onMouseUp={() => { if (!drawing.current) return; drawing.current = false; onChange(ref.current!.toDataURL('image/png')); }}
          onMouseLeave={() => { drawing.current = false; }}
          onTouchStart={(e) => { e.preventDefault(); drawing.current = true; last.current = pos(e); }}
          onTouchMove={(e) => { if (!drawing.current) return; e.preventDefault(); const ctx = ref.current!.getContext('2d')!; const p = pos(e); ctx.beginPath(); ctx.moveTo(last.current!.x, last.current!.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last.current = p; }}
          onTouchEnd={() => { if (!drawing.current) return; drawing.current = false; onChange(ref.current!.toDataURL('image/png')); }}
        />
        <div style={{ position: 'absolute', left: 18, bottom: 8, fontSize: 11, color: 'var(--ink-3)', fontFamily: 'ui-monospace, monospace' }}>x ________________________</div>
      </div>
      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="qk-btn qk-btn-ghost" style={{ fontSize: 13, padding: '8px 12px' }} onClick={() => { const c = ref.current!; c.getContext('2d')!.clearRect(0, 0, c.width, c.height); onChange(''); }}>
          {ICONS.trash} <span>Clear</span>
        </button>
      </div>
    </div>
  );
}
