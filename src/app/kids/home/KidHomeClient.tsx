'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ICONS } from '@/components/ui/Icons';
import { Avatar } from '@/components/ui/Avatar';
import { SessionPill } from '@/components/ui/SessionPill';
import { TimeLogPanel } from '@/components/ui/TimeLogPanel';
import { SuggestionCards, useSuggestions } from '@/components/ui/Suggestions';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';
import { useStudyTimer, fetchTimeLog, mergeLogs, formatElapsed, dayKey, totalSeconds } from '@/lib/session';
import { subjectMeta } from '@/lib/topics';
import type { RecentItem, StudySuggestion, TimeLogEntry } from '@/types';

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
    lang, kids, activeKidId, setMode, setStudyParams, studyParams,
    isDemo, filterSubject, setFilterSubject, autoStartSession, setAutoStartSession,
    timeLog, customSubjects, parentPrefs,
  } = useStore();
  const t = useT(lang);
  const router = useRouter();
  const kid = kids.find((k) => k.id === activeKidId) || kids[0];

  const [dbRecent, setDbRecent] = React.useState<RecentItem[] | null>(null);
  const [loadingHistory, setLoadingHistory] = React.useState(false);
  const [dbLog, setDbLog] = React.useState<TimeLogEntry[]>([]);
  const [showLog, setShowLog] = React.useState(true);

  const timer = useStudyTimer();

  React.useEffect(() => { setMode('kid'); }, []);

  // Study-time log — Supabase is the source of truth, local entries fill the gaps
  // (demo mode, or a session saved while the network was down).
  const localLog = React.useMemo(() => timeLog.filter((e) => e.kid_id === kid?.id), [timeLog, kid?.id]);
  const log = React.useMemo(() => mergeLogs(dbLog, localLog), [dbLog, localLog]);

  const loadLog = React.useCallback(async () => {
    if (!kid || isDemo) { setDbLog([]); return; }
    const rows = await fetchTimeLog([kid.id]);
    setDbLog(rows);
  }, [kid?.id, isDemo]);

  React.useEffect(() => { void loadLog(); }, [loadLog]);

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

  // Time studied today = logged sessions today + whatever the live clock is showing.
  const todayLoggedSeconds = React.useMemo(
    () => totalSeconds(log.filter((e) => dayKey(e.started_at) === dayKey())),
    [log],
  );
  const todayElapsedMs = todayLoggedSeconds * 1000 + (timer.session.kidId === kid?.id ? timer.elapsedMs : 0);

  // Auto-start signal (set when a parent hands the tablet over)
  const autoStartRef = React.useRef(false);
  React.useEffect(() => {
    if (autoStartSession && kid && !timer.running && !autoStartRef.current) {
      autoStartRef.current = true;
      timer.start({ kidId: kid.id, activity: 'free' });
      setAutoStartSession(false);
    }
  }, [autoStartSession, kid?.id, timer.running]);

  const endSession = async () => {
    await timer.end();
    void loadLog();
  };

  // All recent: prefer DB data, fallback to local Zustand
  const allRecent: RecentItem[] = dbRecent ?? kid?.recent ?? [];

  // Filter by subject
  const subjects = Array.from(new Set(allRecent.map((r) => r.subject).filter(Boolean))) as string[];
  const filtered = filterSubject ? allRecent.filter((r) => r.subject === filterSubject) : allRecent;

  const recentTopics = React.useMemo(
    () => Array.from(new Set(allRecent.map((r) => r.title).filter(Boolean))).slice(0, 12),
    [allRecent],
  );
  const { suggestions, loading: loadingSuggestions, refresh: refreshSuggestions } = useSuggestions({
    grade: kid?.grade,
    lang,
    recentTopics,
    customSubjects,
    limit: 6,
  });

  /** Every way into a study starts the clock, so time is never lost. */
  const beginStudy = (params: { subject: string; topic: string; contentId?: string; assignmentId?: string }, kind: 'quiz' | 'guide' | 'pdf') => {
    if (!kid) return;
    timer.start({ kidId: kid.id, subject: params.subject, topic: params.topic, activity: kind });
    setStudyParams({
      ...studyParams,
      grade: kid.grade,
      subject: params.subject,
      topic: params.topic,
      contentId: params.contentId,
      assignmentId: params.assignmentId,
    });
    router.push(kind === 'quiz' ? '/kids/quiz' : kind === 'guide' ? '/kids/guide' : '/kids/pdf');
  };

  const openRecent = (r: RecentItem) => beginStudy(
    { subject: r.subject || studyParams.subject, topic: r.title, contentId: r.contentId, assignmentId: r.assignmentId },
    r.kind,
  );

  const openSuggestion = (s: StudySuggestion, kind: 'quiz' | 'guide') =>
    // No contentId: this is a brand-new topic, so it gets generated fresh.
    beginStudy({ subject: s.subject, topic: s.topic }, kind);

  if (!kid) return null;

  return (
    <AppShell>
      <div className="qk-screen qk-page-enter" style={{ padding: '32px clamp(20px, 5vw, 56px) 64px' }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          {/* switching kids always goes back through the profile picker */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={() => router.push('/profile')} className="qk-chip"
              style={{ padding: '5px 14px 5px 5px', gap: 8, background: 'var(--surface)', color: 'var(--ink-2)', border: '1.5px solid var(--line)' }}>
              <Avatar id={kid.avatar} size={28} />
              <span>{kid.name}</span>
              <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>· {t('whoElse')}</span>
            </button>
          </div>

          {/* greeting card */}
          <div className="qk-card qk-slide-up" style={{ padding: 'clamp(20px, 4vw, 36px)', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 24, alignItems: 'center', background: 'linear-gradient(135deg, var(--primary-l) 0%, var(--honey-l) 100%)', borderColor: 'var(--primary)', position: 'relative', overflow: 'hidden' }}>
            <div aria-hidden style={{ position: 'absolute', inset: 0, opacity: .16, backgroundImage: 'radial-gradient(var(--primary) 1.5px, transparent 1.5px)', backgroundSize: '22px 22px' }} />
            <div style={{ position: 'relative' }}>
              <Avatar id={kid.avatar} size={104} ring={kid.color || 'var(--primary)'} />
              {timer.running && (
                <span style={{ position: 'absolute', right: -4, top: -4, padding: '3px 8px', borderRadius: 999, background: timer.paused ? 'var(--honey)' : 'var(--primary)', color: '#fff', fontSize: 10, fontWeight: 700 }}>
                  {timer.paused ? 'PAUSE' : 'LIVE'}
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
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
              <SessionPill
                lang={lang}
                timer={timer}
                onStart={() => timer.start({ kidId: kid.id, activity: 'free' })}
                onTogglePause={timer.toggle}
                onEnd={endSession}
              />
              <button onClick={() => router.push('/profile')} style={{ appearance: 'none', border: 0, background: 'transparent', fontSize: 12, color: 'var(--ink-3)', textDecoration: 'underline', cursor: 'pointer' }}>
                {t('switchUser')}
              </button>
            </div>
          </div>

          {/* suggestions — what to study next */}
          <section style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
              <div>
                <h2 className="qk-h2" style={{ margin: 0 }}>✨ {t('suggestTitle')}</h2>
                <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>{t('suggestSub')}</div>
              </div>
              <button onClick={refreshSuggestions} className="qk-btn qk-btn-ghost" style={{ fontSize: 13, padding: '8px 12px' }}>
                {React.cloneElement(ICONS.shuffle as React.ReactElement<{ size?: number }>, { size: 14 })}
                <span>{loadingSuggestions ? t('suggestLoading') : t('suggestRefresh')}</span>
              </button>
            </div>
            <SuggestionCards
              suggestions={suggestions}
              lang={lang}
              customSubjects={customSubjects}
              onLearn={(s) => openSuggestion(s, 'guide')}
              onQuiz={(s) => openSuggestion(s, 'quiz')}
            />
          </section>

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
                const info = subjectMeta(subj, customSubjects);
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

            <div className="qk-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {filtered.length > 0 ? filtered.map((r, idx) => {
                const tone = r.kind === 'quiz' ? 'primary' : r.kind === 'guide' ? 'sky' : 'coral';
                const bg = `var(--${tone === 'primary' ? 'primary-l' : tone + '-l'})`;
                const fg = `var(--${tone === 'primary' ? 'primary' : tone})`;
                const subjInfo = r.subject ? subjectMeta(r.subject, customSubjects) : null;
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
                    {lang === 'es' ? 'O elige una de las sugerencias de arriba.' : 'Or pick one of the suggestions above.'}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* the kid's own time log */}
          <section style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
              <h2 className="qk-h2" style={{ margin: 0 }}>⏱️ {t('timeLog')}</h2>
              <button onClick={() => setShowLog((v) => !v)} className="qk-btn qk-btn-ghost" style={{ fontSize: 13, padding: '8px 12px' }}>
                {showLog ? t('hideTime') : t('reviewTime')}
              </button>
            </div>
            {showLog && (
              <div className="qk-card" style={{ padding: 20 }}>
                <TimeLogPanel
                  entries={log}
                  lang={lang}
                  goalMin={kid.goal_min || parentPrefs.goalMin}
                  customSubjects={customSubjects}
                  sub={t('timeLogSub')}
                />
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
