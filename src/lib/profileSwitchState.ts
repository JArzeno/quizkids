'use client';
import { create } from 'zustand';

// Kept apart from lib/profileSwitch (which builds the greetings from the app strings) so the overlay in the root layout stays tiny on marketing pages

/** Who the screen switches to, with the greeting shown meanwhile (callers pass the text so the overlay needs no app store or strings) */
export type SwitchTarget =
  | { kind: 'kid'; title: string; sub: string; avatar: string; color?: string }
  | { kind: 'parent'; title: string; sub: string; initial: string };

interface SwitchState {
  target: SwitchTarget | null;
  /** Where the circle grows from (the tapped button); null = the middle of the screen */
  origin: { x: number; y: number } | null;
  phase: 'in' | 'out';
  /** Page the switch started on: the overlay fades out once a different page is showing */
  from: string | null;
}

// Not persisted: a switch never outlives the page load it started on
export const useProfileSwitch = create<SwitchState>(() => ({ target: null, origin: null, phase: 'in', from: null }));
