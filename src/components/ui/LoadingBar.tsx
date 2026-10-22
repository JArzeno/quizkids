'use client';
import React from 'react';
import { createPortal } from 'react-dom';

/**
 * Progress bar for waits that report no real progress. It fills quickly at first and slows down as it nears the end,
 * so it keeps moving instead of blinking. `expectedMs` is roughly how long the wait usually takes.
 *
 * Mounted only while loading (the default), it simply runs until it unmounts. Pass `active` to keep it mounted: when
 * `active` turns false the bar fills to 100% and fades out. `top` pins a thin bar to the top of the window, so the page
 * below doesn't jump when it appears or goes away.
 */
export function LoadingBar({ active = true, expectedMs = 2500, top = false, style }: { active?: boolean; expectedMs?: number; top?: boolean; style?: React.CSSProperties }) {
  const [pct, setPct] = React.useState(0);
  const [shown, setShown] = React.useState(active);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!active) {
      if (!shown) return;
      setPct(100);
      const id = window.setTimeout(() => setShown(false), 450);
      return () => window.clearTimeout(id);
    }
    setShown(true);
    setPct(4);
    const start = Date.now();
    const id = window.setInterval(() => {
      // ~85% at the expected time, then it keeps creeping toward 95% for longer waits
      const t = (Date.now() - start) / expectedMs;
      setPct(4 + 91 * (1 - Math.exp(-1.9 * t)));
    }, 200);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, expectedMs]);

  if (!shown) return null;
  const done = !active;
  const bar = (
    <div className={top ? 'qk-progress-top' : 'qk-progress'} role="progressbar" aria-label="Loading" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}
      style={{ opacity: done ? 0 : 1, transition: 'opacity .3s ease .15s', ...style }}>
      <span style={{ width: pct + '%', transition: done ? 'width .2s ease' : 'width .25s linear' }} />
    </div>
  );
  // Page wrappers animate with transforms, which would trap a fixed bar inside them
  return top ? (mounted ? createPortal(bar, document.body) : null) : bar;
}
