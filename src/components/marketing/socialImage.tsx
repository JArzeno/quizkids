import { ImageResponse } from 'next/og';
import type { Locale } from '@/lib/site';

export const OG_SIZE = { width: 1200, height: 630 };

const COPY: Record<Locale, { title: string; sub: string; pills: string[] }> = {
  en: { title: 'Study what they learn at school, the cozy way.', sub: 'Quizzes, study guides and printable worksheets for K-12. English & Spanish.', pills: ['Flashcard quizzes', 'Study guides', 'Worksheets'] },
  es: { title: 'Repasa lo que ven en la escuela, con cariño.', sub: 'Quizzes, guías de estudio y hojas imprimibles de kínder a 12.º. Español e inglés.', pills: ['Quizzes', 'Guías de estudio', 'Hojas de trabajo'] },
};

/** Fredoka from Google Fonts when reachable; otherwise the default font, so a failed fetch never breaks the build */
async function loadFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Fredoka:wght@600&text=${encodeURIComponent(text)}`)).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

function Leaf({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <rect width="32" height="32" rx="8" fill="#3F7A4F" />
      <path d="M16 26A10 10 0 016 16V8h10a10 10 0 010 20z" fill="#FFFDF7" />
    </svg>
  );
}

export async function socialImage(locale: Locale) {
  const c = COPY[locale];
  const font = await loadFont('QuizKids' + c.title + c.sub + c.pills.join('') + 'K-12');
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px 72px', background: '#F4EFE3', backgroundImage: 'radial-gradient(circle at 100% 0%, #FCE7BD 0%, rgba(252,231,189,0) 45%), radial-gradient(circle at 0% 100%, #E1EFDB 0%, rgba(225,239,219,0) 50%)', fontFamily: font ? 'Fredoka' : undefined, color: '#1F3326' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <Leaf size={64} />
          <div style={{ fontSize: 44, fontWeight: 600 }}>QuizKids</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 66, lineHeight: 1.08, fontWeight: 600, maxWidth: 940 }}>{c.title}</div>
          <div style={{ fontSize: 30, color: '#4A5E50', maxWidth: 940 }}>{c.sub}</div>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          {c.pills.map((p) => (
            <div key={p} style={{ display: 'flex', padding: '12px 24px', borderRadius: 999, background: '#FFFDF7', border: '2px solid #D7CDB4', fontSize: 26 }}>{p}</div>
          ))}
          <div style={{ display: 'flex', padding: '12px 24px', borderRadius: 999, background: '#3F7A4F', color: '#FFFDF7', fontSize: 26 }}>K-12</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: font ? [{ name: 'Fredoka', data: font, weight: 600, style: 'normal' }] : undefined },
  );
}

export async function appleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#3F7A4F' }}>
        <svg width="112" height="112" viewBox="0 0 32 32">
          <path d="M16 28A12 12 0 014 16V6h12a12 12 0 010 22z" fill="#FFFDF7" />
        </svg>
      </div>
    ),
    { width: 180, height: 180 },
  );
}
