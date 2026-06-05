'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Ico, ICONS } from '@/components/ui/Icons';
import { Avatar } from '@/components/ui/Avatar';
import { Btn } from '@/components/ui/Btn';
import { PricingCards } from '@/components/ui/PricingCards';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';

export default function LandingClient() {
  const { lang, setLang, kids, setActiveKidId, setMode } = useStore();
  const t = useT(lang);
  const router = useRouter();
  const [pricingCycle, setPricingCycle] = React.useState('monthly');

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const goDemo = (kidId?: string) => {
    if (kidId) setActiveKidId(kidId);
    else if (kids[0]) setActiveKidId(kids[0].id);
    setMode('parent');
    router.push('/dashboard');
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'radial-gradient(900px 600px at 110% -10%, var(--honey-l), transparent 60%), radial-gradient(800px 500px at -10% 110%, var(--primary-l), transparent 55%), var(--bg)' }}>
      {/* NAV */}
      <header className="qk-chrome" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
        <Link href="/" className="qk-brand">
          <span className="qk-brand-mark"><Ico d={<path d="M11 20A7 7 0 014 13V6h7a7 7 0 010 14z" />} size={18} stroke={2} /></span>
          QuizKids
        </Link>
        <div className="qk-chrome-right">
          <nav style={{ display: 'flex', gap: 18, fontSize: 14, fontWeight: 600, color: 'var(--ink-2)' }}>
            {[['how', t('navHow')], ['what', t('navWhat')], ['subjects', t('navSubjects')], ['parents', t('navParents')], ['pricing', t('pricingEyebrow')]].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} style={{ appearance: 'none', border: 0, background: 'transparent', color: 'inherit', padding: 0, cursor: 'pointer', fontWeight: 'inherit', fontFamily: 'var(--font-display)' }}>{label}</button>
            ))}
          </nav>
          <Link href="/auth?tab=signin" className="qk-btn qk-btn-ghost" style={{ padding: '8px 14px', fontSize: 14 }}>{t('navSignIn')}</Link>
          <Link href="/auth" className="qk-btn qk-btn-primary" style={{ padding: '8px 14px', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {ICONS.plus}<span>{t('addKid')}</span>
          </Link>
          <div className="qk-lang">
            <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
            <button className={lang === 'es' ? 'on' : ''} onClick={() => setLang('es')}>ES</button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="qk-page-enter" style={{ padding: '56px clamp(20px, 5vw, 56px) 72px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 48, alignItems: 'center' }} className="qk-hero-grid">
          <div>
            <span className="qk-eyebrow"><Ico d={<path d="M11 20A7 7 0 014 13V6h7a7 7 0 010 14z" />} size={14} stroke={2} /> {t('heroBadge')}</span>
            <h1 className="qk-h1" style={{ marginTop: 14 }}>
              {lang === 'es' ? (<>Un rinconcito <span className="qk-underline">amigable</span> para estudiar.</>)
                : (<>A cozy place for kids to <span className="qk-underline">love learning</span>.</>)}
            </h1>
            <p className="qk-sub">{t('welcomeSub')}</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
              <Link href="/auth" className="qk-btn qk-btn-primary">{ICONS.plus}<span>{t('addKid')}</span></Link>
              <button onClick={() => goDemo()} className="qk-btn qk-btn-ghost">{t('seeDemo')}</button>
            </div>
            <div style={{ marginTop: 32, display: 'flex', gap: 28, flexWrap: 'wrap' }}>
              {([[t('heroStat1'), t('heroStat1Lbl')], [t('heroStat2'), t('heroStat2Lbl')], [t('heroStat3'), t('heroStat3Lbl')]] as [string, string][]).map(([v, l], i) => (
                <div key={i} style={{ borderLeft: i > 0 ? '1px solid var(--line)' : 'none', paddingLeft: i > 0 ? 28 : 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 24, lineHeight: 1 }}>{v}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>{l}</div>
                </div>
              ))}
            </div>
            {kids.length > 0 && (
              <div style={{ marginTop: 32 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>{lang === 'es' ? 'Continuar como' : 'Continue as'}</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {kids.map((k) => (
                    <button key={k.id} onClick={() => goDemo(k.id)} className="qk-chip" style={{ padding: '6px 12px 6px 6px', gap: 10 }}>
                      <Avatar id={k.avatar} size={28} /><span>{k.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* hero card composition */}
          <div style={{ position: 'relative', aspectRatio: '5/4' }}>
            <div className="qk-blob" style={{ position: 'absolute', inset: '4% 6% 6% 8%' }} />
            <div className="qk-card" style={{ position: 'absolute', left: '14%', top: '10%', width: '70%', transform: 'rotate(-3deg)', padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar id="fox" size={42} />
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>Mateo · Grade 3</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Science · Solar System</div>
                </div>
              </div>
              <div style={{ marginTop: 14, padding: '14px 16px', background: 'var(--primary-l)', borderRadius: 14, fontFamily: 'var(--font-display)', fontWeight: 500 }}>Which planet is closest to the Sun?</div>
              <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {['Mercury', 'Venus', 'Earth', 'Mars'].map((o, i) => (
                  <div key={o} style={{ padding: '10px 12px', borderRadius: 12, border: '1.5px solid ' + (i === 0 ? 'var(--primary)' : 'var(--line)'), background: i === 0 ? 'var(--primary-l)' : 'var(--surface)', fontSize: 14, fontWeight: 600 }}>{o}</div>
                ))}
              </div>
            </div>
            <div className="qk-sticker" style={{ position: 'absolute', right: '4%', top: '4%', fontSize: 14 }}>+ 5 ⭐</div>
            <div className="qk-card" style={{ position: 'absolute', left: '4%', bottom: '4%', width: '45%', transform: 'rotate(4deg)', padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--coral-l)', color: 'var(--coral)', display: 'grid', placeItems: 'center' }}>{ICONS.flame}</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>7 day streak</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Keep it up, Mateo!</div>
                </div>
              </div>
            </div>
            <div style={{ position: 'absolute', right: '2%', bottom: '14%', width: 88, height: 88, borderRadius: '50%', background: 'var(--surface)', border: '6px solid var(--surface)', boxShadow: 'var(--shadow)' }}>
              <Avatar id="sprout" size={76} />
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ padding: '56px clamp(20px, 5vw, 56px)', background: 'var(--surface-2)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 620, margin: '0 auto' }}>
            <span className="qk-eyebrow">01 · 02 · 03</span>
            <h2 className="qk-h1" style={{ fontSize: 'clamp(26px, 3vw, 36px)', marginTop: 10 }}>{t('howTitle')}</h2>
            <p className="qk-sub" style={{ margin: '10px auto 0' }}>{t('howSub')}</p>
          </div>
          <div className="qk-stagger" style={{ marginTop: 40, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
            {[
              { tone: 'primary', icon: ICONS.pencil, title: t('how1Title'), body: t('how1Body'), n: '1' },
              { tone: 'sky', icon: ICONS.book, title: t('how2Title'), body: t('how2Body'), n: '2' },
              { tone: 'honey', icon: ICONS.spark, title: t('how3Title'), body: t('how3Body'), n: '3' },
            ].map((s, idx) => {
              const bg = `var(--${s.tone === 'primary' ? 'primary-l' : s.tone + '-l'})`;
              const fg = `var(--${s.tone === 'primary' ? 'primary' : s.tone})`;
              return (
                <div key={idx} className="qk-card" style={{ padding: 24, position: 'relative' }}>
                  <div style={{ position: 'absolute', top: -16, left: 24, width: 36, height: 36, borderRadius: 12, background: 'var(--ink)', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, transform: 'rotate(-4deg)', boxShadow: 'var(--shadow-sm)' }}>{s.n}</div>
                  <div style={{ width: 56, height: 56, borderRadius: 18, background: bg, color: fg, display: 'grid', placeItems: 'center', marginTop: 8 }}>
                    {React.cloneElement(s.icon as React.ReactElement<{ size?: number }>, { size: 26 })}
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22, margin: '16px 0 6px' }}>{s.title}</h3>
                  <p style={{ margin: 0, fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.55 }}>{s.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section id="what" style={{ padding: '72px clamp(20px, 5vw, 56px)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'end' }} className="qk-hero-grid">
            <div>
              <span className="qk-eyebrow">3-in-1</span>
              <h2 className="qk-h1" style={{ fontSize: 'clamp(26px, 3vw, 36px)', marginTop: 10 }}>{t('whatTitle')}</h2>
              <p className="qk-sub">{t('whatSub')}</p>
            </div>
          </div>
          <div className="qk-stagger" style={{ marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
            {[
              { tone: 'primary', icon: ICONS.cards, title: t('whatQuiz'), body: t('whatQuizSub') },
              { tone: 'sky', icon: ICONS.book, title: t('whatGuide'), body: t('whatGuideSub') },
              { tone: 'coral', icon: ICONS.printer, title: t('whatPdf'), body: t('whatPdfSub') },
            ].map((s, idx) => {
              const bg = `var(--${s.tone === 'primary' ? 'primary-l' : s.tone + '-l'})`;
              const fg = `var(--${s.tone === 'primary' ? 'primary' : s.tone})`;
              return (
                <div key={idx} className="qk-card qk-card-interactive" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ height: 160, background: bg, color: fg, display: 'grid', placeItems: 'center', position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, opacity: .2, backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
                    <div style={{ position: 'relative', transform: 'scale(2.4)' }}>{s.icon}</div>
                  </div>
                  <div style={{ padding: '20px 22px 22px' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22, margin: '0 0 6px' }}>{s.title}</h3>
                    <p style={{ margin: 0, fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.55 }}>{s.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SUBJECTS */}
      <section id="subjects" style={{ padding: '72px clamp(20px, 5vw, 56px)', background: 'var(--surface-2)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 660, margin: '0 auto' }}>
            <span className="qk-eyebrow">K-12</span>
            <h2 className="qk-h1" style={{ fontSize: 'clamp(26px, 3vw, 36px)', marginTop: 10 }}>{t('subjectsTitle')}</h2>
            <p className="qk-sub" style={{ margin: '10px auto 0' }}>{t('subjectsSub')}</p>
          </div>
          <div className="qk-stagger" style={{ marginTop: 36, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { range: 'K-2', tone: 'honey', body: t('subjectK2'), avatar: 'bee' },
              { range: '3-5', tone: 'primary', body: t('subject35'), avatar: 'sprout' },
              { range: '6-8', tone: 'sky', body: t('subject68'), avatar: 'owl' },
              { range: '9-12', tone: 'berry', body: t('subject912'), avatar: 'fox' },
            ].map((g, idx) => {
              const bg = `var(--${g.tone === 'primary' ? 'primary-l' : g.tone + '-l'})`;
              const fg = `var(--${g.tone === 'primary' ? 'primary-d' : g.tone})`;
              return (
                <div key={idx} className="qk-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 999, background: bg, color: fg, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>{g.range}</span>
                    <Avatar id={g.avatar} size={40} />
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5 }}>{g.body}</p>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 32, display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {[{ id: 'sci', icon: '🔬', live: true }, { id: 'math', icon: '➗', live: false }, { id: 'lang', icon: '📖', live: false }, { id: 'soc', icon: '🌎', live: false }, { id: 'art', icon: '🎨', live: false }].map((s) => (
              <div key={s.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 999, background: 'var(--surface)', border: '1.5px solid var(--line)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>
                <span style={{ fontSize: 18 }}>{s.icon}</span>
                <span>{t(s.id)}</span>
                <span style={{ padding: '2px 8px', borderRadius: 999, background: s.live ? 'var(--primary)' : 'var(--surface-2)', color: s.live ? '#fff' : 'var(--ink-3)', fontSize: 11, fontWeight: 700, letterSpacing: '.04em' }}>{s.live ? (lang === 'es' ? 'LISTO' : 'LIVE') : (lang === 'es' ? 'PRONTO' : 'SOON')}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOR PARENTS */}
      <section id="parents" style={{ padding: '72px clamp(20px, 5vw, 56px)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }} className="qk-hero-grid">
          <div style={{ position: 'relative', aspectRatio: '5/4' }}>
            <div className="qk-blob" style={{ position: 'absolute', inset: '6% 8% 8% 4%', background: 'radial-gradient(120% 120% at 30% 20%, var(--honey-l), var(--bg-2))' }} />
            <div className="qk-card" style={{ position: 'absolute', inset: '8% 6%', padding: 20, transform: 'rotate(-2deg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="qk-eyebrow">{lang === 'es' ? 'Esta semana' : 'This week'}</span>
                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>2 kids</span>
              </div>
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[{ name: 'Mateo', avatar: 'fox', streak: 7, pct: 62 }, { name: 'Lucía', avatar: 'sprout', streak: 3, pct: 35 }].map((k, i) => (
                  <div key={i} style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar id={k.avatar} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>{k.name}</div>
                      <div className="qk-progress" style={{ marginTop: 6, height: 6 }}><span style={{ width: k.pct + '%' }} /></div>
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--coral)', fontWeight: 700, fontSize: 13 }}>
                      {React.cloneElement(ICONS.flame as React.ReactElement<{ size?: number }>, { size: 14 })}{k.streak}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="qk-sticker" style={{ position: 'absolute', right: '-2%', top: '6%', background: 'var(--primary)' }}>{lang === 'es' ? 'Sin anuncios' : 'Ad-free'}</div>
          </div>
          <div>
            <span className="qk-eyebrow">{lang === 'es' ? 'Para familias' : 'For parents'}</span>
            <h2 className="qk-h1" style={{ fontSize: 'clamp(26px, 3vw, 36px)', marginTop: 10 }}>{t('parentsTitle')}</h2>
            <div className="qk-stagger" style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              {[
                { icon: ICONS.shuffle, title: t('parents1'), body: t('parents1Sub'), tone: 'sky' },
                { icon: ICONS.leaf, title: t('parents2'), body: t('parents2Sub'), tone: 'primary' },
                { icon: ICONS.pencil, title: t('parents3'), body: t('parents3Sub'), tone: 'honey' },
                { icon: ICONS.star, title: t('parents4'), body: t('parents4Sub'), tone: 'coral' },
              ].map((p, idx) => {
                const bg = `var(--${p.tone === 'primary' ? 'primary-l' : p.tone + '-l'})`;
                const fg = `var(--${p.tone === 'primary' ? 'primary' : p.tone})`;
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, color: fg, display: 'grid', placeItems: 'center' }}>
                      {React.cloneElement(p.icon as React.ReactElement<{ size?: number }>, { size: 20 })}
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17 }}>{p.title}</div>
                    <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5 }}>{p.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: '72px clamp(20px, 5vw, 56px)', background: 'var(--surface-2)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 620, margin: '0 auto' }}>
            <span className="qk-eyebrow">{t('pricingEyebrow')}</span>
            <h2 className="qk-h1" style={{ fontSize: 'clamp(26px, 3vw, 36px)', marginTop: 10 }}>{t('pricingTitle')}</h2>
            <p className="qk-sub" style={{ margin: '10px auto 0' }}>{t('pricingSub')}</p>
          </div>
          <div style={{ marginTop: 36 }}>
            <PricingCards lang={lang} cycle={pricingCycle} setCycle={setPricingCycle} currentPlanId={null} onSelect={() => router.push('/auth')} />
          </div>
          <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--ink-3)' }}>{lang === 'es' ? 'Sin compromisos. Cancela cuando quieras.' : 'No commitments. Cancel anytime.'}</p>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '32px clamp(20px, 5vw, 56px) 72px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div className="qk-card" style={{ padding: 'clamp(28px, 5vw, 48px)', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-d) 100%)', color: '#fff', borderColor: 'var(--primary-d)', position: 'relative', overflow: 'hidden' }}>
            <div aria-hidden style={{ position: 'absolute', inset: 0, opacity: .18, backgroundImage: 'radial-gradient(rgba(255,255,255,.6) 1.5px, transparent 1.5px)', backgroundSize: '22px 22px' }} />
            <div style={{ position: 'absolute', right: '-3%', top: '-10%', opacity: .9, transform: 'rotate(8deg)' }}><Avatar id="bee" size={120} /></div>
            <div style={{ position: 'absolute', right: '22%', bottom: '-18%', opacity: .85, transform: 'rotate(-6deg)' }}><Avatar id="frog" size={90} /></div>
            <div style={{ position: 'relative', maxWidth: 600 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,.18)', color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '.04em' }}>★ {lang === 'es' ? 'Empieza gratis' : 'Start free'}</span>
              <h2 className="qk-h1" style={{ fontSize: 'clamp(26px, 3vw, 38px)', marginTop: 14, color: '#fff' }}>{t('ctaTitle')}</h2>
              <p style={{ margin: '12px 0 0', fontSize: 17, lineHeight: 1.5, color: 'rgba(255,255,255,.88)', maxWidth: 520 }}>{t('ctaSub')}</p>
              <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link href="/auth" className="qk-btn" style={{ background: '#fff', color: 'var(--primary-d)', boxShadow: '0 3px 0 rgba(0,0,0,.18)' }}>{ICONS.plus}<span>{t('ctaPrimary')}</span></Link>
                <button onClick={() => goDemo()} className="qk-btn" style={{ background: 'rgba(255,255,255,.14)', color: '#fff', border: '1px solid rgba(255,255,255,.3)' }}><span>{t('ctaSecondary')}</span></button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '40px clamp(20px, 5vw, 56px) 56px', borderTop: '1px solid var(--line)', background: 'var(--surface-2)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr', gap: 32 }} className="qk-footer-grid">
            <div>
              <div className="qk-brand" style={{ marginBottom: 10 }}>
                <span className="qk-brand-mark"><Ico d={<path d="M11 20A7 7 0 014 13V6h7a7 7 0 010 14z" />} size={18} stroke={2} /></span>
                QuizKids
              </div>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-2)', maxWidth: 280, lineHeight: 1.5 }}>{t('footerTagline')}</p>
            </div>
            {[
              { h: t('footerProduct'), links: [t('navHow'), t('navWhat'), t('navSubjects')] },
              { h: t('footerCompany'), links: [lang === 'es' ? 'Nosotros' : 'About', 'Blog', lang === 'es' ? 'Equipo' : 'Team'] },
              { h: t('footerHelp'), links: [lang === 'es' ? 'Ayuda' : 'Help center', lang === 'es' ? 'Contacto' : 'Contact'] },
              { h: t('footerLegal'), links: [lang === 'es' ? 'Privacidad' : 'Privacy', lang === 'es' ? 'Términos' : 'Terms', 'COPPA'] },
            ].map((col, idx) => (
              <div key={idx}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 12 }}>{col.h}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {col.links.map((l, i) => <li key={i} style={{ fontSize: 14, color: 'var(--ink-2)' }}>{l}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 32, paddingTop: 18, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{t('footerCopy')}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />
              {lang === 'es' ? 'Todos los sistemas operativos' : 'All systems normal'}
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 880px) {
          .qk-hero-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
          .qk-how-grid, .qk-stagger { grid-template-columns: 1fr !important; }
          .qk-footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 600px) {
          .qk-hero-grid > div:last-child { display: none; }
        }
      `}</style>
    </div>
  );
}
