'use client';
import React from 'react';

/** How many rows the recent quizzes and assigned work lists show before "View all" */
export const LIST_PREVIEW = 3;

export function ViewAllToggle({ open, total, onToggle, t }: { open: boolean; total: number; onToggle: () => void; t: (k: string) => string }) {
  if (total <= LIST_PREVIEW) return null;
  return (
    <button onClick={onToggle} aria-expanded={open}
      style={{ appearance: 'none', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--primary-d)' }}>
      {open ? t('showLess') : `${t('viewAll')} (${total})`}
    </button>
  );
}

interface QuizLike { subject: string | null; topic: string | null; total: number | null; correct: number | null }

/**
 * A topic quizzed several times shows once, with its latest result, how many tries it took and the best score.
 * `quizzes` must be newest first; the result keeps that order.
 */
export function quizzesByTopic<Q extends QuizLike>(quizzes: Q[]): Array<{ latest: Q; attempts: number; bestPct: number }> {
  const map = new Map<string, { latest: Q; attempts: number; bestPct: number }>();
  quizzes.forEach((q) => {
    const key = `${q.subject || ''}|${(q.topic || '').trim().toLowerCase()}`;
    const pct = (q.total || 0) > 0 ? Math.round(((q.correct || 0) / (q.total || 1)) * 100) : 0;
    const cur = map.get(key);
    if (!cur) map.set(key, { latest: q, attempts: 1, bestPct: pct });
    else { cur.attempts += 1; cur.bestPct = Math.max(cur.bestPct, pct); }
  });
  return Array.from(map.values());
}

/** What's still to do comes first, then the finished work (each keeps its order) */
export function pendingFirst<A extends { status: string | null }>(assignments: A[]): A[] {
  return [...assignments.filter((a) => a.status !== 'completed'), ...assignments.filter((a) => a.status === 'completed')];
}
