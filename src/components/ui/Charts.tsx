'use client';
import React from 'react';

export interface Point { label: string; value: number; hint?: string }

const TONE: Record<string, { fg: string; bg: string }> = {
  primary: { fg: 'var(--primary)', bg: 'var(--primary-l)' },
  honey:   { fg: 'var(--honey)',   bg: 'var(--honey-l)' },
  coral:   { fg: 'var(--coral)',   bg: 'var(--coral-l)' },
  sky:     { fg: 'var(--sky)',     bg: 'var(--sky-l)' },
  berry:   { fg: 'var(--berry)',   bg: 'var(--berry-l)' },
};

function tone(name = 'primary') { return TONE[name] || TONE.primary; }

function Tip({ text }: { text: string }) {
  return (
    <div style={{ position: 'absolute', top: -4, left: '50%', transform: 'translate(-50%, -100%)', whiteSpace: 'nowrap', padding: '4px 8px', borderRadius: 8, background: 'var(--ink)', color: '#fff', fontSize: 11, fontWeight: 700, pointerEvents: 'none', zIndex: 3, boxShadow: 'var(--shadow-sm)' }}>
      {text}
    </div>
  );
}

/**
 * Vertical bars for one series (e.g. minutes studied per day). Built with divs so it
 * scales with the card and stays legible on small screens. The peak bar is labelled;
 * every bar shows its value on hover.
 */
export function BarChart({
  points, unit = '', toneName = 'primary', height = 132, goal, goalLabel, emptyLabel,
}: {
  points: Point[];
  unit?: string;
  toneName?: string;
  height?: number;
  goal?: number;
  goalLabel?: string;
  emptyLabel?: string;
}) {
  const [hover, setHover] = React.useState<number | null>(null);
  const c = tone(toneName);
  const max = Math.max(1, ...points.map((p) => p.value), goal || 0);
  const peak = points.reduce((best, p, i) => (p.value > (points[best]?.value ?? -1) ? i : best), 0);
  const allZero = points.every((p) => p.value === 0);

  return (
    <div>
      <div style={{ position: 'relative', height, display: 'flex', alignItems: 'flex-end', gap: 6, paddingTop: 14 }}>
        {goal ? (
          <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: `${(goal / max) * 100}%`, borderTop: '1.5px dashed var(--line)', pointerEvents: 'none' }}>
            {goalLabel && (
              <span style={{ position: 'absolute', left: 0, top: -14, fontSize: 10, fontWeight: 700, color: 'var(--ink-3)', background: 'var(--surface)', padding: '0 4px', borderRadius: 4 }}>{goalLabel}</span>
            )}
          </div>
        ) : null}
        {points.map((p, i) => {
          const pct = max > 0 ? (p.value / max) * 100 : 0;
          const on = hover === i;
          return (
            <div key={p.label + i} style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative' }}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover((h) => (h === i ? null : h))}>
              {on && <Tip text={p.hint || `${p.label}: ${p.value}${unit ? ' ' + unit : ''}`} />}
              {!on && i === peak && p.value > 0 && (
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-3)', textAlign: 'center', marginBottom: 3 }}>{p.value}{unit ? unit : ''}</div>
              )}
              <div
                title={`${p.label}: ${p.value}${unit ? ' ' + unit : ''}`}
                style={{
                  height: `${Math.max(p.value > 0 ? 6 : 3, pct)}%`,
                  background: p.value > 0 ? c.fg : 'var(--line)',
                  opacity: p.value > 0 ? (on ? 1 : 0.9) : 0.55,
                  borderRadius: '4px 4px 2px 2px',
                  transition: 'height .3s ease, opacity .15s ease',
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        {points.map((p, i) => (
          <div key={p.label + i} style={{ flex: 1, minWidth: 0, textAlign: 'center', fontSize: 10, fontWeight: 700, color: hover === i ? 'var(--ink)' : 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p.label}
          </div>
        ))}
      </div>
      {allZero && emptyLabel && (
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--ink-3)', textAlign: 'center' }}>{emptyLabel}</div>
      )}
    </div>
  );
}

/** Horizontal bars — good for "minutes by subject" or "score by topic". */
export function HBarChart({ points, unit = '', toneName = 'primary', max: maxOverride }: { points: Point[]; unit?: string; toneName?: string; max?: number }) {
  const c = tone(toneName);
  const max = Math.max(1, maxOverride ?? 0, ...points.map((p) => p.value));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {points.map((p, i) => (
        <div key={p.label + i} style={{ display: 'grid', gridTemplateColumns: 'minmax(72px, 34%) 1fr auto', gap: 10, alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.label}>{p.label}</div>
          <div style={{ height: 10, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden' }}>
            <div style={{ width: `${Math.max(2, (p.value / max) * 100)}%`, height: '100%', background: c.fg, borderRadius: 999, transition: 'width .3s ease' }} />
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>{p.value}{unit}</div>
        </div>
      ))}
    </div>
  );
}

/**
 * A small line chart for a single measure over time (e.g. quiz accuracy per round).
 * 2px line, 9px markers, hover crosshair with a tooltip.
 */
export function LineChart({
  points, unit = '%', toneName = 'primary', height = 150, yMax = 100, yLabels = true,
}: {
  points: Point[];
  unit?: string;
  toneName?: string;
  height?: number;
  yMax?: number;
  yLabels?: boolean;
}) {
  const [hover, setHover] = React.useState<number | null>(null);
  const c = tone(toneName);
  const W = 100;
  const H = 100;
  const n = points.length;
  if (n === 0) return null;

  const max = Math.max(1, yMax, ...points.map((p) => p.value));
  const x = (i: number) => (n === 1 ? W / 2 : (i / (n - 1)) * W);
  const y = (v: number) => H - (Math.min(v, max) / max) * H;
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(2)} ${y(p.value).toFixed(2)}`).join(' ');
  const area = `${path} L ${x(n - 1).toFixed(2)} ${H} L ${x(0).toFixed(2)} ${H} Z`;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {yLabels && (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height, fontSize: 10, fontWeight: 700, color: 'var(--ink-3)' }}>
            <span>{max}{unit}</span>
            <span>{Math.round(max / 2)}{unit}</span>
            <span>0</span>
          </div>
        )}
        <div style={{ flex: 1, position: 'relative', height }}>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }} role="img" aria-label="trend">
            {[0, 0.5, 1].map((f) => (
              <line key={f} x1={0} x2={W} y1={H * f} y2={H * f} stroke="var(--line)" strokeWidth={0.4} vectorEffect="non-scaling-stroke" />
            ))}
            <path d={area} fill={c.bg} opacity={0.65} />
            <path d={path} fill="none" stroke={c.fg} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
            {points.map((p, i) => (
              <g key={i}>
                {hover === i && <line x1={x(i)} x2={x(i)} y1={0} y2={H} stroke="var(--ink-3)" strokeWidth={1} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />}
                <circle cx={x(i)} cy={y(p.value)} r={hover === i ? 3.2 : 2.4} fill={c.fg} stroke="var(--surface)" strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
              </g>
            ))}
          </svg>
          {/* hover hit areas — bigger than the markers */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
            {points.map((p, i) => (
              <div key={i} style={{ flex: 1, position: 'relative' }}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover((h) => (h === i ? null : h))}>
                {hover === i && <Tip text={p.hint || `${p.label}: ${p.value}${unit}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 6, paddingLeft: yLabels ? 34 : 0 }}>
        {points.map((p, i) => (
          <div key={i} style={{ flex: 1, minWidth: 0, textAlign: 'center', fontSize: 10, fontWeight: 700, color: hover === i ? 'var(--ink)' : 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.label}</div>
        ))}
      </div>
    </div>
  );
}

/** Single headline number as a ring — accuracy, goal progress. */
export function RingStat({ value, max = 100, label, sub, toneName = 'primary', size = 116 }: { value: number; max?: number; label: string; sub?: string; toneName?: string; size?: number }) {
  const c = tone(toneName);
  const pct = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  const r = 42;
  const circumference = 2 * Math.PI * r;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} role="img" aria-label={`${label}: ${Math.round(pct * 100)}%`}>
          <circle cx={50} cy={50} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={10} />
          <circle cx={50} cy={50} r={r} fill="none" stroke={c.fg} strokeWidth={10} strokeLinecap="round"
            strokeDasharray={`${circumference * pct} ${circumference}`} style={{ transition: 'stroke-dasharray .5s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: size * 0.24, lineHeight: 1 }}>{Math.round(pct * 100)}%</div>
          </div>
        </div>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

/**
 * Per-question outcome strip. Correct / wrong carry an icon + label as well as
 * color, so it reads without relying on hue.
 */
export function OutcomeStrip({ outcomes, labels }: { outcomes: boolean[]; labels: { correct: string; wrong: string } }) {
  const [hover, setHover] = React.useState<number | null>(null);
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {outcomes.map((ok, i) => (
        <div key={i} style={{ position: 'relative' }}
          onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover((h) => (h === i ? null : h))}>
          {hover === i && <Tip text={`#${i + 1} · ${ok ? labels.correct : labels.wrong}`} />}
          <div title={`#${i + 1} ${ok ? labels.correct : labels.wrong}`}
            style={{ width: 30, height: 30, borderRadius: 9, display: 'grid', placeItems: 'center', background: ok ? 'var(--primary-l)' : 'var(--coral-l)', color: ok ? 'var(--primary-d)' : 'var(--coral)', border: '1.5px solid ' + (ok ? 'var(--primary)' : 'var(--coral)'), fontSize: 13, fontWeight: 700 }}>
            {ok ? '✓' : '✕'}
          </div>
        </div>
      ))}
    </div>
  );
}
