import React from 'react';
import type { MedalId } from '@/lib/levels';

/** Ribbon + metal + symbol for each medal. Colors: [rim, face, ribbon] */
const LOOK: Record<MedalId, { rim: string; face: string; ribbon: string; symbol: React.ReactNode }> = {
  seed: {
    rim: '#4E8B5F', face: '#BFE3C8', ribbon: '#3F7A4F',
    symbol: <g fill="#2F6B40"><path d="M32 46V32" stroke="#2F6B40" strokeWidth="3" strokeLinecap="round" /><path d="M32 34c-8 0-12-5-12-11 8 0 12 4 12 11z" /><path d="M32 30c0-7 4-11 12-11 0 7-4 11-12 11z" /></g>,
  },
  rocket: {
    rim: '#D9792B', face: '#FFD9B0', ribbon: '#E26D5A',
    symbol: <g><path d="M32 16c6 5 8 13 6 22H26c-2-9 0-17 6-22z" fill="#fff" stroke="#B45309" strokeWidth="2" strokeLinejoin="round" /><circle cx="32" cy="28" r="3.5" fill="#6BA8C9" stroke="#B45309" strokeWidth="1.5" /><path d="M26 34l-6 8 8-2zM38 34l6 8-8-2z" fill="#E26D5A" /><path d="M29 40c0 4 1.5 7 3 9 1.5-2 3-5 3-9z" fill="#F5B83A" /></g>,
  },
  bolt: {
    rim: '#C99410', face: '#FFF0A8', ribbon: '#E29A2B',
    symbol: <path d="M36 14L22 35h9l-3 15 15-23h-9z" fill="#F5B83A" stroke="#A16207" strokeWidth="2.5" strokeLinejoin="round" />,
  },
  shield: {
    rim: '#3F6FA0', face: '#CFE6F5', ribbon: '#6BA8C9',
    symbol: <g><path d="M32 15l13 5v10c0 9-5 15-13 19-8-4-13-10-13-19V20z" fill="#6BA8C9" stroke="#2F5A85" strokeWidth="2.5" strokeLinejoin="round" /><path d="M26 31l4.5 4.5L39 26" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" /></g>,
  },
  compass: {
    rim: '#2F8F83', face: '#C9F0E9', ribbon: '#3F7A4F',
    symbol: <g><circle cx="32" cy="32" r="15" fill="#fff" stroke="#2F8F83" strokeWidth="2.5" /><path d="M38.5 25.5L34 34l-8.5 4.5L30 30z" fill="#E26D5A" stroke="#B4402C" strokeWidth="1.5" strokeLinejoin="round" /><circle cx="32" cy="32" r="2" fill="#2F8F83" /></g>,
  },
  gem: {
    rim: '#9B4DB3', face: '#EBD3F5', ribbon: '#B766C9',
    symbol: <g stroke="#7A2F94" strokeWidth="2" strokeLinejoin="round"><path d="M22 26l5-8h10l5 8-10 20z" fill="#C98BDD" /><path d="M22 26h20M27 18l5 8 5-8M32 26v20" fill="none" /></g>,
  },
  crown: {
    rim: '#B8860B', face: '#FFE9A0', ribbon: '#C7392B',
    symbol: <g stroke="#8A5A00" strokeWidth="2" strokeLinejoin="round"><path d="M19 42l-2-18 10 8 5-12 5 12 10-8-2 18z" fill="#F5B83A" /><circle cx="32" cy="22" r="2.4" fill="#E26D5A" stroke="none" /><circle cx="17" cy="23" r="2" fill="#E26D5A" stroke="none" /><circle cx="47" cy="23" r="2" fill="#E26D5A" stroke="none" /></g>,
  },
  galaxy: {
    rim: '#3B3F8F', face: '#CBD0F7', ribbon: '#5B5FC7',
    symbol: <g><circle cx="32" cy="32" r="16" fill="#2B2F6B" /><path d="M32 18l3 8 8 .6-6.2 5.2 2.2 8.2-7-4.6-7 4.6 2.2-8.2-6.2-5.2 8-.6z" fill="#FFE27A" /><circle cx="22" cy="40" r="1.2" fill="#fff" /><circle cx="43" cy="24" r="1.2" fill="#fff" /><circle cx="42" cy="42" r="1" fill="#fff" /></g>,
  },
  trophy: {
    rim: '#B8860B', face: '#FFEDB0', ribbon: '#E26D5A',
    symbol: <g stroke="#8A5A00" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"><path d="M24 17h16v10c0 6-4 10-8 10s-8-4-8-10z" fill="#F5B83A" /><path d="M24 20h-5c0 6 2 9 6 10M40 20h5c0 6-2 9-6 10" fill="none" /><path d="M32 37v6M26 47h12M28 43h8v4h-8z" fill="#F5B83A" /></g>,
  },
  sun: {
    rim: '#D9792B', face: '#FFE7B8', ribbon: '#C7392B',
    symbol: <g><circle cx="32" cy="32" r="9" fill="#F5B83A" stroke="#B45309" strokeWidth="2.5" />{Array.from({ length: 8 }).map((_, i) => { const a = (i * Math.PI) / 4; return <line key={i} x1={32 + Math.cos(a) * 13} y1={32 + Math.sin(a) * 13} x2={32 + Math.cos(a) * 19} y2={32 + Math.sin(a) * 19} stroke="#E29A2B" strokeWidth="3.5" strokeLinecap="round" />; })}<path d="M28 31h2M34 31h2M29 35c2 2 4 2 6 0" stroke="#B45309" strokeWidth="1.6" fill="none" strokeLinecap="round" /></g>,
  },
};

/** A round medal with a ribbon and its own symbol; locked ones are grey with a padlock */
export function Medal({ id, size = 64, locked = false, shine = false }: { id: MedalId; size?: number; locked?: boolean; shine?: boolean }) {
  const look = LOOK[id];
  const uid = React.useId().replace(/:/g, '');
  const rim = locked ? '#B7BDB8' : look.rim;
  const face = locked ? '#E6E9E6' : look.face;
  const ribbon = locked ? '#C9CEC9' : look.ribbon;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-hidden style={{ display: 'block', flexShrink: 0, filter: shine && !locked ? 'drop-shadow(0 0 8px rgba(245,184,58,.7))' : undefined }}>
      <defs>
        <radialGradient id={`g${uid}`} cx="35%" cy="30%" r="80%"><stop offset="0" stopColor="#fff" stopOpacity=".75" /><stop offset="1" stopColor={face} /></radialGradient>
      </defs>
      <path d="M20 2h10l6 20H26zM44 2H34l-6 20h10z" fill={ribbon} />
      <path d="M26 2h4l6 20h-4z" fill="#000" opacity=".12" />
      <circle cx="32" cy="38" r="25" fill={rim} />
      <circle cx="32" cy="38" r="21" fill={`url(#g${uid})`} stroke="#000" strokeOpacity=".08" strokeWidth="1" />
      <g transform="translate(0 6)" opacity={locked ? 0.28 : 1} style={locked ? { filter: 'grayscale(1)' } : undefined}>
        <g transform="translate(3.2 .2) scale(.9)">{look.symbol}</g>
      </g>
      {locked && (
        <g transform="translate(25 33)"><rect x="1" y="7" width="12" height="9" rx="2" fill="#8E958F" /><path d="M3.5 7V5a3.5 3.5 0 017 0v2" fill="none" stroke="#8E958F" strokeWidth="2" /></g>
      )}
    </svg>
  );
}
