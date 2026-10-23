import React from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { HOME } from '@/content/home';
import type { Locale } from '@/lib/site';
import { icon } from './ui';

/** Illustrated product scenes built from the app's own design system. Decorative, so hidden from screen readers; the text around them carries the meaning. */

const display: React.CSSProperties = { fontFamily: 'var(--font-display)', fontWeight: 600 };
const small: React.CSSProperties = { fontSize: 12.5, color: 'var(--ink-3)' };

export function HeroArt({ locale }: { locale: Locale }) {
  const m = HOME[locale].hero.mock;
  return (
    <div className="mk-art" aria-hidden>
      <div className="qk-blob" style={{ position: 'absolute', inset: '4% 6% 6% 8%' }} />
      <div className="qk-card" style={{ position: 'absolute', left: '13%', top: '9%', width: '72%', transform: 'rotate(-3deg)', padding: 18 }}>
        <div className="mk-row">
          <Avatar id="fox" size={42} />
          <div>
            <div style={display}>{m.kid}</div>
            <div style={small}>{m.topic}</div>
          </div>
        </div>
        <div style={{ marginTop: 14, padding: '14px 16px', background: 'var(--primary-l)', borderRadius: 14, ...display, fontWeight: 500 }}>{m.question}</div>
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {m.options.map((o, i) => (
            <div key={o} style={{ padding: '10px 12px', borderRadius: 12, border: '1.5px solid ' + (i === 0 ? 'var(--primary)' : 'var(--line)'), background: i === 0 ? 'var(--primary-l)' : 'var(--surface)', fontSize: 14, fontWeight: 700 }}>
              {o}{i === 0 && ' ✓'}
            </div>
          ))}
        </div>
      </div>
      <div className="qk-sticker" style={{ position: 'absolute', right: '4%', top: '3%', fontSize: 14 }}>{m.stars}</div>
      <div className="qk-card" style={{ position: 'absolute', left: '3%', bottom: '5%', width: '46%', transform: 'rotate(4deg)', padding: 14 }}>
        <div className="mk-row" style={{ gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--coral-l)', color: 'var(--coral)', display: 'grid', placeItems: 'center' }}>{icon('flame', 18)}</div>
          <div>
            <div style={display}>{m.streak}</div>
            <div style={small}>{m.streakSub}</div>
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', right: '2%', bottom: '13%', width: 88, height: 88, borderRadius: '50%', background: 'var(--surface)', border: '6px solid var(--surface)', boxShadow: 'var(--shadow)' }}>
        <Avatar id="sprout" size={76} />
      </div>
    </div>
  );
}

export function SchoolMock({ locale }: { locale: Locale }) {
  const m = HOME[locale].school.mock;
  return (
    <div className="mk-mock" aria-hidden>
      <div className="mk-mock-bg" style={{ background: 'radial-gradient(120% 120% at 80% 0%, var(--sky-l), var(--bg-2))' }} />
      <div className="qk-card" style={{ padding: 20 }}>
        <div className="mk-row" style={{ justifyContent: 'space-between' }}>
          <div className="mk-row" style={{ gap: 10 }}>
            <GoogleClassroomMark />
            <div style={{ ...display, fontSize: 17 }}>{m.title}</div>
          </div>
        </div>
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {m.classes.map((c, i) => (
            <div key={c.name} style={{ padding: 14, borderRadius: 14, background: 'var(--surface-2)', border: '1px solid ' + (i === 0 ? 'var(--primary)' : 'var(--line)') }}>
              <div className="mk-row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <div style={{ ...display, fontSize: 15 }}>{c.name}</div>
                  <div style={small}>{c.teacher} · {c.topics.length} {m.found}</div>
                </div>
                <span style={{ width: 22, height: 22, borderRadius: 7, display: 'grid', placeItems: 'center', background: i === 0 ? 'var(--primary)' : 'var(--surface)', border: i === 0 ? 0 : '1.5px solid var(--line)', color: '#fff' }}>
                  {i === 0 && icon('check', 13)}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                {c.topics.map((t) => <span key={t} className="mk-pill" style={{ background: 'var(--surface)', fontSize: 12.5 }}>{t}</span>)}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
          <span className="qk-btn qk-btn-primary" style={{ padding: '9px 14px', fontSize: 14 }}>{icon('plus', 16)}{m.button}</span>
        </div>
      </div>
      <div className="qk-card" style={{ position: 'absolute', left: -6, bottom: -26, padding: 12, transform: 'rotate(-4deg)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 44, height: 54, borderRadius: 8, background: 'repeating-linear-gradient(var(--surface) 0 8px, var(--sky-l) 8px 9px)', border: '1px solid var(--line)' }} />
        <div>
          <div style={{ ...display, fontSize: 14 }}>📷 {m.photo}</div>
          <div style={small}>3 {m.found}</div>
        </div>
      </div>
    </div>
  );
}

function GoogleClassroomMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="2.5" fill="#1E8E3E" />
      <rect x="4.5" y="6.5" width="15" height="11" rx="1" fill="#34A853" />
      <circle cx="12" cy="10.5" r="1.8" fill="#fff" />
      <path d="M8.5 15.5c.4-1.6 1.8-2.5 3.5-2.5s3.1.9 3.5 2.5" fill="#fff" />
      <rect x="14" y="17.5" width="5" height="1.6" rx=".8" fill="#fff" />
    </svg>
  );
}

const KIND_ICON: Record<string, { icon: string; tone: string }> = {
  quiz: { icon: 'cards', tone: 'primary' },
  guide: { icon: 'book', tone: 'sky' },
  worksheet: { icon: 'printer', tone: 'coral' },
};

export function PlanMock({ locale }: { locale: Locale }) {
  const m = HOME[locale].plan.mock;
  return (
    <div className="mk-mock" aria-hidden>
      <div className="mk-mock-bg" style={{ background: 'radial-gradient(120% 120% at 20% 0%, var(--honey-l), var(--bg-2))' }} />
      <div className="qk-card" style={{ padding: 20 }}>
        <div className="mk-row" style={{ justifyContent: 'space-between' }}>
          <div className="mk-row" style={{ gap: 10 }}>
            <Avatar id="fox" size={36} />
            <div style={{ ...display, fontSize: 19 }}>{m.today}</div>
          </div>
          <span className="mk-pill">{m.done}</span>
        </div>
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {m.items.map((it) => {
            const k = KIND_ICON[it.kind];
            const bg = k.tone === 'primary' ? 'var(--primary-l)' : `var(--${k.tone}-l)`;
            const fg = k.tone === 'primary' ? 'var(--primary)' : `var(--${k.tone})`;
            return (
              <div key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, background: it.done ? 'var(--primary-l)' : 'var(--surface-2)', border: '1px solid var(--line)' }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: bg, color: fg, display: 'grid', placeItems: 'center', flex: 'none' }}>{icon(k.icon, 18)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...display, fontSize: 15, textDecoration: it.done ? 'line-through' : 'none', color: it.done ? 'var(--ink-2)' : 'var(--ink)' }}>{it.label}</div>
                  <div style={small}>{it.min}</div>
                </div>
                <span style={{ width: 24, height: 24, borderRadius: '50%', display: 'grid', placeItems: 'center', background: it.done ? 'var(--primary)' : 'var(--surface)', border: it.done ? 0 : '1.5px solid var(--line)', color: '#fff' }}>
                  {it.done && icon('check', 14)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="qk-card" style={{ position: 'absolute', right: -8, bottom: -30, width: '62%', padding: 14, transform: 'rotate(2.5deg)' }}>
        <div className="mk-row" style={{ justifyContent: 'space-between' }}>
          <div style={{ ...display, fontSize: 14 }}>🎯 {m.goal}</div>
          <span style={small}>{m.due}</span>
        </div>
        <div className="qk-progress" style={{ marginTop: 10, height: 8 }}><span style={{ width: '60%' }} /></div>
        <div style={{ ...small, marginTop: 6 }}>{m.goalSub}</div>
      </div>
    </div>
  );
}

const PLACEMENT: Record<Locale, { title: string; level: string; levelV: string; strong: string; strongV: string[]; weak: string; weakV: string[]; subject: string }> = {
  en: { title: 'All set!', subject: '➗ Math', level: 'Working at', levelV: 'Grade 4', strong: 'Strong at', strongV: ['Multiplication', 'Place value'], weak: 'Needs practice', weakV: ['Fractions'] },
  es: { title: '¡Listo!', subject: '➗ Matemáticas', level: 'Nivel actual', levelV: '4.º grado', strong: 'Fuerte en', strongV: ['Multiplicación', 'Valor posicional'], weak: 'Necesita práctica', weakV: ['Fracciones'] },
};

export function PlacementMock({ locale }: { locale: Locale }) {
  const m = PLACEMENT[locale];
  return (
    <div className="mk-mock" aria-hidden>
      <div className="mk-mock-bg" />
      <div className="qk-card" style={{ padding: 22, maxWidth: 440, margin: '0 auto' }}>
        <div className="mk-row" style={{ justifyContent: 'space-between' }}>
          <span className="mk-pill">{m.subject}</span>
          <span className="qk-sticker">{m.title} ⭐</span>
        </div>
        <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar id="owl" size={56} />
          <div>
            <div style={small}>{m.level}</div>
            <div style={{ ...display, fontSize: 28, lineHeight: 1.1 }}>{m.levelV}</div>
          </div>
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 4 }}>
          {[1, 1, 1, 1, 1, 1, 0, 1, 0].map((ok, i) => (
            <span key={i} style={{ flex: 1, height: 8, borderRadius: 4, background: ok ? 'var(--primary)' : 'var(--coral-l)' }} />
          ))}
        </div>
        <div className="mk-grid mk-grid-2" style={{ marginTop: 16, gap: 10 }}>
          <div style={{ padding: 12, borderRadius: 14, background: 'var(--primary-l)' }}>
            <div style={{ ...small, color: 'var(--primary-d)', fontWeight: 700 }}>💪 {m.strong}</div>
            {m.strongV.map((s) => <div key={s} style={{ ...display, fontSize: 14, marginTop: 4 }}>{s}</div>)}
          </div>
          <div style={{ padding: 12, borderRadius: 14, background: 'var(--honey-l)' }}>
            <div style={{ ...small, color: '#7C5410', fontWeight: 700 }}>🎯 {m.weak}</div>
            {m.weakV.map((s) => <div key={s} style={{ ...display, fontSize: 14, marginTop: 4 }}>{s}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

const TEST: Record<Locale, { title: string; date: string; topicsLabel: string; topics: { t: string; on: boolean; used?: boolean }[]; used: string; ready: string; guide: string; quiz: string }> = {
  en: {
    title: 'Science unit test', date: 'Friday, Nov 7', topicsLabel: 'Topics on the test',
    topics: [{ t: 'Magnets', on: true }, { t: 'Forces and motion', on: true }, { t: 'Simple machines', on: true }, { t: 'States of matter', on: false, used: true }],
    used: 'used in last test', ready: 'Review ready', guide: 'Review guide · 3 topics', quiz: 'Practice quiz · 12 cards',
  },
  es: {
    title: 'Examen de Ciencia', date: 'Viernes 7 de nov', topicsLabel: 'Temas del examen',
    topics: [{ t: 'Imanes', on: true }, { t: 'Fuerza y movimiento', on: true }, { t: 'Máquinas simples', on: true }, { t: 'Estados de la materia', on: false, used: true }],
    used: 'usado en el examen anterior', ready: 'Repaso listo', guide: 'Guía de repaso · 3 temas', quiz: 'Quiz de práctica · 12 tarjetas',
  },
};

export function TestMock({ locale }: { locale: Locale }) {
  const m = TEST[locale];
  return (
    <div className="mk-mock" aria-hidden>
      <div className="mk-mock-bg" style={{ background: 'radial-gradient(120% 120% at 80% 100%, var(--berry-l), var(--bg-2))' }} />
      <div className="qk-card" style={{ padding: 22 }}>
        <div className="mk-row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ ...display, fontSize: 19 }}>📝 {m.title}</div>
          <span className="mk-pill">📅 {m.date}</span>
        </div>
        <div style={{ ...small, marginTop: 16, fontWeight: 700 }}>{m.topicsLabel}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {m.topics.map((t) => (
            <span key={t.t} className={`qk-chip${t.on ? ' on' : ''}`} style={{ cursor: 'default', opacity: t.used ? 0.6 : 1 }}>
              {t.on && icon('check', 14)}{t.t}{t.used && <span style={{ fontWeight: 600, fontSize: 11.5 }}>· {m.used}</span>}
            </span>
          ))}
        </div>
        <div style={{ marginTop: 18, padding: 14, borderRadius: 14, background: 'var(--primary-l)' }}>
          <div style={{ ...display, fontSize: 14, color: 'var(--primary-d)' }}>✓ {m.ready}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, fontSize: 14, fontWeight: 700 }}>
            <span className="mk-row" style={{ gap: 8 }}>{icon('book', 16)}{m.guide}</span>
            <span className="mk-row" style={{ gap: 8 }}>{icon('cards', 16)}{m.quiz}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
