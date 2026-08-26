'use client';
import React from 'react';
import { BarChart } from './Charts';
import { useT } from '@/lib/i18n';
import { dailyMinutes, formatDuration, totalSeconds, dayKey } from '@/lib/session';
import { subjectLabel } from '@/lib/topics';
import type { Lang, TimeLogEntry } from '@/types';

function activityLabel(activity: string | null | undefined, t: (k: string) => string): string {
  switch (activity) {
    case 'quiz': return t('activityQuiz');
    case 'guide': return t('activityGuide');
    case 'pdf': return t('activityPdf');
    default: return t('activityFree');
  }
}

function activityIcon(activity: string | null | undefined): string {
  switch (activity) {
    case 'quiz': return '🃏';
    case 'guide': return '📖';
    case 'pdf': return '🖨️';
    default: return '⏱️';
  }
}

function timeOfDay(iso: string, lang: Lang): string {
  const d = new Date(iso);
  const today = dayKey() === dayKey(d);
  const locale = lang === 'es' ? 'es-ES' : 'en-US';
  const time = d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
  if (today) return time;
  return `${d.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} · ${time}`;
}

/**
 * The study-time log — the same view for the kid ("how long did I study?") and for
 * the parent ("what did they actually do this week?").
 */
export function TimeLogPanel({
  entries, lang, goalMin, customSubjects, title, sub, maxRows = 6, compact = false,
}: {
  entries: TimeLogEntry[];
  lang: Lang;
  goalMin?: number;
  customSubjects?: Array<{ id: string; name: string; icon: string; color: string }>;
  title?: string;
  sub?: string;
  maxRows?: number;
  compact?: boolean;
}) {
  const t = useT(lang);
  const [showAll, setShowAll] = React.useState(false);

  const days = dailyMinutes(entries, 7, lang);
  const weekKeys = new Set(days.map((d) => d.key));
  const weekEntries = entries.filter((e) => weekKeys.has(dayKey(e.started_at)));
  const weekSeconds = totalSeconds(weekEntries);
  const sessionsCt = weekEntries.length;
  const avgSeconds = sessionsCt ? Math.round(weekSeconds / sessionsCt) : 0;
  const bestDay = days.reduce((best, d) => (d.value > best.value ? d : best), days[0] || { label: '—', value: 0, key: '' });
  const rows = showAll ? entries.slice(0, 40) : entries.slice(0, maxRows);
  const dailyGoal = goalMin && goalMin > 0 ? Math.max(5, Math.round(goalMin / 7)) : undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {(title || sub) && (
        <div>
          {title && <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: compact ? 15 : 18 }}>{title}</div>}
          {sub && <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>}
        </div>
      )}

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{t('last7Days')}</span>
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{t('minPerDay')}</span>
        </div>
        <BarChart
          points={days.map((d) => ({ label: d.label, value: d.value, hint: `${d.label}: ${d.value} min` }))}
          unit="m"
          height={compact ? 104 : 132}
          goal={dailyGoal}
          goalLabel={dailyGoal ? `${t('goalLine')} ${dailyGoal}m` : undefined}
          emptyLabel={t('timeLogEmpty')}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {[
          { v: formatDuration(weekSeconds, lang), l: t('thisWeekMin') },
          { v: String(sessionsCt), l: t('sessionsCt') },
          { v: sessionsCt ? formatDuration(avgSeconds, lang) : '—', l: t('avgSession') },
        ].map((s) => (
          <div key={s.l} style={{ textAlign: 'center', padding: '8px 4px', background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--line)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--primary)' }}>{s.v}</div>
            <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 600 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {bestDay.value > 0 && (
        <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
          {t('longestDay')}: <strong style={{ color: 'var(--ink-2)' }}>{bestDay.label} · {bestDay.value} min</strong>
        </div>
      )}

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
          {t('timeLog')}
        </div>
        {rows.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{t('noSessionsYet')}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {rows.map((e) => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12 }}>
                <span aria-hidden style={{ fontSize: 16 }}>{activityIcon(e.activity)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.topic || activityLabel(e.activity, t)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                    {timeOfDay(e.started_at, lang)}
                    {e.subject ? ` · ${subjectLabel(e.subject, lang, customSubjects)}` : ''}
                    {e.topic ? ` · ${activityLabel(e.activity, t)}` : ''}
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {formatDuration(e.seconds || (e.minutes || 0) * 60, lang)}
                </div>
              </div>
            ))}
            {entries.length > maxRows && (
              <button onClick={() => setShowAll((v) => !v)}
                style={{ appearance: 'none', border: 0, background: 'transparent', color: 'var(--primary)', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '4px 0', textAlign: 'left' }}>
                {showAll ? (lang === 'es' ? 'Ver menos' : 'Show less') : (lang === 'es' ? `Ver todo (${entries.length})` : `Show all (${entries.length})`)}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
