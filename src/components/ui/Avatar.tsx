import React from 'react';

export const AVATARS = [
  { id: 'sprout', bg: '#A7D7A8', accent: '#3F7A4F', acc: 'leaf',    name: 'Sprout'   },
  { id: 'acorn',  bg: '#E6C089', accent: '#7C4A20', acc: 'cap',     name: 'Acorn'    },
  { id: 'bee',    bg: '#F4D24A', accent: '#3E2B0E', acc: 'stripes', name: 'Bee'      },
  { id: 'fox',    bg: '#E89066', accent: '#7E2E13', acc: 'fox',     name: 'Fox'      },
  { id: 'bear',   bg: '#C99775', accent: '#4A2C1B', acc: 'bear',    name: 'Bear'     },
  { id: 'owl',    bg: '#9FB8C7', accent: '#2E4654', acc: 'owl',     name: 'Owl'      },
  { id: 'frog',   bg: '#9BCB66', accent: '#3D6B2E', acc: 'frog',    name: 'Frog'     },
  { id: 'mush',   bg: '#E07A8A', accent: '#FFFFFF', acc: 'dots',    name: 'Mushroom' },
];

interface AvatarProps { id?: string; size?: number; ring?: string; }

export function Avatar({ id = 'sprout', size = 72, ring }: AvatarProps) {
  const a = AVATARS.find((x) => x.id === id) || AVATARS[0];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block', overflow: 'visible' }}>
      {ring && <circle cx="50" cy="50" r="49" fill="none" stroke={ring} strokeWidth="3" />}
      <circle cx="50" cy="50" r="44" fill={a.bg} />
      {a.acc === 'leaf' && <path d="M50 5 q-6 8 -2 16 q6 -4 4 -16 z" fill={a.accent} />}
      {a.acc === 'cap' && <path d="M22 38 q28 -22 56 0 q-2 6 -28 6 q-26 0 -28 -6 z" fill={a.accent} />}
      {a.acc === 'stripes' && (
        <g fill={a.accent} opacity=".85">
          <rect x="20" y="56" width="60" height="6" rx="3" />
          <rect x="22" y="68" width="56" height="6" rx="3" />
        </g>
      )}
      {a.acc === 'fox' && (
        <g fill={a.accent}>
          <path d="M22 22 l8 18 -16 -4 z" />
          <path d="M78 22 l-8 18 16 -4 z" />
          <path d="M30 64 q20 14 40 0 q-6 14 -20 14 q-14 0 -20 -14 z" fill="#FFFFFF" opacity=".5" />
        </g>
      )}
      {a.acc === 'bear' && (
        <g fill={a.accent}>
          <circle cx="24" cy="24" r="9" />
          <circle cx="76" cy="24" r="9" />
        </g>
      )}
      {a.acc === 'owl' && (
        <g>
          <circle cx="36" cy="48" r="14" fill="#FFFDF7" />
          <circle cx="64" cy="48" r="14" fill="#FFFDF7" />
          <circle cx="36" cy="48" r="6" fill={a.accent} />
          <circle cx="64" cy="48" r="6" fill={a.accent} />
          <path d="M44 60 l6 6 6 -6 z" fill="#E29A2B" />
        </g>
      )}
      {a.acc === 'frog' && (
        <g>
          <circle cx="32" cy="30" r="10" fill={a.bg} />
          <circle cx="68" cy="30" r="10" fill={a.bg} />
          <circle cx="32" cy="30" r="5" fill="#FFFDF7" />
          <circle cx="68" cy="30" r="5" fill="#FFFDF7" />
          <circle cx="32" cy="30" r="2.5" fill={a.accent} />
          <circle cx="68" cy="30" r="2.5" fill={a.accent} />
        </g>
      )}
      {a.acc === 'dots' && (
        <g fill={a.accent}>
          <circle cx="34" cy="36" r="5" />
          <circle cx="66" cy="38" r="6" />
          <circle cx="44" cy="22" r="3.5" />
        </g>
      )}
      {!['owl', 'frog'].includes(a.acc) && (
        <g fill="#1F3326">
          <circle cx="38" cy="52" r="3.6" />
          <circle cx="62" cy="52" r="3.6" />
        </g>
      )}
      <path d="M40 66 q10 8 20 0" fill="none" stroke="#1F3326" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
