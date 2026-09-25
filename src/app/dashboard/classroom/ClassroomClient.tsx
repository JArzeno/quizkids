'use client';
import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ICONS } from '@/components/ui/Icons';
import { Btn } from '@/components/ui/Btn';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import type { ClassroomCourse, ClassroomCourseDetails, ClassroomItem } from '@/lib/google-classroom';

type Status = 'loading' | 'not_configured' | 'not_connected' | 'ready' | 'error';

/** Best-effort mapping of a Classroom course name to one of our subjects */
function guessSubject(name: string, fallback: string) {
  const n = name.toLowerCase();
  if (/math|matem|álgebra|algebra|geometr|fraccion|fraction/.test(n)) return 'math';
  if (/scien|cienc|biolog|chem|quím|physic|físic/.test(n)) return 'sci';
  if (/social|histor|geograf|civic|cívic/.test(n)) return 'soc';
  if (/art|music|músic|dibujo|draw/.test(n)) return 'art';
  if (/english|inglés|spanish|español|lengua|reading|lectura|writing|french|francés|language/.test(n)) return 'lang';
  return fallback;
}

export default function ClassroomClient() {
  const { lang, kids, activeKidId, studyParams, setStudyParams, difficulty } = useStore();
  const t = useT(lang);
  const es = lang === 'es';
  const router = useRouter();
  const searchParams = useSearchParams();
  const kid = kids.find((k) => k.id === activeKidId) || kids[0];

  const [status, setStatus] = React.useState<Status>('loading');
  const [courses, setCourses] = React.useState<ClassroomCourse[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [details, setDetails] = React.useState<ClassroomCourseDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const oauthError = searchParams.get('error');

  const handleStatus = (code: number) => {
    if (code === 503) setStatus('not_configured');
    else if (code === 401) setStatus('not_connected');
    else setStatus('error');
  };

  const loadCourses = React.useCallback(async () => {
    setStatus('loading');
    const res = await fetch('/api/classroom/courses', { cache: 'no-store' }).catch(() => null);
    if (!res || !res.ok) return handleStatus(res?.status ?? 0);
    const data = await res.json();
    setCourses(data.courses || []);
    setStatus('ready');
  }, []);

  React.useEffect(() => { loadCourses(); }, [loadCourses]);

  const openCourse = async (id: string) => {
    setSelectedId(id);
    setDetails(null);
    setError(null);
    setDetailsLoading(true);
    try {
      const res = await fetch(`/api/classroom/courses/${encodeURIComponent(id)}`, { cache: 'no-store' });
      if (res.status === 401 || res.status === 503) return handleStatus(res.status);
      if (!res.ok) throw new Error();
      setDetails(await res.json());
    } catch {
      setError(es ? 'No se pudieron cargar los detalles de la clase.' : "Couldn't load the class details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const disconnect = async () => {
    await fetch('/api/classroom/disconnect', { method: 'POST' }).catch(() => {});
    setCourses([]);
    setSelectedId(null);
    setDetails(null);
    setStatus('not_connected');
  };

  const studyItem = (item: ClassroomItem) => {
    if (!details) return;
    const c = details.course;
    const lines = [
      `Class: ${c.name}${c.section ? ` (${c.section})` : ''}`,
      item.topic ? `Unit: ${item.topic}` : '',
      `${item.kind === 'assignment' ? 'Assignment' : item.kind === 'material' ? 'Class material' : 'Teacher announcement'}: ${item.title}`,
      item.text && item.text !== item.title ? `\n${item.text}` : '',
      item.materials.length ? `\nAttached resources:\n- ${item.materials.map((m) => m.title).join('\n- ')}` : '',
    ].filter(Boolean);
    setStudyParams({
      subject: guessSubject(c.name, studyParams.subject),
      topic: item.title.slice(0, 120),
      grade: kid?.grade || studyParams.grade,
      difficulty,
      lang,
      source: lines.join('\n'),
    });
    router.push('/dashboard/generate');
  };

  const selected = courses.find((c) => c.id === selectedId);

  return (
    <AppShell>
      <div className="qk-screen qk-page-enter">
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <button className="qk-btn qk-btn-ghost" onClick={() => (selectedId ? setSelectedId(null) : router.push('/dashboard/picker'))}>{ICONS.back} <span>{t('back')}</span></button>

          <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <h1 className="qk-h1" style={{ margin: 0 }}>Google Classroom</h1>
              <p className="qk-sub" style={{ margin: '6px 0 0' }}>
                {es
                  ? 'Conecta la cuenta escolar de tu peque para ver sus clases, tareas y anuncios, y crear material de estudio de cualquiera de ellos.'
                  : "Connect your kid's school account to see their classes, assignments, and announcements, and build study material from any of them."}
              </p>
            </div>
            {status === 'ready' && <Btn kind="ghost" onClick={disconnect}>{es ? 'Desconectar' : 'Disconnect'}</Btn>}
          </div>

          {oauthError && status !== 'ready' && (
            <Notice>
              {oauthError === 'denied'
                ? (es ? 'No se dio permiso en Google. Puedes intentarlo de nuevo.' : 'Google access was not granted. You can try again.')
                : (es ? 'No se pudo conectar con Google. Intenta de nuevo.' : "Couldn't connect to Google. Please try again.")}
            </Notice>
          )}
          {error && <Notice>{error}</Notice>}

          {status === 'loading' && <p style={{ marginTop: 28, color: 'var(--ink-3)' }}>{es ? 'Cargando…' : 'Loading…'}</p>}

          {status === 'not_configured' && (
            <Notice>
              {es
                ? 'La conexión con Google Classroom aún no está configurada en el servidor (faltan GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET).'
                : 'Google Classroom is not set up on the server yet (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are missing).'}
            </Notice>
          )}

          {status === 'error' && (
            <Notice>
              {es ? 'No se pudieron cargar las clases.' : "Couldn't load classes."}{' '}
              <button onClick={loadCourses} style={{ appearance: 'none', border: 0, background: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer', fontWeight: 700 }}>{es ? 'Reintentar' : 'Retry'}</button>
            </Notice>
          )}

          {status === 'not_connected' && (
            <section className="qk-card" style={{ marginTop: 28, padding: 28, textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, margin: '0 auto', borderRadius: 16, background: 'var(--primary-l)', color: 'var(--primary)', display: 'grid', placeItems: 'center' }}>
                <div style={{ transform: 'scale(1.5)' }}>{ICONS.book}</div>
              </div>
              <div style={{ marginTop: 14, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20 }}>
                {es ? 'Conectar Google Classroom' : 'Connect Google Classroom'}
              </div>
              <p style={{ margin: '6px auto 0', maxWidth: 480, fontSize: 14, color: 'var(--ink-2)' }}>
                {es
                  ? 'Solo lectura. Nunca publicamos, entregamos ni cambiamos nada en Classroom.'
                  : 'Read-only. We never post, submit, or change anything in Classroom.'}
              </p>
              <div style={{ marginTop: 18 }}>
                <Btn kind="primary" icon={ICONS.plus} onClick={() => { window.location.href = '/api/classroom/connect'; }}>
                  {es ? 'Iniciar sesión con Google' : 'Sign in with Google'}
                </Btn>
              </div>
            </section>
          )}

          {status === 'ready' && !selectedId && (
            <section style={{ marginTop: 28 }}>
              <div className="qk-label" style={{ marginBottom: 12, fontSize: 14 }}>{es ? 'Clases' : 'Classes'}</div>
              {courses.length === 0 ? (
                <p style={{ color: 'var(--ink-3)' }}>{es ? 'Esta cuenta no tiene clases activas.' : 'This account has no active classes.'}</p>
              ) : (
                <div className="qk-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                  {courses.map((c) => (
                    <button key={c.id} onClick={() => openCourse(c.id)} className="qk-card qk-card-interactive"
                      style={{ appearance: 'none', textAlign: 'left', padding: 18, cursor: 'pointer', border: '1px solid var(--line)' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: 'var(--ink)' }}>{c.name}</div>
                      {(c.section || c.room) && (
                        <div style={{ marginTop: 4, fontSize: 13, color: 'var(--ink-3)' }}>{[c.section, c.room && `${es ? 'Aula' : 'Room'} ${c.room}`].filter(Boolean).join(' · ')}</div>
                      )}
                      {c.descriptionHeading && <div style={{ marginTop: 8, fontSize: 13, color: 'var(--ink-2)' }}>{c.descriptionHeading}</div>}
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {status === 'ready' && selectedId && (
            <section style={{ marginTop: 24 }}>
              {detailsLoading && <p style={{ color: 'var(--ink-3)' }}>{es ? 'Cargando clase…' : 'Loading class…'} {selected?.name}</p>}
              {details && (
                <>
                  <div className="qk-card" style={{ padding: 22 }}>
                    <span className="qk-eyebrow">{es ? 'Clase' : 'Class'}</span>
                    <h2 className="qk-h2" style={{ marginTop: 8 }}>{details.course.name}</h2>
                    <div style={{ marginTop: 6, fontSize: 14, color: 'var(--ink-2)', display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
                      {details.course.section && <span>{details.course.section}</span>}
                      {details.course.room && <span>{es ? 'Aula' : 'Room'} {details.course.room}</span>}
                      {details.teachers.length > 0 && <span>{es ? 'Maestro/a' : 'Teacher'}: {details.teachers.join(', ')}</span>}
                    </div>
                    {(details.course.descriptionHeading || details.course.description) && (
                      <p style={{ marginTop: 12, fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                        {[details.course.descriptionHeading, details.course.description].filter(Boolean).join('\n')}
                      </p>
                    )}
                    {details.topics.length > 0 && (
                      <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {details.topics.map((tp) => <span key={tp} className="qk-chip">{tp}</span>)}
                      </div>
                    )}
                    {details.course.alternateLink && (
                      <a href={details.course.alternateLink} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 14, fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>
                        {es ? 'Abrir en Classroom' : 'Open in Classroom'} ↗
                      </a>
                    )}
                  </div>

                  <ItemList title={es ? 'Tareas' : 'Assignments'} items={details.assignments} es={es} onStudy={studyItem} />
                  <ItemList title={es ? 'Materiales' : 'Materials'} items={details.materials} es={es} onStudy={studyItem} />
                  <ItemList title={es ? 'Anuncios' : 'Announcements'} items={details.announcements} es={es} onStudy={studyItem} />

                  {!details.assignments.length && !details.materials.length && !details.announcements.length && (
                    <p style={{ marginTop: 20, color: 'var(--ink-3)' }}>{es ? 'Esta clase aún no tiene publicaciones.' : 'This class has no posts yet.'}</p>
                  )}
                </>
              )}
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

function ItemList({ title, items, es, onStudy }: { title: string; items: ClassroomItem[]; es: boolean; onStudy: (i: ClassroomItem) => void }) {
  if (!items.length) return null;
  const fmt = (iso: string) => new Date(iso).toLocaleDateString(es ? 'es' : 'en', { month: 'short', day: 'numeric' });
  return (
    <div style={{ marginTop: 22 }}>
      <div className="qk-label" style={{ marginBottom: 10, fontSize: 14 }}>{title} · {items.length}</div>
      <div style={{ display: 'grid', gap: 10 }}>
        {items.map((it) => (
          <div key={it.id} className="qk-card" style={{ padding: 16, display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16 }}>{it.title}</div>
              <div style={{ marginTop: 2, fontSize: 12, color: 'var(--ink-3)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {it.topic && <span>{it.topic}</span>}
                {it.due && <span style={{ color: new Date(it.due) < new Date() ? 'var(--ink-3)' : 'var(--coral)', fontWeight: 700 }}>{es ? 'Entrega' : 'Due'} {fmt(it.due)}</span>}
                {!it.due && it.created && <span>{fmt(it.created)}</span>}
                {typeof it.maxPoints === 'number' && <span>{it.maxPoints} pts</span>}
              </div>
              {it.text && (it.kind !== 'announcement' || it.text.length > it.title.length) && (
                <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.45, whiteSpace: 'pre-line', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{it.text}</p>
              )}
              {it.materials.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {it.materials.map((m, i) => (
                    <a key={i} href={m.url} target="_blank" rel="noopener noreferrer" className="qk-chip" style={{ fontSize: 12, textDecoration: 'none' }}>
                      {m.kind === 'youtube' ? '▶' : m.kind === 'form' ? '☑' : m.kind === 'link' ? '🔗' : '📄'} {m.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
            <Btn kind="soft" icon={ICONS.spark} onClick={() => onStudy(it)}>{es ? 'Estudiar esto' : 'Study this'}</Btn>
          </div>
        ))}
      </div>
    </div>
  );
}
