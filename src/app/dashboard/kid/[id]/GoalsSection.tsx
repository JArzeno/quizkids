'use client';
import React from 'react';
import { ICONS } from '@/components/ui/Icons';
import { Btn } from '@/components/ui/Btn';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';
import { subjectOptions } from '@/lib/subjects';
import { goalCandidates, goalProgress, requestGoalDraft, saveGoal } from '@/lib/goals';
import { loadKidTopics } from '@/lib/topics';
import type { GoalDraft, Kid, KidGoal, KidTopic } from '@/types';

interface QuizLike { subject: string | null; topic: string | null; correct: number | null; total: number | null; created_at?: string }

/** `topics` are the goal's topics in study order */
interface Form { subject: string; goalId: string | null; title: string; topics: string[]; weeks: number }

const MAX_GOAL_TOPICS = 8;

/**
 * `only` limits the section to one subject (used on the subject page). Goals are built from the topics and classes the
 * parent added: pass `topics` when they are already loaded, otherwise the section loads them itself.
 */
export default function GoalsSection({ kid, quizzes, only, topics: topicsProp }: { kid: Kid; quizzes: QuizLike[]; only?: string; topics?: KidTopic[] }) {
  const { lang, isDemo, updateKid, customSubjects } = useStore();
  const t = useT(lang);
  const goals = kid.goals || [];
  const subjects = (kid.subjects || []).filter((s) => !only || s.subject === only);
  const options = subjectOptions(lang, customSubjects);

  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<Form | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const autoCompleted = React.useRef(new Set<string>());
  const [loadedTopics, setLoadedTopics] = React.useState<KidTopic[] | null>(null);
  React.useEffect(() => {
    if (topicsProp) return;
    let cancelled = false;
    loadKidTopics(kid, isDemo).then((list) => { if (!cancelled) setLoadedTopics(list); }).catch((e) => { console.warn('Could not load topics:', e); if (!cancelled) setLoadedTopics([]); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kid.id, isDemo, !!topicsProp]);
  const topics = topicsProp ?? loadedTopics ?? [];
  const topicsReady = !!topicsProp || loadedTopics !== null;
  /** Topics the parent added to a subject, newest first */
  const addedTopics = (subject: string) => topics.filter((x) => x.subject === subject).map((x) => x.title);

  // Always read the latest goals from the store inside async handlers
  const latestGoals = () => useStore.getState().kids.find((k) => k.id === kid.id)?.goals || [];
  const setGoals = (list: KidGoal[]) => updateKid(kid.id, { goals: list });

  const propose = async (subject: string) => {
    const available = goalCandidates(latestGoals(), subject, topics);
    if (available.length === 0) { setError(addedTopics(subject).length === 0 ? t('goalNoTopics') : t('goalNoTopicsLeft')); return false; }
    setBusy(subject); setError(null);
    const draft = await requestGoalDraft({ ...kid, goals: latestGoals() }, subject, lang, customSubjects, available);
    if (!draft) { setError(t('goalErrorGen')); setBusy(null); return false; }
    const saved = await saveGoal(kid.id, subject, draft, 'proposed', isDemo, latestGoals());
    if (!saved) { setError(t('goalErrorSave')); setBusy(null); return false; }
    setGoals([...latestGoals().filter((g) => !(g.subject === subject && g.status === 'proposed')), saved]);
    setBusy(null);
    return true;
  };

  const approve = async (goal: KidGoal) => {
    if (latestGoals().some((g) => g.subject === goal.subject && g.status === 'active')) return;
    setBusy(goal.subject); setError(null);
    const targetDate = goal.weeks ? new Date(Date.now() + goal.weeks * 7 * 86400000).toISOString().slice(0, 10) : undefined;
    if (!isDemo) {
      const { error: e } = await createClient().from('kid_goals')
        .update({ status: 'active', approved_at: new Date().toISOString(), target_date: targetDate ?? null }).eq('id', goal.id);
      if (e) { setError(t('goalErrorSave')); setBusy(null); return; }
    }
    setGoals(latestGoals().map((g) => g.id === goal.id ? { ...g, status: 'active', targetDate } : g));
    setBusy(null);
  };

  const remove = async (goal: KidGoal) => {
    setError(null);
    if (!isDemo) {
      const { error: e } = await createClient().from('kid_goals').delete().eq('id', goal.id);
      if (e) { setError(t('goalErrorSave')); return; }
    }
    setGoals(latestGoals().filter((g) => g.id !== goal.id));
  };

  const complete = async (goal: KidGoal) => {
    setBusy(goal.subject); setError(null);
    const completedAt = new Date().toISOString();
    if (!isDemo) {
      const { error: e } = await createClient().from('kid_goals').update({ status: 'completed', completed_at: completedAt }).eq('id', goal.id);
      if (e) { setError(t('goalErrorSave')); setBusy(null); return; }
    }
    setGoals(latestGoals().map((g) => g.id === goal.id ? { ...g, status: 'completed', completedAt } : g));
    // Build the next goal from the remaining topics right away, unless one is already waiting
    if (!latestGoals().some((g) => g.subject === goal.subject && g.status === 'proposed')) {
      if (goalCandidates(latestGoals(), goal.subject, topics).length === 0) setNotice(t('goalNoMoreTopics'));
      else if (await propose(goal.subject)) setNotice(t('goalNext'));
    }
    setBusy(null);
  };

  const openForm = (subject: string, goal?: KidGoal) =>
    setForm({ subject, goalId: goal?.id ?? null, title: goal?.title ?? '', topics: goal?.topics ?? [], weeks: goal?.weeks ?? 2 });

  const submitForm = async () => {
    if (!form) return;
    const title = form.title.trim();
    const picked = form.topics.slice(0, MAX_GOAL_TOPICS);
    if (!title || picked.length === 0) return;
    setBusy(form.subject); setError(null);
    const weeks = Math.min(8, Math.max(1, form.weeks || 2));
    if (form.goalId) {
      if (!isDemo) {
        const { error: e } = await createClient().from('kid_goals').update({ title, topics: picked, weeks }).eq('id', form.goalId);
        if (e) { setError(t('goalErrorSave')); setBusy(null); return; }
      }
      setGoals(latestGoals().map((g) => g.id === form.goalId ? { ...g, title, topics: picked, weeks } : g));
    } else {
      const hasActive = latestGoals().some((g) => g.subject === form.subject && g.status === 'active');
      const draft: GoalDraft = { title, topics: picked, weeks };
      const saved = await saveGoal(kid.id, form.subject, draft, hasActive ? 'proposed' : 'active', isDemo, latestGoals());
      if (!saved) { setError(t('goalErrorSave')); setBusy(null); return; }
      setGoals([...latestGoals().filter((g) => !(hasActive && g.subject === form.subject && g.status === 'proposed')), saved]);
    }
    setForm(null); setBusy(null);
  };

  // A goal whose topics are all mastered and whose final test is passed completes itself and the next one is suggested
  React.useEffect(() => {
    goals.filter((g) => g.status === 'active' && (!only || g.subject === only)).forEach((g) => {
      const gp = goalProgress(g, quizzes);
      if (autoCompleted.current.has(g.id) || gp.pct < 100 || !gp.testPassed) return;
      autoCompleted.current.add(g.id);
      void complete(g);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goals, quizzes]);

  const inputStyle: React.CSSProperties = { fontSize: 13 };

  return (
    <div className="qk-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>{only ? t('goalTitleLabel') : t('goalsTitle')}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{t('goalsSub')}</div>
      </div>
      {error && <div style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--coral-l)', color: 'var(--coral)', fontWeight: 600, fontSize: 13 }}>{error}</div>}
      {notice && <div style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--primary-l)', color: 'var(--primary-d)', fontWeight: 600, fontSize: 13 }}>{notice}</div>}
      {subjects.length === 0 && <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{t('goalPickSubjects')}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: only ? '1fr' : 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', gap: 12 }}>
        {subjects.map((ks) => {
          const info = options.find((o) => o.id === ks.subject) || { id: ks.subject, label: ks.subject, icon: '📚' };
          const active = goals.find((g) => g.subject === ks.subject && g.status === 'active');
          const proposed = goals.find((g) => g.subject === ks.subject && g.status === 'proposed');
          const doneCount = goals.filter((g) => g.subject === ks.subject && g.status === 'completed').length;
          const working = busy === ks.subject;
          const editing = form?.subject === ks.subject;
          const prog = active ? goalProgress(active, quizzes) : null;

          return (
            <div key={ks.subject} style={{ padding: 14, background: 'var(--surface-2)', borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(!only || doneCount > 0) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {!only && <span style={{ fontSize: 20 }}>{info.icon}</span>}
                  <div style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>{only ? '' : info.label}</div>
                  {doneCount > 0 && <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>✓ {doneCount} {t('goalDoneCount')}</span>}
                </div>
              )}

              {editing && form ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  <label style={{ fontSize: 12, color: 'var(--ink-3)' }}>{t('goalTitleLabel')}
                    <input className="qk-input" value={form.title} maxLength={120} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} />
                  </label>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{t('goalTopicsLabel')}
                    {(() => {
                      // The topics added to the subject, plus any topic this goal already has that is no longer in that list
                      const names = [...addedTopics(ks.subject).reverse(), ...form.topics.filter((n) => !addedTopics(ks.subject).some((a) => a.toLowerCase() === n.toLowerCase()))];
                      if (names.length === 0) return <div style={{ marginTop: 6, fontSize: 13 }}>{topicsReady ? t('goalNoTopics') : t('goalWorking')}</div>;
                      return (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                          {names.map((name) => {
                            const idx = form.topics.findIndex((n) => n.toLowerCase() === name.toLowerCase());
                            const on = idx >= 0;
                            return (
                              <button key={name} type="button" className={`qk-chip${on ? ' on' : ''}`} disabled={!on && form.topics.length >= MAX_GOAL_TOPICS}
                                onClick={() => setForm({ ...form, topics: on ? form.topics.filter((_, i) => i !== idx) : [...form.topics, name] })}>
                                {on ? `${idx + 1}. ` : ''}{name}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                  <label style={{ fontSize: 12, color: 'var(--ink-3)' }}>{t('goalWeeksLabel')}
                    <input className="qk-input" type="number" min={1} max={8} value={form.weeks} onChange={(e) => setForm({ ...form, weeks: parseInt(e.target.value, 10) || 1 })} style={{ ...inputStyle, width: 90 }} />
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Btn kind="primary" onClick={submitForm} disabled={working || !form.title.trim() || form.topics.length === 0}>{t('goalSave')}</Btn>
                    <button className="qk-btn qk-btn-ghost" onClick={() => setForm(null)}>{t('cancel')}</button>
                  </div>
                </div>
              ) : (
                <>
                  {active && prog && (
                    <div style={{ display: 'grid', gap: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{active.title}</div>
                      {active.description && <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{active.description}</div>}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-3)', marginBottom: 5 }}>
                          <span>{prog.mastered.length}/{active.topics.length} {t('goalTopicsDone')}{active.targetDate ? ` · ${t('goalDue')} ${new Date(active.targetDate + 'T00:00').toLocaleDateString(lang === 'es' ? 'es-DO' : 'en-US', { month: 'short', day: 'numeric' })}` : ''}</span>
                          <span>{prog.pct}%</span>
                        </div>
                        <div className="qk-progress"><span style={{ width: prog.pct + '%' }} /></div>
                      </div>
                      {prog.testAttempted && !prog.testPassed && <div style={{ fontSize: 12, fontWeight: 700, color: '#7C5410' }}>{t('goalReviewing')}</div>}
                      {prog.pct === 100 && !prog.testAttempted && <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-d)' }}>{t('goalReady')}</div>}
                      <div style={{ display: 'grid', gap: 3, fontSize: 12 }}>
                        {active.topics.map((tp) => (
                          <div key={tp} style={{ color: prog.mastered.includes(tp) ? 'var(--primary-d)' : 'var(--ink-2)' }}>{prog.mastered.includes(tp) ? '✓' : '○'} {tp}</div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button className="qk-btn qk-btn-ghost" style={{ fontSize: 12, padding: '6px 10px' }} onClick={() => complete(active)} disabled={working || (prog.testAttempted && !prog.testPassed)}>{ICONS.check}<span>{t('goalComplete')}</span></button>
                        <button className="qk-btn qk-btn-ghost" style={{ fontSize: 12, padding: '6px 10px' }} onClick={() => openForm(ks.subject, active)}>{t('goalEdit')}</button>
                        <button className="qk-btn qk-btn-ghost" style={{ fontSize: 12, padding: '6px 10px' }} onClick={() => remove(active)}>{ICONS.trash}<span>{t('goalDelete')}</span></button>
                      </div>
                    </div>
                  )}

                  {proposed && (
                    <div style={{ display: 'grid', gap: 8, padding: 12, borderRadius: 12, background: 'var(--honey-l)' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#7C5410' }}>{t('goalProposed')}</div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{proposed.title}</div>
                      {proposed.description && <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{proposed.description}</div>}
                      <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{proposed.topics.join(' · ')}{proposed.weeks ? ` · ${proposed.weeks} ${t('goalWeeksLabel').toLowerCase()}` : ''}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {!active && <Btn kind="primary" onClick={() => approve(proposed)} disabled={working}>{t('goalApprove')}</Btn>}
                        <button className="qk-btn qk-btn-ghost" style={{ fontSize: 12, padding: '6px 10px' }} onClick={() => openForm(ks.subject, proposed)}>{t('goalEdit')}</button>
                        <button className="qk-btn qk-btn-ghost" style={{ fontSize: 12, padding: '6px 10px' }} onClick={() => propose(ks.subject)} disabled={working}>{working ? t('goalWorking') : t('goalRegenerate')}</button>
                        <button className="qk-btn qk-btn-ghost" style={{ fontSize: 12, padding: '6px 10px' }} onClick={() => remove(proposed)}>{t('goalDiscard')}</button>
                      </div>
                    </div>
                  )}

                  {!active && !proposed && (
                    <>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{topicsReady && addedTopics(ks.subject).length === 0 ? t('goalNoTopics') : t('goalNone')}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Btn kind="primary" icon={ICONS.spark} onClick={() => propose(ks.subject)} disabled={working || !topicsReady || goalCandidates(goals, ks.subject, topics).length === 0}>{working ? t('goalWorking') : t('goalGenerate')}</Btn>
                        <button className="qk-btn qk-btn-ghost" style={{ fontSize: 13 }} onClick={() => openForm(ks.subject)}>{t('goalAdd')}</button>
                      </div>
                    </>
                  )}
                  {active && !proposed && (
                    <button className="qk-btn qk-btn-ghost" style={{ fontSize: 12, padding: '6px 10px', alignSelf: 'flex-start' }} onClick={() => propose(ks.subject)} disabled={working || !topicsReady || goalCandidates(goals, ks.subject, topics).length === 0}>
                      {working ? t('goalWorking') : t('goalGenerate')}
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
