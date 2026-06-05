'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ICONS } from '@/components/ui/Icons';
import { Avatar } from '@/components/ui/Avatar';
import { SessionPill, useSession, formatElapsed } from '@/components/ui/SessionPill';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';

export default function KidHomeClient() {
  const { lang, kids, activeKidId, setActiveKidId, setMode, setStudyParams, studyParams, updateKid } = useStore();
  const t = useT(lang);
  const router = useRouter();
  const kid = kids.find((k) => k.id === activeKidId) || kids[0];
  const recent = kid?.recent || [];

  const session = useSession((minutes) => {
    if (minutes > 0 && kid) updateKid(kid.id, { minutes_total: (kid.minutes_total || 0) + minutes });
  });

  const openRecent = (r: { kind: 'quiz' | 'guide' | 'pdf'; title: string }) => {
    setStudyParams({ ...studyParams, topic: r.title });
    if (r.kind === 'quiz') router.push('/kids/quiz');
    if (r.kind === 'guide') router.push('/kids/guide');
    if (r.kind === 'pdf') router.push('/kids/pdf');
  };

  if (!kid) return null;

  return (
    <AppShell>
      <div className="qk-screen qk-page-enter" style={{ padding: '32px clamp(20px, 5vw, 56px) 64px' }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          {kids.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
              {kids.map((k) => (
                <button key={k.id} onClick={() => setActiveKidId(k.id)} className="qk-chip" style={{ padding: kid?.id === k.id ? '5px 14px 5px 5px' : '5px 12px 5px 5px', gap: 8, background: kid?.id === k.id ? 'var(--ink)' : 'var(--surface)', color: kid?.id === k.id ? 'var(--surface)' : 'var(--ink-2)', border: '1.5px solid ' + (kid?.id === k.id ? 'var(--ink)' : 'var(--line)') }}>
                  <Avatar id={k.avatar} size={28} /><span>{k.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* greeting card */}
          <div className="qk-card qk-slide-up" style={{ padding: 'clamp(20px, 4vw, 36px)', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 24, alignItems: 'center', background: 'linear-gradient(135deg, var(--primary-l) 0%, var(--honey-l) 100%)', borderColor: 'var(--primary)', position: 'relative', overflow: 'hidden' }}>
            <div aria-hidden style={{ position: 'absolute', inset: 0, opacity: .16, backgroundImage: 'radial-gradient(var(--primary) 1.5px, transparent 1.5px)', backgroundSize: '22px 22px' }} />
            <div style={{ position: 'relative' }}>
              <Avatar id={kid.avatar} size={104} ring={kid.color || 'var(--primary)'} />
              {session.running && <span style={{ position: 'absolute', right: -4, top: -4, padding: '3px 8px', borderRadius: 999, background: session.paused ? 'var(--honey)' : 'var(--primary)', color: '#fff', fontSize: 10, fontWeight: 700 }}>{session.paused ? 'PAUSE' : 'LIVE'}</span>}
            </div>
            <div style={{ minWidth: 0, position: 'relative' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--primary-d)', letterSpacing: '.04em', textTransform: 'uppercase' }}>{t('kidHomeHi')}, {kid.name}! 👋</div>
              <h1 className="qk-h1" style={{ marginTop: 6, fontSize: 'clamp(26px, 3vw, 38px)' }}>{t('kidHomeReady')}</h1>
              <div style={{ marginTop: 14, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{t('today')}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22, fontVariantNumeric: 'tabular-nums' }}>{formatElapsed(session.elapsedMs)}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{t('todayStudied')}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase' }}>{t('streak')}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22, color: 'var(--coral)' }}>
                    {React.cloneElement(ICONS.flame as React.ReactElement<{ size?: number }>, { size: 20 })}<span>{kid.streak || 0}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{lang === 'es' ? 'días seguidos' : 'days'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase' }}>{t('starsEarned')}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22, color: '#7C5410' }}>
                    {React.cloneElement(ICONS.star as React.ReactElement<{ size?: number }>, { size: 20 })}<span>{kid.stars || 0}</span>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
              <SessionPill lang={lang} session={session} onStart={session.start} onTogglePause={() => session.paused ? session.resume() : session.pause()} onEnd={session.end} />
              <button onClick={() => { setMode('parent'); router.push('/dashboard'); }} style={{ appearance: 'none', border: 0, background: 'transparent', fontSize: 12, color: 'var(--ink-3)', textDecoration: 'underline', cursor: 'pointer' }}>{t('switchToParent')}</button>
            </div>
          </div>

          {/* recent / pick up */}
          <section style={{ marginTop: 36 }}>
            <h2 className="qk-h2">{recent.length ? t('kidHomeRecent') : t('kidHomePick')}</h2>
            <div className="qk-stagger" style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {recent.length > 0 ? recent.map((r, idx) => {
                const tone = r.kind === 'quiz' ? 'primary' : r.kind === 'guide' ? 'sky' : 'coral';
                const bg = `var(--${tone === 'primary' ? 'primary-l' : tone + '-l'})`;
                const fg = `var(--${tone === 'primary' ? 'primary' : tone})`;
                return (
                  <button key={idx} onClick={() => openRecent(r)} className="qk-card qk-wiggle" style={{ appearance: 'none', textAlign: 'left', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', border: '1px solid var(--line)', transition: 'transform .2s ease, box-shadow .2s ease' }}>
                    <div style={{ height: 96, background: bg, color: fg, display: 'grid', placeItems: 'center', position: 'relative' }}>
                      <div style={{ position: 'absolute', inset: 0, opacity: .18, backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
                      <div style={{ position: 'relative', transform: 'scale(2)' }}>{r.kind === 'quiz' ? ICONS.cards : r.kind === 'guide' ? ICONS.book : ICONS.pdf}</div>
                    </div>
                    <div style={{ padding: 16 }}>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>{r.kind === 'quiz' ? t('genQuiz') : r.kind === 'guide' ? t('genGuide') : t('genPdf')}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, marginTop: 4 }}>{r.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>{r.when}</div>
                    </div>
                  </button>
                );
              }) : (
                <div className="qk-card" style={{ padding: 24, textAlign: 'center', color: 'var(--ink-3)', gridColumn: '1 / -1' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>{t('kidHomeNothing')}</div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
