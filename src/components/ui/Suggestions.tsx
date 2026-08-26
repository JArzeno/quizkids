'use client';
import React from 'react';
import { ICONS } from './Icons';
import { useT } from '@/lib/i18n';
import { localSuggestions, subjectMeta } from '@/lib/topics';
import type { Lang, StudySuggestion } from '@/types';

type CustomSubject = { id: string; name: string; icon: string; color: string };

/**
 * Suggestions for what to study next. Paints instantly from the local topic
 * library, then swaps in AI picks when they arrive (and falls back silently).
 */
export function useSuggestions(opts: {
  grade?: string;
  lang: Lang;
  subjects?: string[];
  recentTopics?: string[];
  customSubjects?: CustomSubject[];
  limit?: number;
  enabled?: boolean;
}) {
  const { grade, lang, subjects, recentTopics = [], customSubjects = [], limit = 6, enabled = true } = opts;
  const local = React.useMemo(
    () => localSuggestions({ lang, grade, subjects, exclude: recentTopics, limit }),
    // recentTopics is rebuilt on every render upstream; key on its content instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang, grade, (subjects || []).join('|'), recentTopics.join('|'), limit],
  );

  const [suggestions, setSuggestions] = React.useState<StudySuggestion[]>(local);
  const [loading, setLoading] = React.useState(false);
  const [nonce, setNonce] = React.useState(0);

  React.useEffect(() => { setSuggestions(local); }, [local]);

  React.useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/generate/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grade: grade || '3',
            lang,
            recentTopics,
            limit,
            subjects: (subjects && subjects.length ? subjects : undefined)?.map((id) => ({
              id,
              label: subjectMeta(id, customSubjects).en,
            })),
          }),
        });
        if (!cancelled && res.ok) {
          const data = await res.json();
          if (Array.isArray(data.suggestions) && data.suggestions.length) setSuggestions(data.suggestions);
        }
      } catch {
        // keep the library suggestions already on screen
      }
      if (!cancelled) setLoading(false);
    };
    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, grade, lang, (subjects || []).join('|'), recentTopics.join('|'), limit, nonce]);

  /** Rotate the visible set — AI on a re-roll, library shuffle otherwise. */
  const refresh = React.useCallback(() => {
    setSuggestions((prev) => {
      const seen = prev.map((s) => s.topic);
      const next = localSuggestions({ lang, grade, subjects, exclude: [...recentTopics, ...seen], limit });
      return next.length ? next : prev;
    });
    setNonce((n) => n + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, grade, (subjects || []).join('|'), recentTopics.join('|'), limit]);

  return { suggestions, loading, refresh };
}

export function SuggestionCards({
  suggestions, lang, customSubjects = [], onLearn, onQuiz, columns = 'repeat(auto-fill, minmax(240px, 1fr))',
}: {
  suggestions: StudySuggestion[];
  lang: Lang;
  customSubjects?: CustomSubject[];
  onLearn: (s: StudySuggestion) => void;
  onQuiz: (s: StudySuggestion) => void;
  columns?: string;
}) {
  const t = useT(lang);
  if (!suggestions.length) return null;

  return (
    <div className="qk-stagger" style={{ display: 'grid', gridTemplateColumns: columns, gap: 12 }}>
      {suggestions.map((s, i) => {
        const meta = subjectMeta(s.subject, customSubjects);
        const bg = `var(--${meta.tone === 'primary' ? 'primary-l' : meta.tone + '-l'})`;
        const fg = `var(--${meta.tone === 'primary' ? 'primary' : meta.tone})`;
        return (
          <div key={s.subject + s.topic + i} className="qk-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 34, height: 34, borderRadius: 11, background: bg, color: fg, display: 'grid', placeItems: 'center', fontSize: 18, flexShrink: 0 }}>{meta.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: fg, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                {lang === 'es' ? meta.es : meta.en}
              </span>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, lineHeight: 1.25 }}>{s.topic}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>{s.reason}</div>
            </div>
            <div style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
              <button onClick={() => onLearn(s)} className="qk-btn qk-btn-primary" style={{ fontSize: 13, padding: '8px 12px', flex: 1 }}>
                {React.cloneElement(ICONS.book as React.ReactElement<{ size?: number }>, { size: 14 })}
                <span>{t('suggestLearn')}</span>
              </button>
              <button onClick={() => onQuiz(s)} className="qk-btn qk-btn-ghost" style={{ fontSize: 13, padding: '8px 12px' }}>
                {React.cloneElement(ICONS.cards as React.ReactElement<{ size?: number }>, { size: 14 })}
                <span>{t('suggestQuiz')}</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
