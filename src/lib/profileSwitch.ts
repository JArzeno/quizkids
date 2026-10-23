'use client';
import type React from 'react';
import { t } from '@/lib/i18n';
import { useProfileSwitch, type SwitchTarget } from '@/lib/profileSwitchState';
import type { Kid, Lang } from '@/types';

export function kidTarget(kid: Pick<Kid, 'name' | 'avatar' | 'color'>, lang: Lang): SwitchTarget {
  return { kind: 'kid', title: `${t(lang, 'kidHomeHi')}, ${kid.name}! 👋`, sub: t(lang, 'kidHomeReady'), avatar: kid.avatar, color: kid.color };
}

export function parentTarget(firstName: string, lang: Lang): SwitchTarget {
  return { kind: 'parent', title: t(lang, 'switchHelloParent') + (firstName ? `, ${firstName}` : ''), sub: t(lang, 'switchParentSub'), initial: (firstName || 'A').charAt(0).toUpperCase() };
}

/** Middle of the clicked element, so keyboard presses (no pointer position) grow from the right place too */
export function originOf(e?: React.MouseEvent<HTMLElement> | null): { x: number; y: number } | undefined {
  const el = e?.currentTarget;
  if (!el) return undefined;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/**
 * Plays the parent ↔ kid switch: the screen fills with the new profile's colors and greeting, then `go` runs (set the
 * mode, push the page). ProfileSwitchOverlay (root layout) fades out once the new page is showing. Pass
 * `navigates: false` when `go` only changes state on the same page, e.g. picking another kid on the kid home.
 */
export function playProfileSwitch(target: SwitchTarget, go: () => void, opts: { origin?: { x: number; y: number }; navigates?: boolean } = {}) {
  if (useProfileSwitch.getState().target) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  useProfileSwitch.setState({ target, origin: opts.origin ?? null, phase: 'in', from: opts.navigates === false ? null : window.location.pathname });
  // The circle takes ~500ms to cover the screen; hold a beat so the greeting can be read
  window.setTimeout(() => {
    go();
    if (opts.navigates === false) window.setTimeout(() => useProfileSwitch.setState({ phase: 'out' }), 250);
  }, reduce ? 150 : 750);
}
