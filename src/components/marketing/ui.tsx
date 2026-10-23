import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Ico, ICONS } from '@/components/ui/Icons';
import { Avatar } from '@/components/ui/Avatar';
import { COMMON } from '@/content/common';
import { localePath, type Locale } from '@/lib/site';
import { DemoButton } from './DemoButton';

/** Small building blocks shared by the marketing pages. Server components unless noted. */

const LEAF = <path d="M11 20A7 7 0 014 13V6h7a7 7 0 010 14z" />;

export const MK_ICONS: Record<string, React.ReactElement<{ size?: number }>> = {
  ...ICONS,
  lock: <Ico d={<g><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></g>} />,
  device: <Ico d={<g><rect x="3" y="4" width="13" height="10" rx="1.5" /><path d="M7 18h5" /><rect x="17" y="8" width="5" height="11" rx="1.2" /></g>} />,
  users: <Ico d={<g><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 3-5.5 6.5-5.5s6.5 1.9 6.5 5.5" /><circle cx="17.5" cy="9" r="2.5" /><path d="M16.5 14.6c3 .2 5 1.9 5 4.9" /></g>} />,
  globe: <Ico d={<g><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" /></g>} />,
  arrow: <Ico d={<path d="M5 12h14M13 6l6 6-6 6" />} />,
  menu: <Ico d={<path d="M4 7h16M4 12h16M4 17h16" />} />,
  mail: <Ico d={<g><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></g>} />,
};

export function icon(name: string, size = 20) {
  const el = MK_ICONS[name] || MK_ICONS.star;
  return React.cloneElement(el, { size });
}

/** Light tint + strong color for a palette tone ('primary' | 'honey' | 'sky' | 'coral' | 'berry') */
export function tone(t: string) {
  return t === 'primary'
    ? { bg: 'var(--primary-l)', fg: 'var(--primary-d)' }
    : { bg: `var(--${t}-l)`, fg: `var(--${t})` };
}

export function Brand({ locale }: { locale: Locale }) {
  return (
    <Link href={localePath(locale, '/')} className="qk-brand" aria-label="QuizKids">
      <span className="qk-brand-mark"><Ico d={LEAF} size={18} stroke={2} /></span>
      <span className="qk-brand-name">QuizKids</span>
    </Link>
  );
}

export function LeafIcon({ size = 14 }: { size?: number }) {
  return <Ico d={LEAF} size={size} stroke={2} />;
}

export function SectionHead({ eyebrow, title, sub, as = 'h2', align = 'center' }: { eyebrow?: string; title: React.ReactNode; sub?: string; as?: 'h1' | 'h2'; align?: 'center' | 'left' }) {
  const H = as;
  return (
    <div className={align === 'center' ? 'mk-head' : undefined}>
      {eyebrow && <span className="qk-eyebrow">{eyebrow}</span>}
      <H className="qk-h1 mk-h2">{title}</H>
      {sub && <p className="qk-sub">{sub}</p>}
    </div>
  );
}

export function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="mk-bullets">
      {items.map((b) => (
        <li key={b}>
          <span className="mk-check" aria-hidden><Ico d={<path d="M5 12l5 5L20 7" />} size={13} stroke={2.4} /></span>
          <span>{b}</span>
        </li>
      ))}
    </ul>
  );
}

export type ShotName = 'quiz' | 'guide' | 'worksheet' | 'dashboard' | 'kidhome';

/** A real app screenshot (public/images/app/<name>-<locale>.webp, captured at 1280×800 @2x) in a browser frame */
export function Screenshot({ name, locale, alt, priority, tilt }: { name: ShotName; locale: Locale; alt: string; priority?: boolean; tilt?: boolean }) {
  return (
    <figure className={`mk-shot${tilt ? ' mk-shot-tilt' : ''}`}>
      <div className="mk-shot-bar" aria-hidden><span /><span /><span /></div>
      <Image src={`/images/app/${name}-${locale}.webp`} alt={alt} width={2560} height={1600} sizes="(max-width: 880px) 100vw, 640px" priority={priority} />
    </figure>
  );
}

export function PageHero({ locale, eyebrow, title, sub, crumb, children }: { locale: Locale; eyebrow: string; title: string; sub?: string; crumb: string; children?: React.ReactNode }) {
  return (
    <section className="mk-page-hero">
      <div className="mk-container">
        <nav className="mk-crumbs" aria-label="Breadcrumb">
          <Link href={localePath(locale, '/')}>{COMMON[locale].home}</Link>
          <span aria-hidden>/</span>
          <span aria-current="page">{crumb}</span>
        </nav>
        <span className="qk-eyebrow">{eyebrow}</span>
        <h1 className="qk-h1">{title}</h1>
        {sub && <p className="mk-lead">{sub}</p>}
        {children}
      </div>
    </section>
  );
}

export function CtaBand({ locale }: { locale: Locale }) {
  const c = COMMON[locale].cta;
  return (
    <section className="mk-section-tight" style={{ paddingBottom: 88 }}>
      <div className="mk-container">
        <div className="mk-cta">
          <div className="mk-cta-dots" aria-hidden />
          <div aria-hidden style={{ position: 'absolute', right: '-2%', top: '-12%', transform: 'rotate(8deg)' }} className="qk-hide-sm">
            <Avatar id="bee" size={130} />
          </div>
          <div aria-hidden style={{ position: 'absolute', right: '20%', bottom: '-20%', transform: 'rotate(-6deg)' }} className="qk-hide-sm">
            <Avatar id="frog" size={96} />
          </div>
          <div style={{ position: 'relative', maxWidth: 620 }}>
            <span className="mk-cta-badge">★ {c.badge}</span>
            <h2 className="qk-h1">{c.title}</h2>
            <p>{c.body}</p>
            <div className="mk-ctas">
              <Link href="/auth" className="qk-btn mk-btn-light">{c.primary}</Link>
              <DemoButton locale={locale} className="qk-btn mk-btn-clear">{c.secondary}</DemoButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Server-rendered FAQ accordion: answers are in the HTML even while collapsed, so they get indexed */
export function FaqList({ items }: { items: { id: string; q: string; a: string }[] }) {
  return (
    <div className="mk-faq">
      {items.map((f) => (
        <details key={f.id} id={f.id}>
          <summary>{f.q}</summary>
          <p>{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}
