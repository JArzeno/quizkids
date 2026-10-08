'use client';
import React from 'react';
import { ICONS } from '@/components/ui/Icons';
import { Btn } from '@/components/ui/Btn';
import { useStore } from '@/lib/store';
import { subjectOptions, levelLabel } from '@/lib/subjects';
import { goalProgress } from '@/lib/goals';
import { addManualItem, dateKey, isWeekday, loadKidPlanItems, regenerateToday } from '@/lib/plan';
import type { Kid, PlanItem } from '@/types';

interface QuizLike { subject: string | null; topic: string | null; correct: number | null; total: number | null; created_at: string }
interface SessionLike { minutes: number | null; started_at: string | null }

const DAY_MS = 86400000;

function mondayOf(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

export default function PlanSection({ kid, quizzes, sessions }: { kid: Kid; quizzes: QuizLike[]; sessions: SessionLike[] }) {
  const { lang, isDemo, updateKid, customSubjects } = useStore();
  const L = (en: string, es: string) => (lang === 'es' ? es : en);
  const options = subjectOptions(lang, customSubjects);
  const label = (id: string) => options.find((o) => o.id === id) || { id, label: id, icon: '📚' };
  const subjects = kid.subjects || [];
  const goals = kid.goals || [];

  const [items, setItems] = React.useState<PlanItem[]>(kid.planItems || []);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<{ subject: string; topic: string; type: 'guide' | 'quiz' | 'pdf' } | null>(null);
  const [copied, setCopied] = React.useState(false);

  const load = React.useCallback(async () => {
    if (isDemo) { setItems(kid.planItems || []); return; }
    setItems(await loadKidPlanItems(kid.id));
  }, [kid.id, isDemo, kid.planItems]);
  React.useEffect(() => { void load(); }, [load]);

  const today = new Date();
  const todayKey = dateKey(today);
  const monday = mondayOf(today);
  const week = Array.from({ length: 5 }, (_, i) => new Date(monday.getTime() + i * DAY_MS));
  const dayItems = (key: string) => items.filter((i) => i.planDate === key && i.status !== 'skipped').sort((a, b) => a.position - b.position);
  const todayPending = dayItems(todayKey).filter((i) => i.goalId && i.status === 'pending');
  const pausedSubjects = new Set(subjects.filter((s) => s.paused).map((s) => s.subject));

  const typeLabel = (i: PlanItem) =>
    (i.review ? L('Review · ', 'Repaso · ') : '') + (i.type === 'guide' ? L('Guide', 'Guía') : i.type === 'pdf' ? L('Worksheet', 'Hoja') : i.type === 'test' ? L('Final test', 'Prueba final') : 'Quiz');

  const regenerate = async () => {
    setBusy(true); setMsg(null);
    try {
      const next = await regenerateToday(kid, isDemo);
      if (isDemo) updateKid(kid.id, { planItems: next });
      setItems(next);
      setMsg(L("Today's plan was refreshed.", 'El plan de hoy fue renovado.'));
    } catch {
      setMsg(L("Couldn't refresh today's plan.", 'No pudimos renovar el plan de hoy.'));
    }
    setBusy(false);
  };

  const submitManual = async () => {
    if (!form || !form.topic.trim()) return;
    setBusy(true); setMsg(null);
    const item = await addManualItem(kid, { subject: form.subject, topic: form.topic.trim(), type: form.type }, isDemo);
    if (item) {
      const next = [...items, item];
      setItems(next);
      if (isDemo) updateKid(kid.id, { planItems: next });
      setForm(null);
      setMsg(L("Added to today's plan.", 'Agregado al plan de hoy.'));
    } else setMsg(L("Couldn't add it. Please try again.", 'No pudimos agregarlo. Intenta de nuevo.'));
    setBusy(false);
  };

  // ---- weekly summary (last 7 days) ------------------------------------------
  const since = Date.now() - 7 * DAY_MS;
  const weekSessions = sessions.filter((s) => s.started_at && new Date(s.started_at).getTime() >= since);
  const minutes = weekSessions.reduce((a, s) => a + (s.minutes || 0), 0);
  const studyDays = new Set(weekSessions.map((s) => dateKey(new Date(s.started_at!)))).size;
  const weekPlan = items.filter((i) => i.planDate && new Date(i.planDate + 'T00:00').getTime() >= since && i.status !== 'skipped');
  const planDone = weekPlan.filter((i) => i.status === 'completed').length;
  const weekQuizzes = quizzes.filter((q) => new Date(q.created_at).getTime() >= since && (q.total || 0) > 0);
  const avg = weekQuizzes.length ? Math.round(weekQuizzes.reduce((a, q) => a + ((q.correct || 0) / (q.total || 1)) * 100, 0) / weekQuizzes.length) : null;
  const activeGoals = goals.filter((g) => g.status === 'active').map((g) => ({ g, p: goalProgress(g, quizzes) }));
  const weak = subjects.flatMap((s) => (s.weakTopics || []).slice(0, 3));
  const strong = subjects.flatMap((s) => (s.strongTopics || []).slice(0, 3));

  const summaryText = () => {
    const lines = [
      L(`${kid.name}: last 7 days`, `${kid.name}: últimos 7 días`),
      L(`Studied ${minutes} min on ${studyDays} day(s).`, `Estudió ${minutes} min en ${studyDays} día(s).`),
      weekPlan.length ? L(`Plan: ${planDone} of ${weekPlan.length} items done.`, `Plan: ${planDone} de ${weekPlan.length} actividades listas.`) : '',
      avg != null ? L(`Quizzes: ${weekQuizzes.length}, average ${avg}%.`, `Quizzes: ${weekQuizzes.length}, promedio ${avg}%.`) : '',
      ...activeGoals.map(({ g, p }) => `${label(g.subject).icon} ${g.title}: ${p.pct}%`),
      ...subjects.filter((s) => s.level != null).map((s) => `${label(s.subject).icon} ${label(s.subject).label}: ${levelLabel(s.level!, lang)}`),
      strong.length ? L(`Strong: ${strong.join(', ')}.`, `Fuerte en: ${strong.join(', ')}.`) : '',
      weak.length ? L(`Needs practice: ${weak.join(', ')}.`, `Necesita práctica: ${weak.join(', ')}.`) : '',
    ];
    return lines.filter(Boolean).join('\n');
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(summaryText()); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard blocked */ }
  };

  // Next items waiting in each active goal's queue
  const upNext = goals.filter((g) => g.status === 'active').map((g) => ({
    g,
    next: items.filter((i) => i.goalId === g.id && i.status === 'pending' && i.planDate !== todayKey).sort((a, b) => a.position - b.position).slice(0, 3),
  })).filter((x) => x.next.length > 0);

  const chip: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 9px', borderRadius: 999, fontSize: 12, fontWeight: 600 };
  const smallBtn: React.CSSProperties = { fontSize: 12, padding: '6px 10px' };

  return (
    <div className="qk-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>{L("This week's plan", 'Plan de la semana')}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{L('Each weekday is handed out when your child opens the app.', 'Cada día de la semana se asigna cuando tu peque abre la app.')}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="qk-btn qk-btn-ghost" style={smallBtn} onClick={() => setForm(form ? null : { subject: subjects[0]?.subject || '', topic: '', type: 'quiz' })} disabled={subjects.length === 0}>{ICONS.plus}<span>{L("Add to today", 'Agregar a hoy')}</span></button>
          <button className="qk-btn qk-btn-ghost" style={smallBtn} onClick={regenerate} disabled={busy || !isWeekday(today) || todayPending.length === 0}>{ICONS.spark}<span>{L('Refresh today', 'Renovar hoy')}</span></button>
        </div>
      </div>

      {msg && <div style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--surface-2)', fontSize: 13, fontWeight: 600 }}>{msg}</div>}
      {pausedSubjects.size > 0 && (
        <div style={{ fontSize: 12, color: '#7C5410' }}>⏸ {L('Paused: ', 'En pausa: ')}{Array.from(pausedSubjects).map((id) => label(id).label).join(', ')}</div>
      )}

      {form && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', padding: 12, background: 'var(--surface-2)', borderRadius: 14 }}>
          <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="qk-input" style={{ width: 'auto', fontSize: 13 }}>
            {subjects.map((s) => <option key={s.subject} value={s.subject}>{label(s.subject).icon} {label(s.subject).label}</option>)}
          </select>
          <input className="qk-input" value={form.topic} maxLength={100} placeholder={L('Topic, e.g. Adding fractions', 'Tema, ej. Suma de fracciones')} onChange={(e) => setForm({ ...form, topic: e.target.value })} style={{ flex: 1, minWidth: 180, fontSize: 13 }} />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'guide' | 'quiz' | 'pdf' })} className="qk-input" style={{ width: 'auto', fontSize: 13 }}>
            <option value="quiz">Quiz</option><option value="guide">{L('Guide', 'Guía')}</option><option value="pdf">{L('Worksheet', 'Hoja')}</option>
          </select>
          <Btn kind="primary" onClick={submitManual} disabled={busy || !form.topic.trim()}>{L('Add', 'Agregar')}</Btn>
        </div>
      )}

      <div style={{ display: 'grid', gap: 8 }}>
        {week.map((d) => {
          const key = dateKey(d);
          const list = dayItems(key);
          const isToday = key === todayKey;
          const future = d.getTime() > today.getTime() && !isToday;
          return (
            <div key={key} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 12px', borderRadius: 12, background: isToday ? 'var(--primary-l)' : 'var(--surface-2)' }}>
              <div style={{ width: 62, flexShrink: 0, fontSize: 12, fontWeight: 700, color: isToday ? 'var(--primary-d)' : 'var(--ink-3)' }}>
                {d.toLocaleDateString(lang === 'es' ? 'es-DO' : 'en-US', { weekday: 'short' })}
                <div style={{ fontWeight: 400 }}>{d.toLocaleDateString(lang === 'es' ? 'es-DO' : 'en-US', { month: 'short', day: 'numeric' })}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                {list.length === 0 && <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{future ? L('Handed out when the day starts', 'Se asigna cuando empieza el día') : L('No plan', 'Sin plan')}</span>}
                {list.map((i) => (
                  <span key={i.id} style={{ ...chip, background: i.status === 'completed' ? 'var(--primary-l)' : 'var(--surface)', color: i.status === 'completed' ? 'var(--primary-d)' : 'var(--ink-2)', border: '1px solid var(--line)' }}>
                    {i.status === 'completed' ? '✓' : '○'} {label(i.subject).icon} {i.topic} · {typeLabel(i)}{!i.goalId ? ' ✋' : ''}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {upNext.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>{L('Coming up', 'Lo que sigue')}</div>
          <div style={{ display: 'grid', gap: 4, fontSize: 12, color: 'var(--ink-2)' }}>
            {upNext.map(({ g, next }) => (
              <div key={g.id}>{label(g.subject).icon} {next.map((i) => `${i.topic} (${typeLabel(i)})`).join(' → ')}</div>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: 14, borderRadius: 14, background: 'var(--honey-l)', display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>{L('Weekly summary', 'Resumen semanal')} · {L('last 7 days', 'últimos 7 días')}</div>
          <button className="qk-btn qk-btn-ghost" style={smallBtn} onClick={copy}>{copied ? L('Copied', 'Copiado') : L('Copy', 'Copiar')}</button>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13 }}>
          <span><strong>{minutes}</strong> min · {studyDays} {L('days', 'días')}</span>
          {weekPlan.length > 0 && <span><strong>{planDone}/{weekPlan.length}</strong> {L('plan items done', 'actividades listas')}</span>}
          {avg != null && <span><strong>{weekQuizzes.length}</strong> quizzes · {avg}%</span>}
        </div>
        {activeGoals.map(({ g, p }) => (
          <div key={g.id} style={{ fontSize: 12 }}>{label(g.subject).icon} {g.title} · <strong>{p.pct}%</strong></div>
        ))}
        {strong.length > 0 && <div style={{ fontSize: 12 }}>💪 {strong.join(', ')}</div>}
        {weak.length > 0 && <div style={{ fontSize: 12 }}>🎯 {weak.join(', ')}</div>}
      </div>
    </div>
  );
}
