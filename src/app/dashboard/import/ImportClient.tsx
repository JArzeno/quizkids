'use client';
import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ICONS } from '@/components/ui/Icons';
import { Avatar } from '@/components/ui/Avatar';
import { Btn } from '@/components/ui/Btn';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { kidSubjectInfo, subjectOptions } from '@/lib/subjects';
import { addTopic, lessonNotes } from '@/lib/topics';
import { MAX_CLASS_FILES as MAX_FILES, analyzeClassFiles, readClassFiles, type PickedFile } from '@/lib/classFiles';
import type { ImportedLesson } from '@/types';

export default function ImportClient() {
  const { lang, kids, activeKidId, setActiveKidId, studyParams, setStudyParams, difficulty, importedLesson, setImportedLesson, customSubjects, isDemo, updateKid } = useStore();
  const t = useT(lang);
  const router = useRouter();
  const kid = kids.find((k) => k.id === activeKidId) || kids[0];
  const es = lang === 'es';
  // Opened from a subject's page: the class is added to that subject
  const fixedSubject = useSearchParams().get('subject');
  const [saving, setSaving] = React.useState(false);

  const [files, setFiles] = React.useState<PickedFile[]>([]);
  const [hint, setHint] = React.useState('');
  const [analyzing, setAnalyzing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [lesson, setLesson] = React.useState<ImportedLesson | null>(importedLesson);
  const [dragOver, setDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const grade = kid?.grade || studyParams.grade;

  const addFiles = async (list: FileList | File[]) => {
    setError(null);
    const { files: next, error: readError } = await readClassFiles(list, MAX_FILES - files.length, lang);
    setError(readError);
    setFiles((prev) => [...prev, ...next]);
  };

  const analyze = async () => {
    if (!files.length) return;
    setAnalyzing(true);
    setError(null);
    setProgress(8);
    let p = 8;
    const interval = setInterval(() => {
      p = Math.min(p + Math.random() * 6 + 2, 90);
      setProgress(p);
    }, 400);

    try {
      const data = await analyzeClassFiles(files, { grade, lang, hint });
      setProgress(100);
      setLesson(data);
      setImportedLesson(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      clearInterval(interval);
      setAnalyzing(false);
    }
  };

  const updateLesson = (patch: Partial<ImportedLesson>) => {
    if (!lesson) return;
    const next = { ...lesson, ...patch };
    setLesson(next);
    setImportedLesson(next);
  };

  const startOver = () => {
    setLesson(null);
    setImportedLesson(null);
    setFiles([]);
    setHint('');
    setError(null);
  };

  const subject = fixedSubject || lesson?.subject || '';
  const subjectLabel = kidSubjectInfo(kid?.subjects, subject, lang, customSubjects).label;
  const backTo = !kid ? '/dashboard' : fixedSubject ? `/dashboard/kid/${kid.id}/subject/${encodeURIComponent(fixedSubject)}` : `/dashboard/kid/${kid.id}`;

  /** Saves the class as a topic of the subject (with its notes), then opens the subject or the generator */
  const saveClass = async (then: 'subject' | 'create') => {
    if (!lesson || !kid || !subject) return;
    const title = lesson.title.trim() || (es ? 'Mi clase' : 'My class');
    const notes = lessonNotes(lesson);
    setSaving(true);
    setError(null);
    const existing = isDemo ? kid.topics || [] : [];
    const saved = await addTopic(kid.id, subject, { title, notes, source: 'import' }, isDemo, existing);
    setSaving(false);
    if (!saved) { setError(es ? 'No pudimos guardar la clase. Intenta de nuevo.' : "Couldn't save the class. Please try again."); return; }
    if (isDemo) updateKid(kid.id, { topics: [...existing.filter((x) => x.id !== saved.id), saved] });
    setImportedLesson(null);
    if (then === 'subject') { router.push(`/dashboard/kid/${kid.id}/subject/${encodeURIComponent(subject)}`); return; }
    const ks = kid.subjects?.find((x) => x.subject === subject);
    setStudyParams({ ...studyParams, subject, topic: saved.title, grade, difficulty, lang, contentLang: ks?.lang, source: notes, contentId: undefined, assignmentId: undefined, planItemId: undefined, returnTo: undefined, topics: undefined, pairedContentId: undefined });
    router.push('/dashboard/generate');
  };

  return (
    <AppShell>
      <div className="qk-screen qk-page-enter">
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <button className="qk-btn qk-btn-ghost" onClick={() => router.push(backTo)}>{ICONS.back} <span>{t('back')}</span></button>

          <div style={{ marginTop: 18 }}>
            {fixedSubject && kid && <span className="qk-eyebrow">{kid.name} · {subjectLabel}</span>}
            <h1 className="qk-h1" style={{ margin: fixedSubject ? '10px 0 0' : 0 }}>{es ? 'Importar una clase' : 'Import a class'}</h1>
            <p className="qk-sub" style={{ margin: '6px 0 0' }}>
              {es
                ? 'Sube un PDF o fotos del cuaderno, la tarea o el libro. Entendemos el tema y creamos guías, exámenes y hojas de práctica de esa misma clase.'
                : 'Upload a PDF or photos of notes, homework, or a textbook page. We figure out the topic and build guides, tests, and worksheets from that exact class.'}
            </p>
          </div>

          {/* kid assignment */}
          {kids.length > 0 && !fixedSubject && (
            <section style={{ marginTop: 24 }}>
              <div className="qk-label" style={{ marginBottom: 10, fontSize: 14 }}>{es ? 'Para' : 'For'}</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {kids.map((k) => {
                  const on = (kid?.id ?? '') === k.id;
                  return (
                    <button key={k.id} onClick={() => setActiveKidId(k.id)}
                      style={{ appearance: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px 8px 8px', borderRadius: 999, border: '2px solid ' + (on ? k.color || 'var(--primary)' : 'var(--line)'), background: on ? (k.color || 'var(--primary)') + '18' : 'var(--surface)', cursor: 'pointer', transition: 'all .15s ease' }}>
                      <Avatar id={k.avatar} size={32} ring={on ? k.color : undefined} />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: on ? (k.color || 'var(--primary)') : 'var(--ink)' }}>{k.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{es ? 'Grado ' : 'Grade '}{k.grade}</div>
                      </div>
                      {on && <span style={{ marginLeft: 4, color: k.color || 'var(--primary)' }}>{ICONS.check}</span>}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {error && (
            <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 14, background: 'var(--coral-l)', color: 'var(--coral)', fontWeight: 600 }}>
              {error}
            </div>
          )}

          {!lesson ? (
            <>
              {/* upload */}
              <section style={{ marginTop: 28 }}>
                <div className="qk-label" style={{ marginBottom: 12, fontSize: 14 }}>{es ? 'Material de la clase' : 'Class material'}</div>
                <div
                  onClick={() => !analyzing && inputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); if (!analyzing) addFiles(e.dataTransfer.files); }}
                  style={{ padding: '32px 20px', borderRadius: 18, border: '2px dashed ' + (dragOver ? 'var(--primary)' : 'var(--line)'), background: dragOver ? 'var(--primary-l)' : 'var(--surface)', textAlign: 'center', cursor: analyzing ? 'default' : 'pointer', transition: 'all .15s ease' }}>
                  <div style={{ width: 56, height: 56, margin: '0 auto', borderRadius: 16, background: 'var(--honey-l)', color: 'var(--honey)', display: 'grid', placeItems: 'center' }}>
                    <div style={{ transform: 'scale(1.5)' }}>{ICONS.pdf}</div>
                  </div>
                  <div style={{ marginTop: 12, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18 }}>
                    {es ? 'Toca para subir o arrastra aquí' : 'Tap to upload or drop files here'}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 13, color: 'var(--ink-3)' }}>
                    {es ? `PDF o fotos (JPG, PNG) · hasta ${MAX_FILES} archivos` : `PDF or photos (JPG, PNG) · up to ${MAX_FILES} files`}
                  </div>
                  <input ref={inputRef} type="file" accept="application/pdf,image/*" multiple hidden
                    onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} />
                </div>

                {files.length > 0 && (
                  <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                    {files.map((f) => (
                      <div key={f.id} className="qk-card" style={{ padding: 8, position: 'relative' }}>
                        <div style={{ height: 100, borderRadius: 10, overflow: 'hidden', background: 'var(--surface-2)', display: 'grid', placeItems: 'center', color: 'var(--coral)' }}>
                          {f.kind === 'image'
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={f.dataUrl} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <div style={{ transform: 'scale(2)' }}>{ICONS.pdf}</div>}
                        </div>
                        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</div>
                        {!analyzing && (
                          <button aria-label={es ? 'Quitar' : 'Remove'} onClick={() => setFiles((prev) => prev.filter((x) => x.id !== f.id))}
                            style={{ position: 'absolute', top: 12, right: 12, width: 26, height: 26, borderRadius: 999, border: 'none', background: 'var(--surface)', color: 'var(--ink)', display: 'grid', placeItems: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
                            {ICONS.x}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section style={{ marginTop: 22 }}>
                <div className="qk-label" style={{ marginBottom: 10, fontSize: 14 }}>{es ? '¿De qué trata? (opcional)' : "What's it about? (optional)"}</div>
                <input className="qk-input" style={{ width: '100%' }} value={hint} onChange={(e) => setHint(e.target.value)} disabled={analyzing}
                  placeholder={es ? 'ej. Fracciones equivalentes, examen el viernes' : 'e.g. Equivalent fractions, test on Friday'} />
              </section>

              <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16 }}>
                {analyzing && (
                  <div style={{ flex: 1, maxWidth: 360 }}>
                    <div className="qk-progress"><span style={{ width: progress + '%', transition: 'width .3s ease' }} /></div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>{es ? 'Leyendo la clase…' : 'Reading the class…'}</div>
                  </div>
                )}
                <Btn kind="primary" icon={ICONS.spark} onClick={analyze} disabled={!files.length || analyzing} style={{ opacity: files.length && !analyzing ? 1 : .5 }}>
                  {es ? 'Analizar clase' : 'Analyze class'}
                </Btn>
              </div>
            </>
          ) : (
            <>
              {/* analysis result */}
              <section className="qk-card" style={{ marginTop: 28, padding: 22 }}>
                <span className="qk-eyebrow">{es ? 'Esto es lo que entendimos' : "Here's what we understood"}</span>
                <div className="qk-label" style={{ marginTop: 16, marginBottom: 8, fontSize: 14 }}>{t('topic')}</div>
                <input className="qk-input" style={{ width: '100%', fontSize: 18, fontWeight: 600 }} value={lesson.title} onChange={(e) => updateLesson({ title: e.target.value })} />

                {!fixedSubject && (
                  <>
                    <div className="qk-label" style={{ marginTop: 16, marginBottom: 8, fontSize: 14 }}>{t('subject')}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {subjectOptions(lang, customSubjects).map((s) => {
                        const on = lesson.subject === s.id;
                        return (
                          <button key={s.id} onClick={() => updateLesson({ subject: s.id })}
                            style={{ appearance: 'none', padding: '8px 14px', borderRadius: 999, border: '1.5px solid ' + (on ? 'var(--primary)' : 'var(--line)'), background: on ? 'var(--primary-l)' : 'var(--surface)', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>
                            {s.icon} {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                <p style={{ marginTop: 18, fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.5 }}>{lesson.summary}</p>

                {lesson.keyPoints.length > 0 && (
                  <>
                    <div className="qk-label" style={{ marginTop: 16, marginBottom: 8, fontSize: 14 }}>{es ? 'Ideas clave' : 'Key ideas'}</div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {lesson.keyPoints.map((kp, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14 }}>
                          <span style={{ color: 'var(--primary)', marginTop: 1 }}>{ICONS.check}</span>
                          <span>{kp}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {lesson.vocabulary.length > 0 && (
                  <>
                    <div className="qk-label" style={{ marginTop: 18, marginBottom: 8, fontSize: 14 }}>{es ? 'Vocabulario' : 'Vocabulary'}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))', gap: 8 }}>
                      {lesson.vocabulary.map((v, i) => (
                        <div key={i} style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--surface-2)', fontSize: 13 }}>
                          <strong style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>{v.term}</strong>
                          <div style={{ color: 'var(--ink-2)', marginTop: 2 }}>{v.def}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </section>

              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <Btn kind="ghost" icon={ICONS.shuffle} onClick={startOver}>{es ? 'Importar otra clase' : 'Import another class'}</Btn>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <Btn kind="ghost" icon={ICONS.spark} onClick={() => saveClass('create')} disabled={saving || !kid || !lesson.title.trim()}>
                    {es ? 'Agregar y crear guía o examen' : 'Add and create a guide or test'}
                  </Btn>
                  <Btn kind="primary" icon={ICONS.plus} onClick={() => saveClass('subject')} disabled={saving || !kid || !lesson.title.trim()} style={{ opacity: kid && lesson.title.trim() ? 1 : .5 }}>
                    {es ? `Agregar a ${subjectLabel}` : `Add to ${subjectLabel}`}
                  </Btn>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
