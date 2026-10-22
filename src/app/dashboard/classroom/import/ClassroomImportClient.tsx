'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ICONS } from '@/components/ui/Icons';
import { Avatar } from '@/components/ui/Avatar';
import { Btn } from '@/components/ui/Btn';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';
import { fromRow, kidSubjectInfo, subjectOptions } from '@/lib/subjects';
import { loadKidTopics } from '@/lib/topics';
import { defaultTargets, guessIcon, importableClasses, importClassroom, type ImportableClass, type ImportResult, type SubjectTarget } from '@/lib/classroomImport';
import type { ClassroomCourse, ClassroomCourseDetails } from '@/lib/google-classroom';
import type { KidTopic } from '@/types';

type Status = 'loading' | 'not_configured' | 'not_connected' | 'error' | 'reading' | 'ready' | 'importing' | 'done';

interface CourseRow {
  course: ClassroomCourse;
  teachers: string[];
  classes: ImportableClass[];
  /** The class details could not be read; only the subject can be imported */
  partial?: boolean;
}

const NEW = '__new';
const norm = (s: string) => s.trim().toLowerCase();

/** Runs `fn` over `items`, at most `limit` at a time */
async function eachLimited<T>(items: T[], limit: number, fn: (item: T, i: number) => Promise<void>) {
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) { const i = next++; await fn(items[i], i); }
  }));
}

export default function ClassroomImportClient() {
  const { lang, kids, activeKidId, setActiveKidId, customSubjects, isDemo, updateKid } = useStore();
  const t = useT(lang);
  const L = (en: string, es: string) => (lang === 'es' ? es : en);
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthError = searchParams.get('error');

  const [kidId, setKidId] = React.useState(searchParams.get('kid') || activeKidId || '');
  const kid = kids.find((k) => k.id === kidId) || kids[0];

  const [status, setStatus] = React.useState<Status>('loading');
  const [rows, setRows] = React.useState<CourseRow[]>([]);
  const [reading, setReading] = React.useState({ done: 0, total: 0, name: '' });
  const [targets, setTargets] = React.useState<Record<string, SubjectTarget>>({});
  const [included, setIncluded] = React.useState<Set<string>>(new Set());
  const [picked, setPicked] = React.useState<Record<string, Set<string>>>({});
  const [open, setOpen] = React.useState<Set<string>>(new Set());
  const [topics, setTopics] = React.useState<KidTopic[]>([]);
  const [progress, setProgress] = React.useState({ done: 0, total: 0 });
  const [result, setResult] = React.useState<ImportResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const backTo = kid ? `/dashboard/kid/${kid.id}` : '/dashboard';
  const signInUrl = `/api/classroom/connect?next=${encodeURIComponent(`/dashboard/classroom/import${kid ? `?kid=${kid.id}` : ''}`)}`;

  const handleStatus = (code: number) => {
    if (code === 503) setStatus('not_configured');
    else if (code === 401) setStatus('not_connected');
    else setStatus('error');
  };

  // Reads every class with its assignments and materials
  const load = React.useCallback(async () => {
    setStatus('loading');
    setError(null);
    const res = await fetch('/api/classroom/courses', { cache: 'no-store' }).catch(() => null);
    if (!res || !res.ok) return handleStatus(res?.status ?? 0);
    const courses: ClassroomCourse[] = (await res.json()).courses || [];
    setStatus('reading');
    setReading({ done: 0, total: courses.length, name: '' });
    const out: CourseRow[] = [];
    let done = 0;
    let signedOut = false;
    await eachLimited(courses, 3, async (c, i) => {
      const r = await fetch(`/api/classroom/courses/${encodeURIComponent(c.id)}`, { cache: 'no-store' }).catch(() => null);
      if (r?.status === 401) signedOut = true;
      const details: ClassroomCourseDetails | null = r?.ok ? await r.json().catch(() => null) : null;
      out[i] = details
        ? { course: details.course, teachers: details.teachers, classes: importableClasses(details, useStore.getState().lang) }
        : { course: c, teachers: [], classes: [], partial: true };
      done++;
      setReading({ done, total: courses.length, name: c.name });
    });
    if (signedOut) { setStatus('not_connected'); return; }
    setRows(out);
    setIncluded(new Set());
    setPicked({});
    setOpen(new Set());
    setStatus('ready');
  }, []);

  React.useEffect(() => { load(); }, [load]);

  // The kid's current subjects and topics, so classes already added are marked and new subjects aren't duplicated
  const refreshKid = React.useCallback(async () => {
    if (!kid) return;
    if (!isDemo) {
      const { data } = await createClient().from('kid_subjects').select('*').eq('kid_id', kid.id).order('created_at');
      if (data) updateKid(kid.id, { subjects: data.map(fromRow) });
    }
    setTopics(await loadKidTopics(useStore.getState().kids.find((k) => k.id === kid.id) || kid, isDemo).catch(() => []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kid?.id, isDemo]);

  React.useEffect(() => { refreshKid(); }, [refreshKid]);

  React.useEffect(() => {
    if (kid && rows.length) setTargets(defaultTargets(rows.map((r) => r.course), kid, useStore.getState().customSubjects));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, kid?.id]);

  const pickKid = (id: string) => {
    setKidId(id);
    setActiveKidId(id);
    router.replace(`/dashboard/classroom/import?kid=${id}`, { scroll: false });
  };

  // ---- selection ------------------------------------------------------------
  const alreadyAdded = (courseId: string, cls: ImportableClass) => {
    const target = targets[courseId];
    return target?.kind === 'existing' && topics.some((x) => x.subject === target.id && norm(x.title) === norm(cls.title));
  };
  const freshClasses = (r: CourseRow) => r.classes.filter((c) => !alreadyAdded(r.course.id, c)).map((c) => c.id);

  const toggleCourse = (r: CourseRow) => {
    const id = r.course.id;
    const on = included.has(id);
    setIncluded((s) => { const n = new Set(s); if (on) n.delete(id); else n.add(id); return n; });
    setPicked((p) => ({ ...p, [id]: new Set(on ? [] : freshClasses(r)) }));
    if (!on) setOpen((s) => new Set(s).add(id));
  };

  const setClasses = (courseId: string, ids: string[], on: boolean) => {
    setPicked((p) => {
      const n = new Set(p[courseId] || []);
      ids.forEach((x) => (on ? n.add(x) : n.delete(x)));
      return { ...p, [courseId]: n };
    });
    if (on) setIncluded((s) => new Set(s).add(courseId));
  };

  const selectAll = () => {
    setIncluded(new Set(rows.map((r) => r.course.id)));
    setPicked(Object.fromEntries(rows.map((r) => [r.course.id, new Set(freshClasses(r))])));
  };
  const clearAll = () => { setIncluded(new Set()); setPicked({}); };

  const chosen = rows.filter((r) => included.has(r.course.id));
  const classCount = chosen.reduce((n, r) => n + (picked[r.course.id]?.size || 0), 0);
  const totalClasses = rows.reduce((n, r) => n + r.classes.length, 0);

  // ---- subject choice -------------------------------------------------------
  const options = subjectOptions(lang, customSubjects);
  // custom subjects the parent deleted in Settings but the kid still has
  (kid?.subjects || []).forEach((s) => { if (s.name && !options.some((o) => o.id === s.subject)) options.push({ id: s.subject, label: s.name, icon: s.icon || '📚' }); });

  const changeTarget = (course: ClassroomCourse, value: string) => {
    setTargets((tg) => ({ ...tg, [course.id]: value === NEW ? { kind: 'new', name: course.name.trim().slice(0, 40), icon: guessIcon(course.name) } : { kind: 'existing', id: value } }));
  };

  // ---- import ---------------------------------------------------------------
  const runImport = async () => {
    if (!kid || chosen.length === 0) return;
    const plan = chosen.map((r) => ({ target: targets[r.course.id], classes: r.classes.filter((c) => picked[r.course.id]?.has(c.id)) }));
    setStatus('importing');
    setError(null);
    setProgress({ done: 0, total: classCount });
    try {
      const res = await importClassroom(kid, plan, isDemo, (done, total) => setProgress({ done, total }));
      // classes saved into a new subject now point at it, so importing more doesn't offer to create it again
      setTargets((tg) => {
        const next = { ...tg };
        chosen.forEach((r, i) => { const id = res.subjectOf[i]; if (id) next[r.course.id] = { kind: 'existing', id }; });
        return next;
      });
      setResult(res);
      setStatus('done');
      refreshKid();
      clearAll();
    } catch (e) {
      console.warn('Classroom import failed:', e);
      setError(L("The import didn't finish. Please try again.", 'La importación no terminó. Intenta de nuevo.'));
      setStatus('ready');
    }
  };

  const disconnect = async () => {
    await fetch('/api/classroom/disconnect', { method: 'POST' }).catch(() => {});
    setRows([]);
    clearAll();
    setStatus('not_connected');
  };

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(lang === 'es' ? 'es' : 'en', { month: 'short', day: 'numeric' });
  const smallBtn: React.CSSProperties = { fontSize: 13, padding: '6px 12px' };
  const check: React.CSSProperties = { width: 18, height: 18, accentColor: 'var(--primary)', flexShrink: 0, cursor: 'pointer', margin: 0 };

  return (
    <AppShell>
      <div className="qk-screen qk-page-enter">
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <Link href={backTo} className="qk-btn qk-btn-ghost">{ICONS.back}<span>{kid ? kid.name : t('back')}</span></Link>

          <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0, flex: '1 1 320px' }}>
              <span className="qk-eyebrow">Google Classroom</span>
              <h1 className="qk-h1" style={{ margin: '10px 0 0' }}>{L('Import from Google Classroom', 'Importar de Google Classroom')}</h1>
              <p className="qk-sub" style={{ margin: '6px 0 0' }}>
                {L(
                  `Each class becomes a subject and its assignments and materials become the classes inside it, ready for study guides, quizzes and tests.`,
                  `Cada clase se convierte en una materia y sus tareas y materiales en las clases de esa materia, listas para guías, quizzes y exámenes.`,
                )}
              </p>
            </div>
            {(status === 'ready' || status === 'done') && <Btn kind="ghost" onClick={disconnect}>{L('Disconnect', 'Desconectar')}</Btn>}
          </div>

          {/* kid */}
          {kids.length > 1 && status !== 'importing' && (
            <section style={{ marginTop: 22 }}>
              <div className="qk-label" style={{ marginBottom: 10, fontSize: 14 }}>{L('Import for', 'Importar para')}</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {kids.map((k) => {
                  const on = kid?.id === k.id;
                  return (
                    <button key={k.id} onClick={() => pickKid(k.id)}
                      style={{ appearance: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px 6px 6px', borderRadius: 999, border: '2px solid ' + (on ? k.color || 'var(--primary)' : 'var(--line)'), background: on ? (k.color || 'var(--primary)') + '18' : 'var(--surface)', cursor: 'pointer' }}>
                      <Avatar id={k.avatar} size={30} ring={on ? k.color : undefined} />
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: on ? (k.color || 'var(--primary)') : 'var(--ink)' }}>{k.name}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {oauthError && (status === 'not_connected' || status === 'not_configured') && (
            <Notice>
              {oauthError === 'denied'
                ? L('Google access was not granted. You can try again.', 'No se dio permiso en Google. Puedes intentarlo de nuevo.')
                : oauthError === 'not_configured'
                  ? L('Google Classroom is not set up on the server yet.', 'Google Classroom aún no está configurado en el servidor.')
                  : L("Couldn't connect to Google. Please try again.", 'No se pudo conectar con Google. Intenta de nuevo.')}
            </Notice>
          )}
          {error && <Notice>{error}</Notice>}

          {!kid && (
            <Notice>{L('Add a kid first, then import their classes.', 'Agrega primero a tu peque y luego importa sus clases.')}</Notice>
          )}

          {status === 'loading' && <p style={{ marginTop: 28, color: 'var(--ink-3)' }}>{L('Loading…', 'Cargando…')}</p>}

          {status === 'not_configured' && (
            <Notice>
              {L('Google Classroom is not set up on the server yet (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are missing).',
                'La conexión con Google Classroom aún no está configurada en el servidor (faltan GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET).')}
            </Notice>
          )}

          {status === 'error' && (
            <Notice>
              {L("Couldn't load classes.", 'No se pudieron cargar las clases.')}{' '}
              <button onClick={load} style={{ appearance: 'none', border: 0, background: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer', fontWeight: 700 }}>{L('Retry', 'Reintentar')}</button>
            </Notice>
          )}

          {status === 'not_connected' && kid && (
            <section className="qk-card" style={{ marginTop: 24, padding: 28, textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, margin: '0 auto', borderRadius: 16, background: 'var(--primary-l)', color: 'var(--primary)', display: 'grid', placeItems: 'center' }}>
                <div style={{ transform: 'scale(1.5)' }}>{ICONS.book}</div>
              </div>
              <div style={{ marginTop: 14, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20 }}>
                {L(`Sign in with ${kid.name}'s school account`, `Inicia sesión con la cuenta escolar de ${kid.name}`)}
              </div>
              <p style={{ margin: '6px auto 0', maxWidth: 480, fontSize: 14, color: 'var(--ink-2)' }}>
                {L('Use the Google account they open Classroom with. Read-only: we never post, submit, or change anything in Classroom.',
                  'Usa la cuenta de Google con la que abre Classroom. Solo lectura: nunca publicamos, entregamos ni cambiamos nada en Classroom.')}
              </p>
              <div style={{ marginTop: 18 }}>
                <Btn kind="primary" icon={ICONS.plus} onClick={() => { window.location.href = signInUrl; }}>{L('Sign in with Google', 'Iniciar sesión con Google')}</Btn>
              </div>
            </section>
          )}

          {status === 'reading' && (
            <section className="qk-card" style={{ marginTop: 24, padding: 24 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18 }}>{L('Reading the classes…', 'Leyendo las clases…')}</div>
              <div style={{ marginTop: 4, fontSize: 13, color: 'var(--ink-3)' }}>
                {reading.total ? `${reading.done} / ${reading.total}${reading.name ? ' · ' + reading.name : ''}` : ''}
              </div>
              <div className="qk-progress" style={{ marginTop: 14 }}>
                <span style={{ width: `${reading.total ? Math.max(6, Math.round((reading.done / reading.total) * 100)) : 6}%`, transition: 'width .3s' }} />
              </div>
            </section>
          )}

          {status === 'ready' && kid && rows.length === 0 && (
            <p style={{ marginTop: 28, color: 'var(--ink-3)' }}>{L('This Google account has no active classes.', 'Esta cuenta de Google no tiene clases activas.')}</p>
          )}

          {status === 'ready' && kid && rows.length > 0 && (
            <>
              <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 14, color: 'var(--ink-2)' }}>
                  {L(`${rows.length} classes · ${totalClasses} assignments and materials. Pick what to import.`, `${rows.length} clases · ${totalClasses} tareas y materiales. Elige qué importar.`)}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="qk-btn qk-btn-ghost" style={smallBtn} onClick={selectAll}>{L('Select all', 'Elegir todo')}</button>
                  {chosen.length > 0 && <button className="qk-btn qk-btn-ghost" style={smallBtn} onClick={clearAll}>{L('Clear', 'Quitar todo')}</button>}
                </div>
              </div>

              <div style={{ marginTop: 14, display: 'grid', gap: 12 }}>
                {rows.map((r) => {
                  const id = r.course.id;
                  const on = included.has(id);
                  const target = targets[id];
                  const mine = picked[id] || new Set<string>();
                  const isOpen = open.has(id);
                  const units = r.classes.reduce<{ unit: string; items: ImportableClass[] }[]>((acc, c) => {
                    const unit = c.unit || '';
                    const g = acc.find((x) => x.unit === unit);
                    if (g) g.items.push(c); else acc.push({ unit, items: [c] });
                    return acc;
                  }, []);
                  return (
                    <div key={id} className="qk-card" style={{ padding: 16, border: '1.5px solid ' + (on ? 'var(--primary)' : 'var(--line)'), display: 'grid', gap: 12 }}>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                        <input type="checkbox" checked={on} onChange={() => toggleCourse(r)} style={{ ...check, marginTop: 4 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, overflowWrap: 'anywhere' }}>{r.course.name}</div>
                          <div style={{ marginTop: 2, fontSize: 12, color: 'var(--ink-3)', display: 'flex', gap: '2px 10px', flexWrap: 'wrap' }}>
                            {r.course.section && <span>{r.course.section}</span>}
                            {r.teachers.length > 0 && <span>{r.teachers.join(', ')}</span>}
                            <span>{r.partial ? L("Couldn't read its posts", 'No se pudieron leer sus publicaciones') : L(`${r.classes.length} ${r.classes.length === 1 ? 'class' : 'classes'}`, `${r.classes.length} ${r.classes.length === 1 ? 'clase' : 'clases'}`)}</span>
                            {on && <span style={{ color: 'var(--primary-d)', fontWeight: 700 }}>{L(`${mine.size} selected`, `${mine.size} elegidas`)}</span>}
                          </div>
                        </div>
                      </label>

                      {/* subject it goes to */}
                      {target && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingLeft: 30 }}>
                          <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{L('Save as subject', 'Guardar como materia')}</span>
                          <select value={target.kind === 'new' ? NEW : target.id} onChange={(e) => changeTarget(r.course, e.target.value)}
                            style={{ fontSize: 13, padding: '6px 8px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', maxWidth: '100%' }}>
                            {options.map((o) => <option key={o.id} value={o.id}>{o.icon} {o.label}</option>)}
                            <option value={NEW}>＋ {L('New subject', 'Materia nueva')}</option>
                          </select>
                          {target.kind === 'new' && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 200px', minWidth: 0 }}>
                              <span style={{ fontSize: 18 }}>{target.icon}</span>
                              <input className="qk-input" value={target.name} maxLength={40} aria-label={L('New subject name', 'Nombre de la materia nueva')}
                                onChange={(e) => setTargets((tg) => ({ ...tg, [id]: { ...target, name: e.target.value } }))}
                                style={{ fontSize: 13, padding: '6px 10px', borderRadius: 10, minWidth: 0 }} />
                            </span>
                          )}
                        </div>
                      )}

                      {r.classes.length > 0 && (
                        <div style={{ paddingLeft: 30 }}>
                          <button onClick={() => setOpen((s) => { const n = new Set(s); if (isOpen) n.delete(id); else n.add(id); return n; })}
                            style={{ appearance: 'none', border: 0, background: 'none', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--primary-d)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ display: 'inline-flex', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}>{ICONS.next}</span>
                            {isOpen ? L('Hide classes', 'Ocultar clases') : L(`Show classes (${r.classes.length})`, `Ver clases (${r.classes.length})`)}
                          </button>
                          {isOpen && (
                            <div style={{ marginTop: 10, display: 'grid', gap: 12 }}>
                              {units.map((g) => {
                                const ids = g.items.filter((c) => !alreadyAdded(id, c)).map((c) => c.id);
                                const allOn = ids.length > 0 && ids.every((x) => mine.has(x));
                                return (
                                  <div key={g.unit || '—'} style={{ display: 'grid', gap: 6 }}>
                                    {(units.length > 1 || g.unit) && (
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                        <div className="qk-label" style={{ fontSize: 12 }}>{g.unit || L('Other posts', 'Otras publicaciones')}</div>
                                        {ids.length > 1 && (
                                          <button onClick={() => setClasses(id, ids, !allOn)} style={{ appearance: 'none', border: 0, background: 'none', padding: 0, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textDecoration: 'underline' }}>
                                            {allOn ? L('Unselect unit', 'Quitar unidad') : L('Select unit', 'Elegir unidad')}
                                          </button>
                                        )}
                                      </div>
                                    )}
                                    {g.items.map((c) => {
                                      const added = alreadyAdded(id, c);
                                      const cOn = mine.has(c.id);
                                      return (
                                        <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: 'var(--surface-2)', cursor: 'pointer', flexWrap: 'wrap' }}>
                                          <input type="checkbox" checked={cOn} onChange={() => setClasses(id, [c.id], !cOn)} style={check} />
                                          <span style={{ flex: '1 1 180px', minWidth: 0 }}>
                                            <span style={{ display: 'block', fontSize: 14, fontWeight: 600, overflowWrap: 'anywhere' }}>{c.title}</span>
                                            <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                                              {c.kind === 'assignment' ? L('Assignment', 'Tarea') : L('Material', 'Material')}
                                              {c.date ? ` · ${c.kind === 'assignment' && c.date ? L('Due', 'Entrega') + ' ' : ''}${fmtDate(c.date)}` : ''}
                                            </span>
                                          </span>
                                          {added && <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: 'var(--primary-l)', color: 'var(--primary-d)' }}>{L('Already added', 'Ya agregada')}</span>}
                                        </label>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="qk-card" style={{ position: 'sticky', bottom: 16, marginTop: 18, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', boxShadow: '0 10px 30px rgba(0,0,0,.12)' }}>
                <div style={{ flex: '1 1 200px', fontSize: 14, color: 'var(--ink-2)' }}>
                  {chosen.length === 0
                    ? L('Nothing selected yet.', 'Aún no hay nada elegido.')
                    : L(`${chosen.length} ${chosen.length === 1 ? 'subject' : 'subjects'} · ${classCount} ${classCount === 1 ? 'class' : 'classes'} for ${kid.name}`,
                      `${chosen.length} ${chosen.length === 1 ? 'materia' : 'materias'} · ${classCount} ${classCount === 1 ? 'clase' : 'clases'} para ${kid.name}`)}
                </div>
                <Btn kind="primary" icon={ICONS.plus} className="qk-full-sm" disabled={chosen.length === 0} style={{ opacity: chosen.length ? 1 : .5 }} onClick={runImport}>{L('Import', 'Importar')}</Btn>
              </div>
            </>
          )}

          {status === 'importing' && (
            <section className="qk-card" style={{ marginTop: 24, padding: 24 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18 }}>{L('Importing…', 'Importando…')}</div>
              <div style={{ marginTop: 4, fontSize: 13, color: 'var(--ink-3)' }}>{progress.total ? `${progress.done} / ${progress.total}` : L('Creating the subjects…', 'Creando las materias…')}</div>
              <div className="qk-progress" style={{ marginTop: 14 }}>
                <span style={{ width: `${progress.total ? Math.max(6, Math.round((progress.done / progress.total) * 100)) : 6}%`, transition: 'width .3s' }} />
              </div>
            </section>
          )}

          {status === 'done' && kid && result && (
            <section className="qk-card qk-bounce-in" style={{ marginTop: 24, padding: 24, display: 'grid', gap: 14 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22 }}>
                  {L(`Imported into ${kid.name}'s subjects`, `Importado en las materias de ${kid.name}`)} 🎉
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--ink-2)' }}>
                  {L('Open a subject to create a study guide, quiz, worksheet or test from its classes.', 'Abre una materia para crear una guía, quiz, hoja de práctica o examen con sus clases.')}
                </p>
              </div>
              {result.failed > 0 && (
                <Notice>{L(`${result.failed} could not be saved. Import again to retry them.`, `${result.failed} no se pudieron guardar. Importa de nuevo para reintentarlas.`)}</Notice>
              )}
              <div style={{ display: 'grid', gap: 8 }}>
                {result.subjects.map((s) => {
                  const info = kidSubjectInfo(kid.subjects, s.id, lang, customSubjects);
                  return (
                    <Link key={s.id} href={`/dashboard/kid/${kid.id}/subject/${encodeURIComponent(s.id)}`} className="qk-card-interactive"
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, background: 'var(--surface-2)', textDecoration: 'none', color: 'inherit' }}>
                      <span style={{ fontSize: 22 }}>{info.icon}</span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>{info.label}</span>
                        <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{L(`${s.added} ${s.added === 1 ? 'class' : 'classes'} added`, `${s.added} ${s.added === 1 ? 'clase agregada' : 'clases agregadas'}`)}</span>
                      </span>
                      <span style={{ color: 'var(--ink-3)' }}>{ICONS.next}</span>
                    </Link>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Btn kind="primary" onClick={() => router.push(`/dashboard/kid/${kid.id}`)}>{L(`Go to ${kid.name}`, `Ir a ${kid.name}`)}</Btn>
                <Btn kind="ghost" onClick={() => { setResult(null); setStatus('ready'); }}>{L('Import more', 'Importar más')}</Btn>
              </div>
            </section>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 14, background: 'var(--coral-l)', color: 'var(--coral)', fontWeight: 600 }}>
      {children}
    </div>
  );
}
