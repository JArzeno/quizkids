'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ICONS } from '@/components/ui/Icons';
import { Avatar } from '@/components/ui/Avatar';
import { Btn } from '@/components/ui/Btn';
import { Stars, StatCard } from '@/components/ui/Stars';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';

export default function DashboardClient() {
  const { lang, kids, account, setActiveKidId, setMode, gamification } = useStore();
  const t = useT(lang);
  const router = useRouter();

  const totalStars = kids.reduce((a, k) => a + (k.stars || 0), 0);
  const totalMin = kids.reduce((a, k) => a + (k.minutes_total || 0), 0);
  const longest = Math.max(0, ...kids.map((k) => k.streak || 0));

  const openKidHome = (id: string) => { setActiveKidId(id); setMode('kid'); router.push('/kids/home'); };
  const createFor = (id: string) => { setActiveKidId(id); router.push('/dashboard/picker'); };

  return (
    <AppShell>
      <div className="qk-screen qk-page-enter">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span className="qk-eyebrow">{t('parent')}</span>
              <h1 className="qk-h1" style={{ marginTop: 10 }}>{t('dashHi')}, {account?.name?.split(' ')[0] || 'Ana'} 👋</h1>
              <p className="qk-sub">{t('dashGreet')}</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/dashboard/add-kid" className="qk-btn qk-btn-ghost">{ICONS.plus}<span>{t('addKid')}</span></Link>
              <Btn kind="primary" icon={ICONS.spark} onClick={() => createFor(kids[0]?.id || '')}>{t('createNew')}</Btn>
            </div>
          </div>

          {gamification !== 'minimal' && (
            <div className="qk-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 24 }}>
              <StatCard tone="honey" icon={ICONS.star} value={totalStars} label={t('starsEarned')} />
              <StatCard tone="coral" icon={ICONS.flame} value={longest} label={t('streak')} />
              <StatCard tone="sky" icon={ICONS.book} value={totalMin + ' ' + t('minutes')} label={t('thisWeek') + ' · ' + t('minStudied')} />
            </div>
          )}

          <div className="qk-stagger" style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {kids.map((k) => (
              <div key={k.id} className="qk-card qk-card-interactive" style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <Avatar id={k.avatar} size={64} ring={k.color || 'var(--primary)'} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20 }}>{k.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{lang === 'es' ? 'Grado ' : 'Grade '}{k.grade}{k.lastSubject ? ' · ' + k.lastSubject : ''}</div>
                  </div>
                  {gamification !== 'minimal' && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--coral)', fontWeight: 700 }}>{ICONS.flame}{k.streak || 0}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{t('streak')}</div>
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-3)', marginBottom: 6 }}>
                    <span>{lang === 'es' ? 'Progreso semanal' : 'Weekly progress'}</span>
                    <span>{k.weekly || 0}%</span>
                  </div>
                  <div className="qk-progress"><span style={{ width: (k.weekly || 0) + '%' }} /></div>
                </div>
                {k.recent && k.recent.length > 0 && (
                  <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {k.recent.map((r, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 12 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--primary-l)', color: 'var(--primary-d)', display: 'grid', placeItems: 'center' }}>
                          {r.kind === 'quiz' ? ICONS.cards : r.kind === 'pdf' ? ICONS.pdf : ICONS.book}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{r.when}</div>
                        </div>
                        {gamification !== 'minimal' && r.kind === 'quiz' && <Stars count={r.score} of={5} size={14} />}
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                  <Btn kind="primary" onClick={() => createFor(k.id)} icon={ICONS.spark}>{t('createNew')}</Btn>
                  <button className="qk-btn qk-btn-ghost" onClick={() => openKidHome(k.id)}>{t('open')}</button>
                </div>
              </div>
            ))}

            <button onClick={() => router.push('/dashboard/add-kid')} className="qk-card qk-dotgrid" style={{ display: 'grid', placeItems: 'center', border: '2px dashed var(--line)', background: 'transparent', cursor: 'pointer', padding: 20, minHeight: 200, color: 'var(--ink-3)', fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, margin: '0 auto 10px', borderRadius: '50%', background: 'var(--surface)', display: 'grid', placeItems: 'center', color: 'var(--primary)' }}>{ICONS.plus}</div>
                {t('addKid')}
              </div>
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
