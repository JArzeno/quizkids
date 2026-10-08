'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ICONS } from '@/components/ui/Icons';
import { Avatar } from '@/components/ui/Avatar';
import { SessionPill, useSession, formatElapsed } from '@/components/ui/SessionPill';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';
import { subjectOptions, levelLabel } from '@/lib/subjects';
import { goalProgress } from '@/lib/goals';
import { syncTodayPlan, prepareItem, dateKey, isWeekday } from '@/lib/plan';
import type { ResultRow } from '@/lib/adapt';
import type { PlanItem, RecentItem } from '@/types';

const SUBJECT_LABELS: Record<string, { en: string; es: string; icon: string }> = {
  sci:  { en: 'Science',       es: 'Ciencias',        icon: '🔬' },
  math: { en: 'Math',          es: 'Matemáticas',     icon: '➗' },
  lang: { en: 'Language Arts', es: 'Lengua',          icon: '📖' },
  soc:  { en: 'Social Studies',es: 'Estudios Sociales',icon: '🌎' },
  art:  { en: 'Art',           es: 'Arte',            icon: '🎨' },
};

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function relativeDate(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function KidHomeClient() {
  const {
    lang, kids, activeKidId, setActiveKidId, setMode, setStudyParams, studyParams,
    updateKid, isDemo, filterSubject, setFilterSubject, autoStartSession, setAutoStartSession, customSubjects,
  } = useStore();
  const t = useT(lang);
  const router = useRouter();
  const kid = kids.find((k) => k.id === activeKidId) || kids[0];

  const [dbRecent, setDbRecent] = React.useState<RecentItem[] | null>(null);
  const [loadingHistory, setLoadingHistory] = React.useState(false);
  const [dbMinutesToday, setDbMinutesToday] = React.useState<number | null>(null);

  React.useEffect(() => { setMode('kid'); }, []);

  // ---- today's plan ---------------------------------------------------------
  const [planItems, setPlanItems] = React.useState<PlanItem[]>([]);
  const [planState, setPlanState] = React.useState<'loading' | 'ready' | 'error'>('loading');
  const [results, setResults] = React.useState<ResultRow[]>([]);
  const subjectLangs = React.useRef<Record<string, 'en' | 'es' | 'fr'>>({});

  React.useEffect(() => {
    if (!kid) return;
    let cancelled = false;
    setPlanState('loading');
    const run = async () => {
      try {
        const now = new Date();
        const key = dateKey(now);
        const plan = await syncTodayPlan(kid, isDemo, now);
        if (cancelled) return;
        subjectLangs.current = Object.fromEntries(plan.subjects.map((s) => [s.subject, s.lang || 'en']));
        if (isDemo) updateKid(kid.id, { planItems: plan.items });
        else updateKid(kid.id, { subjects: plan.subjects, goals: plan.goals });
        setResults(plan.results);
        // Subjects the parent paused are left out (items the parent added by hand always show)
        const paused = new Set(plan.subjects.filter((s) => s.paused).map((s) => s.subject));
        let today = plan.items.filter((i) => i.planDate === key && i.status !== 'skipped' && (!i.goalId || !paused.has(i.subject))).sort((a, b) => a.position - b.position);
        setPlanItems(today);
        setPlanState('ready');

        // Prepare the content for today's items in the background (cached content is reused)
        for (const item of today) {
          if (cancelled) return;
          if (item.status === 'completed' || item.contentId) continue;
          const ready = await prepareItem(kid, item, plan.subjects.find((s) => s.subject === item.subject), isDemo, lang, plan.results);
          if (cancelled) return;
          today = today.map((i) => (i.id === ready.id ? ready : i));
          setPlanItems(today);
        }
      } catch (e) {
        console.warn('Could not load today\'s plan:', e);
        if (!cancelled) setPlanState('error');
      }
    };
    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kid?.id, isDemo]);

  const openPlanItem = (item: PlanItem) => {
    if (!kid) return;
    if (!session.running) session.start();
    setStudyParams({
      ...studyParams,
      subject: item.subject,
      topic: item.topic,
      grade: kid.grade,
      contentId: item.contentId,
      assignmentId: undefined,
      planItemId: item.id,
      contentLang: subjectLangs.current[item.subject] || undefined,
      source: undefined,
      returnTo: undefined,
    });
    if (item.type === 'guide') router.push('/kids/guide');
    else if (item.type === 'pdf') router.push('/kids/pdf');
    else router.push('/kids/quiz');
  };

  // Load minutes studied today from Supabase (source of truth across devices/reloads)
  React.useEffect(() => {
    if (!kid || isDemo) { setDbMinutesToday(null); return; }
    let cancelled = false;
    const loadToday = async () => {
      const supabase = createClient();
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from('study_sessions')
        .select('minutes')
        .eq('kid_id', kid.id)
        .gte('started_at', startOfDay.toISOString());
      if (cancelled) return;
      setDbMinutesToday((data || []).reduce((acc, s) => acc + (s.minutes || 0), 0));
    };
    loadToday();
    return () => { cancelled = true; };
  }, [kid?.id, isDemo]);

  // Load assignments from Supabase
  React.useEffect(() => {
    if (!kid || isDemo) return;
    const load = async () => {
      setLoadingHistory(true);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('kid_assignments')
          .select('id, subject, topic, grade, type, status, assigned_at, content_id')
          .eq('kid_id', kid.id)
          .order('assigned_at', { ascending: false })
          .limit(40);

        if (data) {
          const items: RecentItem[] = data.map((row) => ({
            kind: (row.type === 'worksheet' ? 'pdf' : row.type) as 'quiz' | 'guide' | 'pdf',
            title: row.topic,
            when: relativeDate(row.assigned_at),
            score: 0,
            subject: row.subject,
            contentId: row.content_id ?? undefined,
            assignmentId: row.id,
            status: row.status as 'pending' | 'completed',
          }));

          // Merge quiz scores from quiz_results
          const { data: results } = await supabase
            .from('quiz_results')
            .select('assignment_id, stars, correct, total')
            .eq('kid_id', kid.id);

          if (results) {
            const scoreMap = new Map(results.map((r) => [r.assignment_id, r]));
            items.forEach((item) => {
              if (item.assignmentId && scoreMap.has(item.assignmentId)) {
                const r = scoreMap.get(item.assignmentId)!;
                item.score = r.stars ?? 0;
              }
            });
          }

          setDbRecent(items);
        }
      } catch (e) {
        console.warn('Could not load assignments:', e);
      }
      setLoadingHistory(false);
    };
    load();
  }, [kid?.id, isDemo]);

  const session = useSession((elapsedMs) => {
    if (!kid) return;
    const seconds = Math.round(elapsedMs / 1000);
    if (seconds <= 0) return;
    const key = todayKey();
    const baseSeconds = kid.today_date === key ? (kid.seconds_today || 0) : 0;
    const minutes = Math.round(elapsedMs / 60000);
    const minutesTotal = (kid.minutes_total || 0) + minutes;
    updateKid(kid.id, {
      seconds_today: baseSeconds + seconds,
      today_date: key,
      minutes_total: minutesTotal,
    });
    // Persist the session to Supabase so time tracking survives reloads/device changes
    if (!isDemo && minutes > 0) {
      const supabase = createClient();
      const endedAt = new Date();
      void supabase.from('study_sessions').insert({
        kid_id: kid.id,
        minutes,
        started_at: new Date(endedAt.getTime() - elapsedMs).toISOString(),
        ended_at: endedAt.toISOString(),
      });
      void supabase.from('kids').update({ minutes_total: minutesTotal }).eq('id', kid.id);
      setDbMinutesToday((prev) => (prev ?? 0) + minutes);
    }
  });

  // Cumulative time studied today = max(DB total, local live total) + the live running session.
  // DB is authoritative across devices/reloads; local seconds give sub-minute precision right after a session ends.
  const localTodaySeconds = kid && kid.today_date === todayKey() ? (kid.seconds_today || 0) : 0;
  const dbTodaySeconds = (dbMinutesToday ?? 0) * 60;
  const todayBaseMs = Math.max(localTodaySeconds, dbTodaySeconds) * 1000;
  const todayElapsedMs = todayBaseMs + session.elapsedMs;

  // Auto-start session if signal set by navigate-from-study
  const autoStartRef = React.useRef(false);
  React.useEffect(() => {
    if (autoStartSession && !session.running && !autoStartRef.current) {
      autoStartRef.current = true;
      session.start();
      setAutoStartSession(false);
    }
  }, [autoStartSession]);

  // All recent: prefer DB data, fallback to local Zustand
  const allRecent: RecentItem[] = dbRecent ?? kid?.recent ?? [];

  // Filter by subject
  const subjects = Array.from(new Set(allRecent.map((r) => r.subject).filter(Boolean))) as string[];
  const filtered = filterSubject ? allRecent.filter((r) => r.subject === filterSubject) : allRecent;

  const openRecent = (r: RecentItem) => {
    // Auto-start session timer
    if (!session.running) session.start();

    setStudyParams({
      ...studyParams,
      topic: r.title,
      subject: r.subject || studyParams.subject,
      contentId: r.contentId,
      assignmentId: r.assignmentId,
      planItemId: undefined,
      contentLang: undefined,
      source: undefined,
      returnTo: undefined,
    });

    if (r.kind === 'quiz') router.push('/kids/quiz');
    else if (r.kind === 'guide') router.push('/kids/guide');
    else router.push('/kids/pdf');
  };

  if (!kid) return null;

  return (
    <AppShell>
      <div className="qk-screen qk-page-enter" style={{ padding: '32px clamp(20px, 5vw, 56px) 64px' }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          {kids.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
              {kids.map((k) => (
                <button key={k.id} onClick={() => setActiveKidId(k.id)} className="qk-chip"
                  style={{ padding: kid?.id === k.id ? '5px 14px 5px 5px' : '5px 12px 5px 5px', gap: 8, background: kid?.id === k.id ? 'var(--ink)' : 'var(--surface)', color: kid?.id === k.id ? 'var(--surface)' : 'var(--ink-2)', border: '1.5px solid ' + (kid?.id === k.id ? 'var(--ink)' : 'var(--line)') }}>
                  <Avatar id={k.avatar} size={28} /><span>{k.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* greeting card */}
          <div className="qk-card qk-slide-up qk-kid-hero" style={{ padding: 'clamp(20px, 4vw, 36px)', display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto', gap: 24, alignItems: 'center', background: 'linear-gradient(135deg, var(--primary-l) 0%, var(--honey-l) 100%)', borderColor: 'var(--primary)', position: 'relative', overflow: 'hidden' }}>
            <div aria-hidden style={{ position: 'absolute', inset: 0, opacity: .16, backgroundImage: 'radial-gradient(var(--primary) 1.5px, transparent 1.5px)', backgroundSize: '22px 22px' }} />
            <div className="qk-kid-hero-avatar" style={{ position: 'relative' }}>
              <Avatar id={kid.avatar} size={104} ring={kid.color || 'var(--primary)'} />
              {session.running && (
                <span style={{ position: 'absolute', right: -4, top: -4, padding: '3px 8px', borderRadius: 999, background: session.paused ? 'var(--honey)' : 'var(--primary)', color: '#fff', fontSize: 10, fontWeight: 700 }}>
                  {session.paused ? 'PAUSE' : 'LIVE'}
                </span>
              )}
            </div>
            <div style={{ minWidth: 0, position: 'relative' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--primary-d)', letterSpacing: '.04em', textTransform: 'uppercase' }}>
                {t('kidHomeHi')}, {kid.name}! 👋
              </div>
              <h1 className="qk-h1" style={{ marginTop: 6, fontSize: 'clamp(26px, 3vw, 38px)' }}>{t('kidHomeReady')}</h1>
              <div style={{ marginTop: 14, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{t('today')}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22, fontVariantNumeric: 'tabular-nums' }}>{formatElapsed(todayElapsedMs)}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{t('todayStudied')}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase' }}>{t('streak')}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22, color: 'var(--coral)' }}>
                    {React.cloneElement(ICONS.flame as React.ReactElement<{ size?: number }>, { size: 20 })}<span>{kid.streak || 0}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{lang === 'es' ? 'días seguidos' : 'days'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase' }}>{t('starsEarned')}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22, color: '#7C5410' }}>
                    {React.cloneElement(ICONS.star as React.ReactElement<{ size?: number }>, { size: 20 })}<span>{kid.stars || 0}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="qk-kid-hero-action" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
              <SessionPill lang={lang} session={session} onStart={session.start} onTogglePause={() => session.paused ? session.resume() : session.pause()} onEnd={session.end} />
            </div>
          </div>

          {/* today's plan */}
          <section style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
              <h2 className="qk-h2" style={{ margin: 0 }}>{t('planTitle')}</h2>
              {planItems.length > 0 && (
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-3)' }}>{planItems.filter((i) => i.status === 'completed').length}/{planItems.length} {t('planDoneOf')}</span>
              )}
            </div>
            {planItems.length > 0 && (
              <div className="qk-progress" style={{ marginBottom: 14 }}><span style={{ width: (planItems.filter((i) => i.status === 'completed').length / planItems.length) * 100 + '%' }} /></div>
            )}
            {planState === 'loading' && planItems.length === 0 && <div className="qk-card" style={{ padding: 20, color: 'var(--ink-3)' }}>{t('planPreparing')}</div>}
            {planState === 'error' && <div className="qk-card" style={{ padding: 20, color: 'var(--coral)' }}>{t('planError')}</div>}
            {planState === 'ready' && planItems.length === 0 && (
              <div className="qk-card" style={{ padding: 20, color: 'var(--ink-3)' }}>{isWeekday(new Date()) ? t('planNone') : t('planRest')}</div>
            )}
            {planItems.length > 0 && (
              <div style={{ display: 'grid', gap: 10 }}>
                {planItems.map((item) => {
                  const done = item.status === 'completed';
                  const info = subjectOptions(lang, customSubjects).find((o) => o.id === item.subject) || { label: item.subject, icon: '📚' };
                  const tone = item.type === 'guide' ? 'sky' : item.type === 'pdf' ? 'coral' : 'primary';
                  return (
                    <button key={item.id} onClick={() => openPlanItem(item)} className="qk-card"
                      style={{ appearance: 'none', textAlign: 'left', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', border: '1px solid var(--line)', opacity: done ? 0.65 : 1 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: `var(--${tone === 'primary' ? 'primary-l' : tone + '-l'})`, color: `var(--${tone === 'primary' ? 'primary' : tone})`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        {item.type === 'guide' ? ICONS.book : item.type === 'pdf' ? ICONS.pdf : ICONS.cards}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                          {info.icon} {info.label} · {item.review && `${t('planReview')} · `}{!item.goalId && '✋ '}{item.type === 'guide' ? t('genGuide') : item.type === 'pdf' ? t('genPdf') : item.type === 'test' ? t('planFinalTest') : t('genQuiz')} · {item.minutes} {t('planMin')}
                        </div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17, lineHeight: 1.25, textDecoration: done ? 'line-through' : 'none' }}>{item.topic}</div>
                      </div>
                      {done && <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{ICONS.check}</div>}
                    </button>
                  );
                })}
                {planItems.every((i) => i.status === 'completed') && (
                  <div className="qk-bounce-in" style={{ padding: '12px 16px', borderRadius: 14, background: 'var(--primary-l)', color: 'var(--primary-d)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>🎉 {t('planAllDone')}</div>
                )}
              </div>
            )}
          </section>

          {/* my subjects */}
          {(kid.subjects || []).length > 0 && (
            <section style={{ marginTop: 28 }}>
              <h2 className="qk-h2" style={{ margin: '0 0 14px' }}>{lang === 'es' ? 'Mis materias' : 'My subjects'}</h2>
              <div className="qk-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))', gap: 12 }}>
                {(kid.subjects || []).map((ks) => {
                  const info = subjectOptions(lang, customSubjects).find((o) => o.id === ks.subject) || { label: ks.subject, icon: '📚' };
                  const goal = (kid.goals || []).find((g) => g.subject === ks.subject && g.status === 'active');
                  const pct = goal ? goalProgress(goal, results).pct : null;
                  return (
                    <button key={ks.subject} onClick={() => router.push(`/kids/subject/${encodeURIComponent(ks.subject)}`)} className="qk-card qk-wiggle"
                      style={{ appearance: 'none', textAlign: 'left', padding: 16, display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer', border: '1px solid var(--line)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 16, background: 'var(--primary-l)', display: 'grid', placeItems: 'center', fontSize: 26, flexShrink: 0 }}>{info.icon}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17, lineHeight: 1.2 }}>{info.label}</div>
                          {ks.level != null && <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{levelLabel(ks.level, lang)}</div>}
                        </div>
                      </div>
                      {pct != null && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🎯 {goal!.title}</span><span>{pct}%</span>
                          </div>
                          <div className="qk-progress"><span style={{ width: pct + '%' }} /></div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* subject filter */}
          {subjects.length > 1 && (
            <div style={{ marginTop: 28, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                {lang === 'es' ? 'Filtrar' : 'Filter'}
              </span>
              <button
                onClick={() => setFilterSubject(null)}
                style={{ appearance: 'none', padding: '5px 12px', borderRadius: 999, border: '1.5px solid ' + (filterSubject === null ? 'var(--primary)' : 'var(--line)'), background: filterSubject === null ? 'var(--primary-l)' : 'var(--surface)', color: filterSubject === null ? 'var(--primary-d)' : 'var(--ink-2)', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all .15s' }}
              >
                {lang === 'es' ? 'Todo' : 'All'}
              </button>
              {subjects.map((subj) => {
                const info = SUBJECT_LABELS[subj] || { en: subj, es: subj, icon: '📚' };
                const on = filterSubject === subj;
                return (
                  <button key={subj} onClick={() => setFilterSubject(on ? null : subj)}
                    style={{ appearance: 'none', padding: '5px 12px', borderRadius: 999, border: '1.5px solid ' + (on ? 'var(--primary)' : 'var(--line)'), background: on ? 'var(--primary-l)' : 'var(--surface)', color: on ? 'var(--primary-d)' : 'var(--ink-2)', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'all .15s' }}>
                    <span>{info.icon}</span>
                    <span>{lang === 'es' ? info.es : info.en}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* recent / assignments */}
          <section style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              <h2 className="qk-h2" style={{ margin: 0 }}>
                {filtered.length ? t('kidHomeRecent') : t('kidHomePick')}
              </h2>
              {loadingHistory && (
                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                  {lang === 'es' ? 'Cargando…' : 'Loading…'}
                </span>
              )}
            </div>

            <div className="qk-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))', gap: 14 }}>
              {filtered.length > 0 ? filtered.map((r, idx) => {
                const tone = r.kind === 'quiz' ? 'primary' : r.kind === 'guide' ? 'sky' : 'coral';
                const bg = `var(--${tone === 'primary' ? 'primary-l' : tone + '-l'})`;
                const fg = `var(--${tone === 'primary' ? 'primary' : tone})`;
                const subjInfo = r.subject ? (SUBJECT_LABELS[r.subject] || { en: r.subject, es: r.subject, icon: '📚' }) : null;
                const isCompleted = r.status === 'completed';

                return (
                  <button key={idx} onClick={() => openRecent(r)} className="qk-card qk-wiggle"
                    style={{ appearance: 'none', textAlign: 'left', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', border: '1px solid var(--line)', transition: 'transform .2s ease, box-shadow .2s ease', position: 'relative' }}>

                    {/* completion badge */}
                    {isCompleted && (
                      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'grid', placeItems: 'center' }}>
                        {ICONS.check}
                      </div>
                    )}

                    <div style={{ height: 96, background: bg, color: fg, display: 'grid', placeItems: 'center', position: 'relative' }}>
                      <div style={{ position: 'absolute', inset: 0, opacity: .18, backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
                      <div style={{ position: 'relative', transform: 'scale(2)' }}>
                        {r.kind === 'quiz' ? ICONS.cards : r.kind === 'guide' ? ICONS.book : ICONS.pdf}
                      </div>
                    </div>
                    <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                          {r.kind === 'quiz' ? t('genQuiz') : r.kind === 'guide' ? t('genGuide') : t('genPdf')}
                        </span>
                        {subjInfo && (
                          <span style={{ fontSize: 11, color: fg, background: bg, padding: '1px 7px', borderRadius: 999, fontWeight: 700 }}>
                            {subjInfo.icon} {lang === 'es' ? subjInfo.es : subjInfo.en}
                          </span>
                        )}
                      </div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, lineHeight: 1.25 }}>{r.title}</div>
                      <div style={{ marginTop: 'auto', paddingTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{r.when}</span>
                        {r.score > 0 && (
                          <span style={{ fontSize: 12, color: 'var(--honey)', fontWeight: 700 }}>
                            {'⭐'.repeat(Math.min(r.score, 5))}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              }) : (
                <div className="qk-card" style={{ padding: 24, textAlign: 'center', color: 'var(--ink-3)', gridColumn: '1 / -1' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>{t('kidHomeNothing')}</div>
                  <div style={{ marginTop: 8, fontSize: 14 }}>
                    {lang === 'es' ? 'Pide a tu papá o mamá que te asigne un estudio.' : 'Ask a parent to assign you a study.'}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
