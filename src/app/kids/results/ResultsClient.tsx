'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Ico, ICONS } from '@/components/ui/Icons';
import { Avatar } from '@/components/ui/Avatar';
import { Btn } from '@/components/ui/Btn';
import { StatCard } from '@/components/ui/Stars';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';

export default function ResultsClient() {
  const { lang, kids, activeKidId, quizResult, studyParams, gamification, setQuizResult, updateKid } = useStore();
  const t = useT(lang);
  const router = useRouter();
  const kid = kids.find((k) => k.id === activeKidId) || kids[0];

  React.useEffect(() => {
    if (!quizResult) { router.replace('/kids/home'); return; }
    if (kid && quizResult.stars > 0) updateKid(kid.id, { stars: (kid.stars || 0) + quizResult.stars });
  }, []);

  if (!quizResult) return null;
  const { total, correct, picks, cards, stars } = quizResult;
  const pct = Math.round((correct / total) * 100);
  const goldStars = pct >= 90 ? 5 : pct >= 75 ? 4 : pct >= 60 ? 3 : pct >= 40 ? 2 : 1;

  return (
    <AppShell>
      <div className="qk-screen qk-page-enter" style={{ padding: 0, minHeight: 'calc(100dvh - 65px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px 0', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          <button onClick={() => router.push('/kids/home')} className="qk-btn qk-btn-ghost">{ICONS.back} <span>{t('backHome')}</span></button>
          {kid && <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 12px 4px 4px', borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--line)' }}><Avatar id={kid.avatar} size={32} /><span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{kid.name}</span></div>}
        </div>

        <div style={{ maxWidth: 820, margin: '24px auto 0', padding: '0 22px 64px' }}>
          <div className="qk-card qk-slide-up" style={{ padding: 32, position: 'relative', overflow: 'hidden' }}>
            {/* confetti dots */}
            <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: .5 }}>
              {[...Array(18)].map((_, i) => (
                <span key={i} style={{ position: 'absolute', left: `${(i * 53) % 100}%`, top: `${(i * 37) % 80}%`, width: 8 + (i % 3) * 3, height: 8 + (i % 3) * 3, borderRadius: i % 2 ? '50%' : '4px', background: ['var(--primary)', 'var(--honey)', 'var(--coral)', 'var(--sky)'][i % 4], transform: `rotate(${i * 23}deg)`, opacity: .6, display: 'block' }} />
              ))}
            </div>

            <div style={{ position: 'relative', textAlign: 'center' }}>
              <div style={{ display: 'inline-block', position: 'relative' }}>
                {kid && <Avatar id={kid.avatar} size={120} ring={kid.color || 'var(--primary)'} />}
                <div className="qk-sticker qk-sticker-pop" style={{ position: 'absolute', right: -18, top: -10, fontSize: 14 }}>+{stars} ⭐</div>
              </div>
              <h1 className="qk-h1" style={{ marginTop: 14 }}>{t('resultsTitle')}</h1>
              <p className="qk-sub" style={{ margin: '6px auto 0', textAlign: 'center' }}>{t('resultsSub')}</p>

              {gamification !== 'minimal' && (
                <div style={{ marginTop: 18, display: 'inline-flex', gap: 6 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} style={{ color: i < goldStars ? 'var(--honey)' : 'rgba(31,51,38,.12)', display: 'inline-flex', transform: `translateY(${i < goldStars ? '0px' : '4px'})`, transition: `transform .3s ease ${i * 60}ms` }}>
                      <Ico d={<path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />} fill="currentColor" stroke="none" size={36} />
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="qk-stagger" style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, position: 'relative' }}>
              <StatCard tone="primary" icon={ICONS.check} value={`${correct}/${total}`} label={t('correctCt')} />
              <StatCard tone="honey" icon={ICONS.star} value={pct + '%'} label={t('accuracy')} />
              <StatCard tone="coral" icon={ICONS.flame} value={correct} label={t('streakNow')} />
            </div>

            {gamification !== 'minimal' && pct >= 60 && (
              <div className="qk-bounce-in" style={{ marginTop: 18, padding: 16, background: 'var(--honey-l)', borderRadius: 18, display: 'flex', gap: 14, alignItems: 'center', position: 'relative' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--honey)', color: '#fff', display: 'grid', placeItems: 'center' }}>{ICONS.star}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18 }}>{t('rewardEarned')}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>{lang === 'es' ? `"Explorador del cosmos" — desbloqueada al estudiar ${studyParams.topic}.` : `"Cosmos explorer" — unlocked for studying ${studyParams.topic}.`}</div>
                </div>
              </div>
            )}

            {/* review */}
            <div style={{ marginTop: 24 }}>
              <div className="qk-label" style={{ marginBottom: 10 }}>{t('review')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cards.map((c, idx) => {
                  const right = picks[idx] === c.a;
                  return (
                    <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 12 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: right ? 'var(--primary)' : 'var(--coral)', color: '#fff', display: 'grid', placeItems: 'center' }}>{right ? ICONS.check : ICONS.x}</div>
                      <div style={{ flex: 1, fontSize: 14 }}>
                        <div style={{ fontWeight: 700 }}>{c.q}</div>
                        <div style={{ marginTop: 2, color: 'var(--ink-3)', fontSize: 13 }}>
                          {lang === 'es' ? 'Respuesta:' : 'Answer:'} <strong style={{ color: 'var(--ink-2)' }}>{c.choices[c.a]}</strong>
                          {!right && picks[idx] != null && <> · {lang === 'es' ? 'Elegiste:' : 'You chose:'} <span style={{ color: 'var(--coral)' }}>{c.choices[picks[idx]]}</span></>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: 24, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', position: 'relative' }}>
              <Btn kind="ghost" icon={ICONS.shuffle} onClick={() => { setQuizResult(null); router.push('/kids/quiz'); }}>{t('again')}</Btn>
              <Btn kind="primary" onClick={() => { setQuizResult(null); router.push('/kids/home'); }}>{t('backHome')}</Btn>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
