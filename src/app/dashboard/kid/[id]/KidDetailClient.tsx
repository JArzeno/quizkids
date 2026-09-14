'use client';
import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ICONS } from '@/components/ui/Icons';
import { Avatar } from '@/components/ui/Avatar';
import { Btn } from '@/components/ui/Btn';
import { Stars, StatCard } from '@/components/ui/Stars';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';
import type { Kid } from '@/types';

const SUBJECT_LABELS: Record<string, { en: string; es: string; icon: string }> = {
  sci:  { en: 'Science',        es: 'Ciencias',          icon: '🔬' },
  math: { en: 'Math',           es: 'Matemáticas',       icon: '➗' },
  lang: { en: 'Language Arts',  es: 'Lengua',            icon: '📖' },
  soc:  { en: 'Social Studies', es: 'Estudios Sociales', icon: '🌎' },
  art:  { en: 'Art',            es: 'Arte',              icon: '🎨' },
};

function subjectInfo(subject: string) {
  return SUBJECT_LABELS[subject] || { en: subject, es: subject, icon: '📚' };
}

function gradeLabel(grade: string, lang: string) {
  const g = (grade || '').toUpperCase();
  if (g === 'K') return lang === 'es' ? 'Kínder' : 'Kindergarten';
  return (lang === 'es' ? 'Grado ' : 'Grade ') + grade;
}

function formatMinutes(min: number, lang: string) {
  if (min < 60) return min + ' min';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} ${lang === 'es' ? 'min' : 'min'}`;
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function relativeDate(iso: string, lang: string) {
  const then = new Date(iso);
  const days = Math.floor((Date.now() - then.getTime()) / 86400000);
  if (days <= 0) return lang === 'es' ? 'Hoy' : 'Today';
  if (days === 1) return lang === 'es' ? 'Ayer' : 'Yesterday';
  if (days < 7) return lang === 'es' ? `Hace ${days} días` : `${days} days ago`;
  return then.toLocaleDateString(lang === 'es' ? 'es-DO' : 'en-US', { month: 'short', day: 'numeric' });
}

interface QuizRow {
  subject: string | null;
  topic: string | null;
  grade: string | null;
  difficulty: string | null;
  total: number | null;
  correct: number | null;
  stars: number | null;
  created_at: string;
}

interface SessionRow {
  minutes: number | null;
  started_at: string | null;
  ended_at: string | null;
}

interface AssignmentRow {
  id: string;
  subject: string | null;
  topic: string | null;
  type: string | null;
  status: string | null;
  assigned_at: string;
}

interface SubjectStat {
  subject: string;
  quizzes: number;
  accuracy: number;
  lastAt: string | null;
}

interface TopicStat {
  topic: string;
  subject: string | null;
  attempts: number;
  accuracy: number;
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="qk-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>{title}</div>
        {action}
      </div>
      {children}
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{text}</div>;
}

function DailyBars({ days, lang }: { days: Array<{ date: Date; minutes: number }>; lang: string }) {
  const max = Math.max(1, ...days.map((d) => d.minutes));
  const weekdays = lang === 'es' ? ['D', 'L', 'M', 'M', 'J', 'V', 'S'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
      {days.map((d) => {
        const pct = d.minutes > 0 ? Math.max(6, Math.round((d.minutes / max) * 100)) : 2;
        return (
          <div key={dayKey(d.date)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}
            title={`${d.date.toLocaleDateString(lang === 'es' ? 'es-DO' : 'en-US', { month: 'short', day: 'numeric' })} · ${d.minutes} min`}>
            <div style={{ fontSize: 10, fontWeight: 700, color: d.minutes > 0 ? 'var(--ink-2)' : 'transparent' }}>{d.minutes}</div>
            <div style={{
              width: '100%', height: `${pct}%`, minHeight: 3, borderRadius: 6,
              background: d.minutes > 0 ? 'var(--primary)' : 'var(--line)',
              opacity: d.minutes > 0 ? 1 : 0.5,
            }} />
            <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{weekdays[d.date.getDay()]}</div>
          </div>
        );
      })}
    </div>
  );
}

function AccuracyRow({ label, icon, meta, accuracy, tone }: { label: string; icon?: string; meta: string; accuracy: number; tone: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13, marginBottom: 5 }}>
          <span style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {icon ? icon + ' ' : ''}{label}
          </span>
          <span style={{ color: 'var(--ink-3)', flexShrink: 0 }}>{meta}</span>
        </div>
        <div style={{ height: 8, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden' }}>
          <div style={{ width: `${Math.max(2, accuracy)}%`, height: '100%', borderRadius: 999, background: tone, transition: 'width .3s' }} />
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, width: 46, textAlign: 'right', color: tone }}>{accuracy}%</div>
    </div>
  );
}

export default function KidDetailClient() {
  const params = useParams<{ id: string }>();
  const kidId = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
  const { lang, kids, gamification, setActiveKidId, setMode, isDemo } = useStore();
  const t = useT(lang);
  const router = useRouter();

  const kid: Kid | undefined = kids.find((k) => k.id === kidId);

  const [quizzes, setQuizzes] = React.useState<QuizRow[]>([]);
  const [sessions, setSessions] = React.useState<SessionRow[]>([]);
  const [assignments, setAssignments] = React.useState<AssignmentRow[]>([]);
  const [loading, setLoading] = React.useState(!isDemo);

  React.useEffect(() => {
    if (!kidId) { setLoading(false); return; }
    // Demo mode has no Supabase rows — surface the sample activity that ships with the demo kid.
    if (isDemo) {
      const demoQuizzes: QuizRow[] = (kid?.recent || [])
        .filter((r) => r.kind === 'quiz')
        .map((r) => {
          const offset = r.when === 'Today' ? 0 : r.when === 'Yesterday' ? 1 : 3;
          const at = new Date();
          at.setDate(at.getDate() - offset);
          return {
            subject: r.subject || null,
            topic: r.title,
            grade: kid?.grade || null,
            difficulty: null,
            total: 5,
            correct: r.score,
            stars: r.score,
            created_at: at.toISOString(),
          };
        });
      setQuizzes(demoQuizzes);
      setSessions([]);
      setAssignments([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const [quizRes, sessionRes, assignRes] = await Promise.all([
          supabase.from('quiz_results')
            .select('subject, topic, grade, difficulty, total, correct, stars, created_at')
            .eq('kid_id', kidId).order('created_at', { ascending: false }).limit(300),
          supabase.from('study_sessions')
            .select('minutes, started_at, ended_at')
            .eq('kid_id', kidId).order('started_at', { ascending: false }).limit(500),
          supabase.from('kid_assignments')
            .select('id, subject, topic, type, status, assigned_at')
            .eq('kid_id', kidId).order('assigned_at', { ascending: false }).limit(40),
        ]);
        if (cancelled) return;
        setQuizzes((quizRes.data as QuizRow[]) || []);
        setSessions((sessionRes.data as SessionRow[]) || []);
        setAssignments((assignRes.data as AssignmentRow[]) || []);
      } catch (e) {
        console.warn('Could not load kid progress:', e);
      }
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [kidId, isDemo, kid?.grade, kid?.recent]);

  // ---- derived stats -------------------------------------------------------
  const sessionMinutes = sessions.reduce((acc, s) => acc + (s.minutes || 0), 0);
  // kids.minutes_total is kept in sync with study_sessions on every session end, so summing both would
  // double-count going forward; take the max to also cover legacy rows from before that sync existed.
  const totalMinutes = Math.max(sessionMinutes, kid?.minutes_total || 0);

  const days = React.useMemo(() => {
    const buckets: Array<{ date: Date; minutes: number }> = [];
    const byDay = new Map<string, number>();
    sessions.forEach((s) => {
      if (!s.started_at) return;
      const key = dayKey(new Date(s.started_at));
      byDay.set(key, (byDay.get(key) || 0) + (s.minutes || 0));
    });
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      buckets.push({ date: d, minutes: byDay.get(dayKey(d)) || 0 });
    }
    return buckets;
  }, [sessions]);

  const last7Minutes = days.slice(7).reduce((acc, d) => acc + d.minutes, 0);
  const avgSession = sessions.length > 0 ? Math.round(sessionMinutes / sessions.length) : 0;

  const quizzesDone = quizzes.length;
  const accuracy = quizzesDone > 0
    ? Math.round(quizzes.reduce((acc, q) => acc + ((q.total || 0) > 0 ? ((q.correct || 0) / (q.total || 1)) * 100 : 0), 0) / quizzesDone)
    : 0;

  const subjectStats: SubjectStat[] = React.useMemo(() => {
    const map = new Map<string, { quizzes: number; pctSum: number; lastAt: string | null }>();
    quizzes.forEach((q) => {
      if (!q.subject) return;
      const cur = map.get(q.subject) || { quizzes: 0, pctSum: 0, lastAt: null };
      cur.quizzes += 1;
      cur.pctSum += (q.total || 0) > 0 ? ((q.correct || 0) / (q.total || 1)) * 100 : 0;
      if (!cur.lastAt || q.created_at > cur.lastAt) cur.lastAt = q.created_at;
      map.set(q.subject, cur);
    });
    return Array.from(map.entries())
      .map(([subject, v]) => ({ subject, quizzes: v.quizzes, accuracy: Math.round(v.pctSum / v.quizzes), lastAt: v.lastAt }))
      .sort((a, b) => b.quizzes - a.quizzes);
  }, [quizzes]);

  const topicStats: TopicStat[] = React.useMemo(() => {
    const map = new Map<string, { subject: string | null; attempts: number; pctSum: number }>();
    quizzes.forEach((q) => {
      if (!q.topic) return;
      const cur = map.get(q.topic) || { subject: q.subject, attempts: 0, pctSum: 0 };
      cur.attempts += 1;
      cur.pctSum += (q.total || 0) > 0 ? ((q.correct || 0) / (q.total || 1)) * 100 : 0;
      map.set(q.topic, cur);
    });
    return Array.from(map.entries())
      .map(([topic, v]) => ({ topic, subject: v.subject, attempts: v.attempts, accuracy: Math.round(v.pctSum / v.attempts) }))
      .sort((a, b) => b.accuracy - a.accuracy);
  }, [quizzes]);

  const strengths = topicStats.filter((s) => s.accuracy >= 75).slice(0, 5);
  const needsPractice = topicStats.filter((s) => s.accuracy < 75).slice(-5).reverse();

  const pendingAssignments = assignments.filter((a) => a.status !== 'completed');

  const goalMin = kid?.goal_min || 30;
  const weeklyGoal = goalMin * 7;
  const weeklyPct = Math.min(100, Math.round((last7Minutes / Math.max(1, weeklyGoal)) * 100));

  const openKidHome = () => {
    if (!kid) return;
    setActiveKidId(kid.id);
    setMode('kid');
    router.push('/kids/home');
  };

  const createFor = () => {
    if (!kid) return;
    setActiveKidId(kid.id);
    router.push('/dashboard/picker');
  };

  if (!kid) {
    return (
      <AppShell>
        <div className="qk-screen qk-page-enter">
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <Link href="/dashboard" className="qk-btn qk-btn-ghost">{ICONS.back}<span>{t('backToDash')}</span></Link>
            <p className="qk-sub" style={{ marginTop: 20 }}>{t('kidNotFound')}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="qk-screen qk-page-enter">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Link href="/dashboard" className="qk-btn qk-btn-ghost" style={{ marginBottom: 18 }}>
            {ICONS.back}<span>{t('backToDash')}</span>
          </Link>

          {/* header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Avatar id={kid.avatar} size={72} ring={kid.color || 'var(--primary)'} />
              <div>
                <span className="qk-eyebrow">{t('kidProgress')}</span>
                <h1 className="qk-h1" style={{ marginTop: 8, fontSize: 38 }}>{kid.name}</h1>
                <p className="qk-sub" style={{ fontSize: 14, marginTop: 4 }}>
                  {gradeLabel(kid.grade, lang)}
                  {kid.code ? ` · ${t('kidCode')}: ` : ''}
                  {kid.code ? <strong style={{ fontFamily: 'ui-monospace, monospace', letterSpacing: '.06em' }}>{kid.code}</strong> : null}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="qk-btn qk-btn-ghost" onClick={openKidHome}>{t('kidView')}</button>
              <Btn kind="primary" icon={ICONS.spark} onClick={createFor}>{t('createNew')}</Btn>
            </div>
          </div>

          {/* top stats */}
          <div className="qk-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginTop: 24 }}>
            <StatCard tone="sky" icon={ICONS.book} value={formatMinutes(totalMinutes, lang)} label={t('totalTime')} />
            <StatCard tone="primary" icon={ICONS.cards} value={quizzesDone} label={t('quizzesTaken')} />
            <StatCard tone="berry" icon={ICONS.check} value={accuracy + '%'} label={t('accuracy')} />
            {gamification !== 'minimal' ? (
              <StatCard tone="coral" icon={ICONS.flame} value={kid.streak || 0} label={t('streak')} />
            ) : (
              <StatCard tone="honey" icon={ICONS.leaf} value={sessions.length} label={t('sessionsLogged')} />
            )}
          </div>

          {loading && (
            <div style={{ marginTop: 20 }}>
              <div className="qk-progress"><span style={{ width: '60%', animation: 'qk-pulse 1.2s ease infinite' }} /></div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginTop: 24, alignItems: 'start' }}>
            {/* time studied */}
            <Section title={t('timeStudied')}>
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 13, color: 'var(--ink-3)' }}>
                <span><strong style={{ color: 'var(--ink)', fontSize: 15 }}>{formatMinutes(last7Minutes, lang)}</strong> · {t('last7Days')}</span>
                <span><strong style={{ color: 'var(--ink)', fontSize: 15 }}>{avgSession} min</strong> · {t('avgSession')}</span>
                <span><strong style={{ color: 'var(--ink)', fontSize: 15 }}>{sessions.length}</strong> · {t('sessionsLogged')}</span>
              </div>
              {sessionMinutes > 0 ? (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{t('last14Days')}</div>
                  <DailyBars days={days} lang={lang} />
                </>
              ) : (
                <EmptyNote text={t('noTimeYet')} />
              )}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-3)', marginBottom: 6 }}>
                  <span>{t('weeklyGoal')} · {weeklyGoal} min</span>
                  <span>{weeklyPct}%</span>
                </div>
                <div className="qk-progress"><span style={{ width: weeklyPct + '%' }} /></div>
              </div>
            </Section>

            {/* subjects */}
            <Section title={t('subjectsBreakdown')}>
              {subjectStats.length === 0 ? (
                <EmptyNote text={t('noSubjectsYet')} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {subjectStats.map((s) => {
                    const info = subjectInfo(s.subject);
                    return (
                      <AccuracyRow
                        key={s.subject}
                        icon={info.icon}
                        label={lang === 'es' ? info.es : info.en}
                        meta={`${s.quizzes} ${s.quizzes === 1 ? t('attemptLabel') : t('attemptsLabel')}${s.lastAt ? ' · ' + relativeDate(s.lastAt, lang) : ''}`}
                        accuracy={s.accuracy}
                        tone={s.accuracy >= 75 ? 'var(--primary)' : s.accuracy >= 50 ? 'var(--honey)' : 'var(--coral)'}
                      />
                    );
                  })}
                </div>
              )}
            </Section>

            {/* strengths */}
            <Section title={'💪 ' + t('strengths')}>
              {strengths.length === 0 ? (
                <EmptyNote text={t('strengthsEmpty')} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {strengths.map((s) => (
                    <AccuracyRow
                      key={s.topic}
                      label={s.topic}
                      icon={s.subject ? subjectInfo(s.subject).icon : undefined}
                      meta={`${s.attempts} ${s.attempts === 1 ? t('attemptLabel') : t('attemptsLabel')}`}
                      accuracy={s.accuracy}
                      tone="var(--primary)"
                    />
                  ))}
                </div>
              )}
            </Section>

            {/* needs practice */}
            <Section title={'🎯 ' + t('needsPractice')}>
              {needsPractice.length === 0 ? (
                <EmptyNote text={t('needsPracticeEmpty')} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {needsPractice.map((s) => (
                    <AccuracyRow
                      key={s.topic}
                      label={s.topic}
                      icon={s.subject ? subjectInfo(s.subject).icon : undefined}
                      meta={`${s.attempts} ${s.attempts === 1 ? t('attemptLabel') : t('attemptsLabel')}`}
                      accuracy={s.accuracy}
                      tone={s.accuracy >= 50 ? 'var(--honey)' : 'var(--coral)'}
                    />
                  ))}
                </div>
              )}
            </Section>

            {/* recent quizzes */}
            <Section title={t('recentQuizzes')}>
              {quizzes.length === 0 ? (
                <EmptyNote text={t('nothingHereYet')} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {quizzes.slice(0, 8).map((q, i) => {
                    const pct = (q.total || 0) > 0 ? Math.round(((q.correct || 0) / (q.total || 1)) * 100) : 0;
                    return (
                      <div key={`${q.created_at}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', background: 'var(--surface-2)', borderRadius: 12 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--primary-l)', color: 'var(--primary-d)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                          {q.subject ? <span style={{ fontSize: 15 }}>{subjectInfo(q.subject).icon}</span> : ICONS.cards}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.topic || '—'}</div>
                          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                            {relativeDate(q.created_at, lang)} · {q.correct || 0}/{q.total || 0} · {pct}%
                          </div>
                        </div>
                        {gamification !== 'minimal' && <Stars count={q.stars || 0} of={5} size={13} />}
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>

            {/* assigned work */}
            <Section title={t('assignedWork')}>
              {assignments.length === 0 ? (
                <EmptyNote text={t('nothingHereYet')} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {assignments.slice(0, 8).map((a) => {
                    const done = a.status === 'completed';
                    return (
                      <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', background: 'var(--surface-2)', borderRadius: 12 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--sky-l)', color: 'var(--sky)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                          {a.type === 'quiz' ? ICONS.cards : a.type === 'guide' ? ICONS.book : ICONS.pdf}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.topic || '—'}</div>
                          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                            {a.subject ? (lang === 'es' ? subjectInfo(a.subject).es : subjectInfo(a.subject).en) + ' · ' : ''}
                            {relativeDate(a.assigned_at, lang)}
                          </div>
                        </div>
                        <span style={{
                          padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700, flexShrink: 0,
                          background: done ? 'var(--primary-l)' : 'var(--honey-l)',
                          color: done ? 'var(--primary-d)' : '#7C5410',
                        }}>
                          {done ? t('statusDone') : t('statusPending')}
                        </span>
                      </div>
                    );
                  })}
                  {pendingAssignments.length > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                      {pendingAssignments.length} {t('statusPending').toLowerCase()}
                    </div>
                  )}
                </div>
              )}
            </Section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
