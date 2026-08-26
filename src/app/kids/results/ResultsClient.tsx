'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Ico, ICONS } from '@/components/ui/Icons';
import { Avatar } from '@/components/ui/Avatar';
import { Btn } from '@/components/ui/Btn';
import { StatCard } from '@/components/ui/Stars';
import { LineChart, HBarChart, RingStat, OutcomeStrip } from '@/components/ui/Charts';
import { SuggestionCards, useSuggestions } from '@/components/ui/Suggestions';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';
import { useStudyTimer, formatDuration } from '@/lib/session';
import { subjectLabel } from '@/lib/topics';
import type { StudySuggestion, TimeLogEntry } from '@/types';

interface PastResult { subject: string | null; topic: string | null; correct: number; total: number; created_at: string }

export default function ResultsClient() {
  const { lang, kids, activeKidId, quizResult, studyParams, gamification, setQuizResult, updateKid, isDemo, customSubjects, setStudyParams } = useStore();
  const t = useT(lang);
  const router = useRouter();
  const kid = kids.find((k) => k.id === activeKidId) || kids[0];
  const savedRef = React.useRef(false);
  const timer = useStudyTimer();

  const [history, setHistory] = React.useState<PastResult[] | null>(null);
  const [logged, setLogged] = React.useState<TimeLogEntry | null>(null);

  React.useEffect(() => {
    if (!quizResult) { router.replace('/kids/home'); return; }

    const pct = Math.round((quizResult.correct / quizResult.total) * 100);
    const goldStars = pct >= 90 ? 5 : pct >= 75 ? 4 : pct >= 60 ? 3 : pct >= 40 ? 2 : 1;

    if (kid && quizResult.stars > 0) {
      updateKid(kid.id, {
        stars: (kid.stars || 0) + goldStars,
        lastSubject: studyParams.subject,
      });
    }

    // Save to Supabase (once)
    if (!isDemo && kid && !savedRef.current) {
      savedRef.current = true;
      const supabase = createClient();

      // Update kid stars in DB
      supabase.from('kids')
        .update({ stars: (kid.stars || 0) + goldStars, last_subject: studyParams.subject })
        .eq('id', kid.id)
        .then(() => {});

      // Mark assignment completed (in case QuizClient didn't save it)
      if (studyParams.assignmentId) {
        supabase.from('kid_assignments')
          .update({ status: 'completed' })
          .eq('id', studyParams.assignmentId)
          .then(() => {});
      }

      // Update recent item status in local store
      if (studyParams.assignmentId && kid.recent) {
        const updatedRecent = kid.recent.map((r) =>
          r.assignmentId === studyParams.assignmentId
            ? { ...r, score: goldStars, status: 'completed' as const }
            : r
        );
        updateKid(kid.id, { recent: updatedRecent });
      }
    }
  }, []);

  // The round is over, so close the study session and write it to the time log.
  const endedRef = React.useRef(false);
  React.useEffect(() => {
    if (endedRef.current || !quizResult) return;
    endedRef.current = true;
    void timer.end().then((entry) => { if (entry) setLogged(entry); });
  }, [quizResult]);

  // Past rounds, for the trend line and the by-subject bars.
  React.useEffect(() => {
    if (!kid || isDemo) { setHistory([]); return; }
    let cancelled = false;
    const load = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('quiz_results')
          .select('subject, topic, correct, total, created_at')
          .eq('kid_id', kid.id)
          .order('created_at', { ascending: true })
          .limit(40);
        if (!cancelled) setHistory((data as PastResult[]) || []);
      } catch {
        if (!cancelled) setHistory([]);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [kid?.id, isDemo]);

  const recentTopics = React.useMemo(
    () => Array.from(new Set([...(history || []).map((h) => h.topic || ''), studyParams.topic].filter(Boolean))).slice(0, 12),
    [history, studyParams.topic],
  );
  const { suggestions } = useSuggestions({ grade: kid?.grade, lang, recentTopics, customSubjects, limit: 3 });

  if (!quizResult) return null;
  const { total, correct, picks, cards, seconds } = quizResult;
  const pct = Math.round((correct / total) * 100);
  const goldStars = pct >= 90 ? 5 : pct >= 75 ? 4 : pct >= 60 ? 3 : pct >= 40 ? 2 : 1;
  const outcomes = cards.map((c, idx) => picks[idx] === c.a);
  const missed = cards.map((c, idx) => ({ c, idx })).filter(({ idx }) => !outcomes[idx]);
  const nailed = cards.map((c, idx) => ({ c, idx })).filter(({ idx }) => outcomes[idx]);

  const studySeconds = logged?.seconds ?? seconds ?? 0;
  const perQuestion = studySeconds && total ? Math.round(studySeconds / total) : 0;

  // Trend: past rounds + this one, most recent 8.
  const trendSource = [...(history || []).map((h) => ({
    pct: h.total > 0 ? Math.round((h.correct / h.total) * 100) : 0,
    label: new Date(h.created_at).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { month: 'numeric', day: 'numeric' }),
    topic: h.topic || '',
  })), { pct, label: lang === 'es' ? 'Hoy' : 'Now', topic: studyParams.topic }];
  const trend = trendSource.slice(-8).map((p, i) => ({
    label: p.label,
    value: p.pct,
    hint: `${p.topic || t('resultsRound') + ' ' + (i + 1)}: ${p.pct}%`,
  }));

  // Accuracy by subject across everything on record (this round included).
  const bySubjectMap = new Map<string, { correct: number; total: number }>();
  for (const h of history || []) {
    const key = h.subject || 'other';
    const cur = bySubjectMap.get(key) || { correct: 0, total: 0 };
    bySubjectMap.set(key, { correct: cur.correct + (h.correct || 0), total: cur.total + (h.total || 0) });
  }
  {
    const key = studyParams.subject || 'other';
    const cur = bySubjectMap.get(key) || { correct: 0, total: 0 };
    bySubjectMap.set(key, { correct: cur.correct + correct, total: cur.total + total });
  }
  const bySubject = Array.from(bySubjectMap.entries())
    .filter(([, v]) => v.total > 0)
    .map(([id, v]) => ({ label: subjectLabel(id, lang, customSubjects), value: Math.round((v.correct / v.total) * 100) }))
    .sort((a, b) => b.value - a.value);

  const startSuggestion = (s: StudySuggestion, kind: 'quiz' | 'guide') => {
    setQuizResult(null);
    if (kid) timer.start({ kidId: kid.id, subject: s.subject, topic: s.topic, activity: kind });
    setStudyParams({ ...studyParams, subject: s.subject, topic: s.topic, contentId: undefined, assignmentId: undefined, grade: kid?.grade || studyParams.grade });
    router.push(kind === 'quiz' ? '/kids/quiz' : '/kids/guide');
  };

  const goHome = () => { setQuizResult(null); router.push('/kids/home'); };

  return (
    <AppShell>
      <div className="qk-screen qk-page-enter" style={{ padding: 0, minHeight: 'calc(100dvh - 65px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px 0', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          <button onClick={goHome} className="qk-btn qk-btn-ghost">{ICONS.back} <span>{t('backHome')}</span></button>
          {kid && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 12px 4px 4px', borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--line)' }}>
              <Avatar id={kid.avatar} size={32} /><span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{kid.name}</span>
            </div>
          )}
        </div>

        <div style={{ maxWidth: 880, margin: '24px auto 0', padding: '0 22px 64px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="qk-card qk-slide-up" style={{ padding: 32, position: 'relative', overflow: 'hidden' }}>
            {/* confetti dots */}
            <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: .5 }}>
              {[...Array(18)].map((_, i) => (
                <span key={i} style={{ position: 'absolute', left: `${(i * 53) % 100}%`, top: `${(i * 37) % 80}%`, width: 8 + (i % 3) * 3, height: 8 + (i % 3) * 3, borderRadius: i % 2 ? '50%' : '4px', background: ['var(--primary)', 'var(--honey)', 'var(--coral)', 'var(--sky)'][i % 4], transform: `rotate(${i * 23}deg)`, opacity: .6, display: 'block' }} />
              ))}
            </div>

            <div style={{ position: 'relative', textAlign: 'center' }}>
              <div style={{ display: 'inline-block', position: 'relative' }}>
                {kid && <Avatar id={kid.avatar} size={120} ring={kid.color || 'var(--primary)'} />}
                <div className="qk-sticker qk-sticker-pop" style={{ position: 'absolute', right: -18, top: -10, fontSize: 14 }}>+{goldStars} ⭐</div>
              </div>
              <h1 className="qk-h1" style={{ marginTop: 14 }}>{t('resultsTitle')}</h1>
              <p className="qk-sub" style={{ margin: '6px auto 0', textAlign: 'center' }}>{studyParams.topic} · {t('resultsSub')}</p>

              {gamification !== 'minimal' && (
                <div style={{ marginTop: 18, display: 'inline-flex', gap: 6 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} style={{ color: i < goldStars ? 'var(--honey)' : 'rgba(31,51,38,.12)', display: 'inline-flex', transform: `translateY(${i < goldStars ? '0px' : '4px'})`, transition: `transform .3s ease ${i * 60}ms` }}>
                      <Ico d={<path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />} fill="currentColor" stroke="none" size={36} />
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="qk-stagger" style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, position: 'relative' }}>
              <StatCard tone="primary" icon={ICONS.check} value={`${correct}/${total}`} label={t('correctCt')} />
              <StatCard tone="honey" icon={ICONS.star} value={pct + '%'} label={t('accuracy')} />
              <StatCard tone="sky" icon={ICONS.book} value={studySeconds ? formatDuration(studySeconds, lang) : '—'} label={t('resultsTimeOnTask')} />
              <StatCard tone="coral" icon={ICONS.flame} value={perQuestion ? `${perQuestion}s` : '—'} label={lang === 'es' ? 'por pregunta' : 'per question'} />
            </div>

            {logged && (
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-3)', textAlign: 'center' }}>
                {t('savedMin')}: {formatDuration(logged.seconds, lang)} · {t('timeLog')}
              </div>
            )}

            {gamification !== 'minimal' && pct >= 60 && (
              <div className="qk-bounce-in" style={{ marginTop: 18, padding: 16, background: 'var(--honey-l)', borderRadius: 18, display: 'flex', gap: 14, alignItems: 'center', position: 'relative' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--honey)', color: '#fff', display: 'grid', placeItems: 'center' }}>{ICONS.star}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18 }}>{t('rewardEarned')}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                    {lang === 'es'
                      ? `"Explorador del cosmos" — desbloqueada al estudiar ${studyParams.topic}.`
                      : `"Cosmos explorer" — unlocked for studying ${studyParams.topic}.`}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* mastery + question-by-question */}
          <div className="qk-card" style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 1.4fr', gap: 24, alignItems: 'center' }} className="qk-results-split">
              <RingStat value={pct} label={t('resultsMastery')} sub={`${correct} / ${total} · ${studyParams.topic}`} toneName={pct >= 75 ? 'primary' : pct >= 50 ? 'honey' : 'coral'} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>{t('resultsBreakdown')}</div>
                <OutcomeStrip outcomes={outcomes} labels={{ correct: t('correct'), wrong: t('wrong') }} />
                <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ink-3)' }}>
                  {nailed.length} {t('correctCt')} · {missed.length} {lang === 'es' ? 'para repasar' : 'to review'}
                </div>
              </div>
            </div>
          </div>

          {/* trend + subjects */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>
            <div className="qk-card" style={{ padding: 24 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17 }}>{t('resultsProgress')}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', margin: '2px 0 14px' }}>{t('resultsTrendSub')}</div>
              {trend.length > 1
                ? <LineChart points={trend} unit="%" toneName="primary" />
                : <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{t('resultsNoHistory')}</div>}
            </div>

            {bySubject.length > 0 && (
              <div className="qk-card" style={{ padding: 24 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17 }}>
                  {lang === 'es' ? 'Precisión por materia' : 'Accuracy by subject'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', margin: '2px 0 14px' }}>
                  {lang === 'es' ? 'Todas tus rondas juntas' : 'All your rounds together'}
                </div>
                <HBarChart points={bySubject} unit="%" toneName="sky" max={100} />
              </div>
            )}
          </div>

          {/* review — missed first, then the ones they got */}
          <div className="qk-card" style={{ padding: 24 }}>
            <div className="qk-label" style={{ marginBottom: 10 }}>{t('review')}</div>
            {missed.length > 0 && (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--coral)', marginBottom: 8 }}>{t('resultsMissed')}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {missed.map(({ c, idx }) => (
                    <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 12px', background: 'var(--coral-l)', borderRadius: 12 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: 'var(--coral)', color: '#fff', display: 'grid', placeItems: 'center' }}>{ICONS.x}</div>
                      <div style={{ flex: 1, fontSize: 14 }}>
                        <div style={{ fontWeight: 700 }}>{c.q}</div>
                        <div style={{ marginTop: 2, color: 'var(--ink-2)', fontSize: 13 }}>
                          {lang === 'es' ? 'Respuesta:' : 'Answer:'} <strong>{c.choices[c.a]}</strong>
                          {picks[idx] != null && <> · {lang === 'es' ? 'Elegiste:' : 'You chose:'} <span style={{ color: 'var(--coral)' }}>{c.choices[picks[idx]]}</span></>}
                        </div>
                        {c.hint && <div style={{ marginTop: 4, fontSize: 13, color: 'var(--ink-3)' }}>💡 {c.hint}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {nailed.length > 0 && (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}>{t('resultsNailed')}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {nailed.map(({ c, idx }) => (
                    <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 12 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: 'var(--primary)', color: '#fff', display: 'grid', placeItems: 'center' }}>{ICONS.check}</div>
                      <div style={{ flex: 1, fontSize: 14 }}>
                        <div style={{ fontWeight: 700 }}>{c.q}</div>
                        <div style={{ marginTop: 2, color: 'var(--ink-3)', fontSize: 13 }}>
                          {lang === 'es' ? 'Respuesta:' : 'Answer:'} <strong style={{ color: 'var(--ink-2)' }}>{c.choices[c.a]}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* what to study next */}
          {suggestions.length > 0 && (
            <div className="qk-card" style={{ padding: 24 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17 }}>✨ {t('resultsStudyNext')}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', margin: '2px 0 14px' }}>{t('suggestSub')}</div>
              <SuggestionCards
                suggestions={suggestions}
                lang={lang}
                customSubjects={customSubjects}
                onLearn={(s) => startSuggestion(s, 'guide')}
                onQuiz={(s) => startSuggestion(s, 'quiz')}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Btn kind="ghost" icon={ICONS.shuffle} onClick={() => { setQuizResult(null); router.push('/kids/quiz'); }}>{t('again')}</Btn>
            <Btn kind="ghost" icon={ICONS.book} onClick={() => { setQuizResult(null); router.push('/kids/guide'); }}>{t('genGuide')}</Btn>
            <Btn kind="primary" onClick={goHome}>{t('backHome')}</Btn>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
