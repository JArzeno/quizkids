'use client';
import React from 'react';

/** Voices to try for each language, best first: Latin American Spanish before Spain's */
const VOICE_PREF: Record<string, string[]> = {
  es: ['es-us', 'es-mx', 'es-419', 'es-do', 'es-co', 'es-es', 'es'],
  en: ['en-us', 'en-gb', 'en'],
  fr: ['fr-fr', 'fr-ca', 'fr'],
};

const tagOf = (v: SpeechSynthesisVoice) => v.lang.replace('_', '-').toLowerCase();

/** Apple's novelty voices (and its older robotic ones) are hard to understand for a dictation */
const ODD_VOICES = /\b(eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley|bells|bubbles|cellos|jester|organ|superstar|trinoids|whisper|wobble|zarvox|albert|bad news|boing|good news|junior|ralph|fred|kathy)\b/i;
const GOOD_VOICES = /google|premium|enhanced|natural|neural|paulina|m[oó]nica|juan|diego|jorge|sabina|marisol|angélica|francisco|samantha|karen|daniel|thomas|am[eé]lie/i;
const voiceScore = (v: SpeechSynthesisVoice) => (GOOD_VOICES.test(v.name) ? 3 : ODD_VOICES.test(v.name) ? 0 : 1) + (v.localService ? 0.5 : 0);

function bestVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  for (const p of VOICE_PREF[lang] || [lang]) {
    const found = voices.filter((v) => tagOf(v).startsWith(p)).sort((a, b) => voiceScore(b) - voiceScore(a));
    if (found.length) return found[0];
  }
  return null;
}

export type SpeechState = 'checking' | 'ready' | 'none';

/**
 * Reads words aloud with the browser's own voices. `state` is 'none' when the browser has no voice for the
 * language, so the game can show the word another way.
 */
export function useSpeech(lang: string) {
  const [state, setState] = React.useState<SpeechState>('checking');
  const voice = React.useRef<SpeechSynthesisVoice | null>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) { setState('none'); return; }
    const synth = window.speechSynthesis;
    const pick = () => {
      const v = bestVoice(lang);
      if (v) { voice.current = v; setState('ready'); return true; }
      return false;
    };
    if (pick()) return;
    const onChange = () => { pick(); };
    synth.addEventListener('voiceschanged', onChange);
    // Voices load late in some browsers; with none listed at all, speak anyway with the language tag
    const timer = setTimeout(() => { if (!pick()) setState(synth.getVoices().length ? 'none' : 'ready'); }, 1500);
    return () => { synth.removeEventListener('voiceschanged', onChange); clearTimeout(timer); };
  }, [lang]);

  React.useEffect(() => () => { if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel(); }, []);

  const say = React.useCallback((text: string, slow = false) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voice.current) { u.voice = voice.current; u.lang = voice.current.lang; } else u.lang = lang;
    u.rate = slow ? 0.5 : 0.85;
    synth.speak(u);
  }, [lang]);

  return { state, say };
}
