'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ICONS } from '@/components/ui/Icons';
import { Avatar } from '@/components/ui/Avatar';
import { Btn } from '@/components/ui/Btn';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import type { ImportedLesson } from '@/types';

const SUBJECTS = [
  { id: 'sci', icon: '🔬' }, { id: 'math', icon: '➗' }, { id: 'lang', icon: '📖' }, { id: 'soc', icon: '🌎' }, { id: 'art', icon: '🎨' },
];
const MAX_FILES = 6;
const MAX_PDF_BYTES = 15 * 1024 * 1024;
const MAX_IMAGE_SIDE = 1600;

interface PickedFile {
  id: string;
  name: string;
  kind: 'image' | 'pdf';
  dataUrl: string;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

/** Downscale photos (phone pictures are huge) so uploads stay fast and under limits */
async function compressImage(file: File): Promise<string> {
  const src = await readAsDataUrl(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = src;
  });
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return src;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.85);
}

export default function ImportClient() {
  const { lang, kids, activeKidId, setActiveKidId, studyParams, setStudyParams, difficulty, importedLesson, setImportedLesson } = useStore();
  const t = useT(lang);
  const router = useRouter();
  const kid = kids.find((k) => k.id === activeKidId) || kids[0];
  const es = lang === 'es';

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
    const incoming = Array.from(list);
    const room = MAX_FILES - files.length;
    if (incoming.length > room) setError(es ? `Máximo ${MAX_FILES} archivos.` : `Up to ${MAX_FILES} files.`);
    const next: PickedFile[] = [];
    for (const f of incoming.slice(0, Math.max(0, room))) {
      try {
        if (f.type === 'application/pdf') {
          if (f.size > MAX_PDF_BYTES) { setError(es ? 'El PDF es muy grande (máx. 15 MB).' : 'PDF is too large (max 15 MB).'); continue; }
          next.push({ id: crypto.randomUUID(), name: f.name, kind: 'pdf', dataUrl: await readAsDataUrl(f) });
        } else if (f.type.startsWith('image/')) {
          next.push({ id: crypto.randomUUID(), name: f.name, kind: 'image', dataUrl: await compressImage(f) });
        } else {
          setError(es ? 'Solo se aceptan PDF o imágenes.' : 'Only PDF or image files are supported.');
        }
      } catch {
        setError(es ? `No se pudo leer ${f.name}.` : `Could not read ${f.name}.`);
      }
    }
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
      const res = await fetch('/api/import/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: files.map(({ name, dataUrl }) => ({ name, dataUrl })), grade, lang, hint: hint.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 422) throw new Error(es ? 'No encontramos contenido de clase legible. Prueba con una foto más clara.' : "We couldn't find readable class content. Try a clearer photo.");
        if (res.status === 413) throw new Error(es ? 'Los archivos son muy grandes.' : 'Files are too large.');
        throw new Error(es ? 'No se pudo analizar. Intenta de nuevo.' : 'Analysis failed. Please try again.');
      }
      setProgress(100);
      setLesson(data as ImportedLesson);
      setImportedLesson(data as ImportedLesson);
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

  const createMaterials = () => {
    if (!lesson) return;
    const keyPoints = lesson.keyPoints.length ? `\n\nKey points:\n- ${lesson.keyPoints.join('\n- ')}` : '';
    const vocab = lesson.vocabulary.length ? `\n\nVocabulary:\n${lesson.vocabulary.map((v) => `- ${v.term}: ${v.def}`).join('\n')}` : '';
    setStudyParams({
      subject: lesson.subject,
      topic: lesson.title.trim() || (es ? 'Mi clase' : 'My class'),
      grade,
      difficulty,
      lang,
      source: lesson.notes + keyPoints + vocab,
    });
    router.push('/dashboard/generate');
  };

  return (
    <AppShell>
      <div className="qk-screen qk-page-enter">
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <button className="qk-btn qk-btn-ghost" onClick={() => router.push('/dashboard/picker')}>{ICONS.back} <span>{t('back')}</span></button>

          <div style={{ marginTop: 18 }}>
            <h1 className="qk-h1" style={{ margin: 0 }}>{es ? 'Importar una clase' : 'Import a class'}</h1>
            <p className="qk-sub" style={{ margin: '6px 0 0' }}>
              {es
                ? 'Sube un PDF o fotos del cuaderno, la tarea o el libro. Entendemos el tema y creamos guías, exámenes y hojas de práctica de esa misma clase.'
                : 'Upload a PDF or photos of notes, homework, or a textbook page. We figure out the topic and build guides, tests, and worksheets from that exact class.'}
            </p>
          </div>

          {/* kid assignment */}
          {kids.length > 0 && (
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

                <div className="qk-label" style={{ marginTop: 16, marginBottom: 8, fontSize: 14 }}>{t('subject')}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {SUBJECTS.map((s) => {
                    const on = lesson.subject === s.id;
                    return (
                      <button key={s.id} onClick={() => updateLesson({ subject: s.id })}
                        style={{ appearance: 'none', padding: '8px 14px', borderRadius: 999, border: '1.5px solid ' + (on ? 'var(--primary)' : 'var(--line)'), background: on ? 'var(--primary-l)' : 'var(--surface)', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>
                        {s.icon} {t(s.id)}
                      </button>
                    );
                  })}
                </div>

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
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
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
                <Btn kind="primary" iconRight={ICONS.next} onClick={createMaterials} disabled={!lesson.title.trim()} style={{ opacity: lesson.title.trim() ? 1 : .5 }}>
                  {es ? 'Crear guía, examen o PDF' : 'Create guide, test, or PDF'}
                </Btn>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
