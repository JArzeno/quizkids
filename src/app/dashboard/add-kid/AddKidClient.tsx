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

const STEPS = 4;
const COLORS = [['#3F7A4F', 'leaf'], ['#E29A2B', 'honey'], ['#E26D5A', 'coral'], ['#6BA8C9', 'sky'], ['#B14F8C', 'berry'], ['#7A5AE0', 'violet']];

export default function AddKidClient() {
  const { lang, addKid, setActiveKidId } = useStore();
  const t = useT(lang);
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [draft, setDraft] = React.useState({ name: '', grade: '', avatar: '', color: '#3F7A4F', signature: '' });

  const canNext = [
    () => draft.name.trim().length > 0,
    () => !!draft.grade,
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
        addKid({ id: data.id, parent_id: user.id, name: data.name, grade: data.grade, avatar: data.avatar, color: data.color, code: data.code, streak: 0, stars: 0, minutes_total: 0, weekly: 0, goal_min: 30, recent: [], signature: draft.signature });
        setActiveKidId(data.id);
      }
    } else {
      const id = (draft.name.trim().toLowerCase() || 'kid') + '-' + Math.random().toString(36).slice(2, 5);
      addKid({ id, parent_id: 'demo', name: draft.name.trim() || 'New kid', grade: draft.grade || 'K', avatar: draft.avatar || 'sprout', color: draft.color, code, streak: 0, stars: 0, minutes_total: 0, weekly: 0, goal_min: 30, recent: [], signature: draft.signature });
      setActiveKidId(id);
    }
    router.push('/dashboard');
  };

  return (
    <AppShell>
      <div className="qk-screen qk-page-enter">
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <button className="qk-btn qk-btn-ghost" onClick={() => step === 0 ? router.back() : setStep((s) => s - 1)}>{ICONS.back} <span>{t('back')}</span></button>
            <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{t('onbStep')} {step + 1} {t('of')} {STEPS}</div>
          </div>
          <div className="qk-progress" style={{ marginBottom: 24 }}><span style={{ width: `${((step + 1) / STEPS) * 100}%` }} /></div>

          <div className="qk-card qk-slide-up" style={{ padding: 32 }}>
            {step === 0 && (
              <div>
                <h2 className="qk-h2">{t('onbName')}</h2>
                <p className="qk-sub" style={{ marginTop: 6, marginBottom: 20 }}>{lang === 'es' ? 'Lo usaremos para saludar a tu peque.' : "We'll use this to greet your child."}</p>
                <input className="qk-input" placeholder={t('onbNamePh')} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} autoFocus style={{ fontFamily: 'var(--font-display)', fontSize: 22 }} />
                <div style={{ marginTop: 24 }}>
                  <div className="qk-label" style={{ marginBottom: 10 }}>{t('chooseColor')}</div>
                  <div style={{ display: 'flex', gap: 10 }}>
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
                <h2 className="qk-h2">{t('onbAvatar')}</h2>
                <p className="qk-sub" style={{ marginTop: 6, marginBottom: 20 }}>{lang === 'es' ? 'Elige un amiguito que les represente.' : 'Pick a little friend to represent them.'}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                  {AVATARS.map((a) => {
                    const on = draft.avatar === a.id;
                    return (
                      <button key={a.id} onClick={() => setDraft({ ...draft, avatar: a.id })} className="qk-wiggle" style={{ appearance: 'none', padding: 14, borderRadius: 18, background: on ? 'var(--primary-l)' : 'var(--surface-2)', border: '2px solid ' + (on ? 'var(--primary)' : 'transparent'), cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'all .15s ease' }}>
                        <Avatar id={a.id} size={64} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)' }}>{a.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="qk-h2">{t('onbSig')}</h2>
                <p className="qk-sub" style={{ marginTop: 6, marginBottom: 20 }}>{t('onbSigSub')}</p>
                <SignatureCanvas value={draft.signature} onChange={(v) => setDraft({ ...draft, signature: v })} />
                <div style={{ marginTop: 24, padding: 16, background: 'var(--surface-2)', borderRadius: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <Avatar id={draft.avatar || 'sprout'} size={56} />
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20 }}>{draft.name || (lang === 'es' ? 'Tu peque' : 'Your kid')}</div>
                    <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{lang === 'es' ? 'Grado ' : 'Grade '}{draft.grade || '?'}{draft.color && <span style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 8, width: 12, height: 12, borderRadius: '50%', background: draft.color }} />}</div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, gap: 12 }}>
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
