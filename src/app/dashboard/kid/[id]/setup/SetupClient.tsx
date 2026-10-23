'use client';
import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ICONS } from '@/components/ui/Icons';
import { Avatar } from '@/components/ui/Avatar';
import { Btn } from '@/components/ui/Btn';
import { LoadingBar } from '@/components/ui/LoadingBar';
import { CustomSubjectAdder } from '@/components/ui/CustomSubjectAdder';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';
import { subjectOptions, subjectInfo, subjectLabelFields, fromRow, type SubjectOption } from '@/lib/subjects';
import { addTopic, lessonNotes, loadKidTopics, removeTopic } from '@/lib/topics';
import { MAX_CLASS_FILES, analyzeClassFiles, readClassFiles } from '@/lib/classFiles';
import type { Kid, KidSubject, KidTopic } from '@/types';

const norm = (s: string) => s.trim().toLowerCase();
const smallBtn: React.CSSProperties = { fontSize: 13, padding: '6px 10px' };
// Reading a class out of photos usually takes this long
const READ_MS = 15000;

/** What a photo upload is for: more material for a class on the list, or a new class named from the photos */
interface PhotoTarget { subject: string; topic?: KidTopic }

/**
 * First-time setup of a kid's school year: the subjects, the classes of each one, and a few photos of those classes
 * so generated content follows what the kid learns at school. Everything is saved as the parent goes, so leaving
 * halfway keeps what was added; the subject pages take over from here as the year moves on.
 */
export default function SetupClient() {
  const params = useParams<{ id: string }>();
  const kidId = typeof params?.id === 'string' ? params.id : '';
  const { lang, kids, isDemo, updateKid, customSubjects } = useStore();
  const t = useT(lang);
  const L = (en: string, es: string) => (lang === 'es' ? es : en);
  const router = useRouter();

  const kid: Kid | undefined = kids.find((k) => k.id === kidId);
  const subjects: KidSubject[] = kid?.subjects || [];
  const subjectChoices = subjectOptions(lang, customSubjects);

  // 0 = the path, 1..n = one subject each, n + 1 = done
  const [step, setStep] = React.useState(0);
  // Every class of the kid, newest first
  const [topics, setTopics] = React.useState<KidTopic[]>([]);
  const topicsRef = React.useRef<KidTopic[]>([]);
  const [loading, setLoading] = React.useState(!isDemo);
  const [error, setError] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState('');
  const [adding, setAdding] = React.useState(false);
  const [addingSubject, setAddingSubject] = React.useState(false);
  // Class whose photos are being read: a topic id, or 'new:<subject>' while a new class is named from photos
  const [reading, setReading] = React.useState<string | null>(null);
  // What the photos of each class turned out to cover, from this visit
  const [summaries, setSummaries] = React.useState<Record<string, string>>({});
  const fileRef = React.useRef<HTMLInputElement>(null);
  const photoTarget = React.useRef<PhotoTarget | null>(null);

  const saveTopics = (next: KidTopic[]) => {
    topicsRef.current = next;
    setTopics(next);
    // Demo mode keeps topics on the kid, oldest first
    if (isDemo) updateKid(kidId, { topics: [...next].reverse() });
  };

  React.useEffect(() => {
    if (!kidId) { setLoading(false); return; }
    if (isDemo) {
      const list = [...(useStore.getState().kids.find((k) => k.id === kidId)?.topics || [])].reverse();
      topicsRef.current = list;
      setTopics(list);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const [subjRes, list] = await Promise.all([
          createClient().from('kid_subjects').select('*').eq('kid_id', kidId).order('created_at'),
          loadKidTopics({ id: kidId }, false),
        ]);
        if (cancelled) return;
        if (subjRes.data) updateKid(kidId, { subjects: subjRes.data.map(fromRow) });
        topicsRef.current = list;
        setTopics(list);
      } catch (e) {
        console.warn('Could not load classes:', e);
        if (!cancelled) setError(L("Couldn't load the classes. Please reload the page.", 'No pudimos cargar las clases. Recarga la página.'));
      }
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kidId, isDemo]);

  if (!kid) {
    return (
      <AppShell>
        <div className="qk-screen qk-page-enter">
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <Link href="/dashboard" className="qk-btn qk-btn-ghost">{ICONS.back}<span>{t('backToDash')}</span></Link>
            <p className="qk-sub" style={{ marginTop: 20 }}>{t('kidNotFound')}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const doneStep = subjects.length + 1;
  const at = Math.min(step, doneStep);
  const current = at >= 1 && at <= subjects.length ? subjects[at - 1] : null;
  const infoOf = (ks: KidSubject) => subjectInfo(ks.subject, lang, customSubjects, ks);
  const classesOf = (subject: string) => topics.filter((x) => x.subject === subject);
  const pathItems = subjects.map((ks) => ({ ...infoOf(ks), count: classesOf(ks.subject).length }));
  const kidPage = `/dashboard/kid/${kid.id}`;

  const go = (s: number) => {
    setStep(s);
    setDraft('');
    setError(null);
    setAddingSubject(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addSubject = async (id: string) => {
    setAddingSubject(false);
    const have = useStore.getState().kids.find((k) => k.id === kid.id)?.subjects || [];
    if (have.some((s) => s.subject === id)) return;
    setError(null);
    // read from the store so a custom subject created a moment ago keeps its name and icon
    const labels = subjectLabelFields(id, useStore.getState().customSubjects);
    if (!isDemo) {
      const { error: err } = await createClient().from('kid_subjects').insert({ kid_id: kid.id, subject: id, ...labels });
      if (err) { setError(L("Couldn't add that subject. Please try again.", 'No pudimos agregar esa materia. Intenta de nuevo.')); return; }
    }
    updateKid(kid.id, { subjects: [...have, { subject: id, ...labels }] });
  };

  const addClass = async (subject: string) => {
    if (!draft.trim()) return;
    setAdding(true);
    setError(null);
    const saved = await addTopic(kid.id, subject, { title: draft }, isDemo, topicsRef.current);
    setAdding(false);
    if (!saved) { setError(L("Couldn't add that class. Please try again.", 'No pudimos agregar esa clase. Intenta de nuevo.')); return; }
    saveTopics([saved, ...topicsRef.current.filter((x) => x.id !== saved.id)]);
    setDraft('');
  };

  const removeClass = async (topic: KidTopic) => {
    setError(null);
    if (!(await removeTopic(topic.id, isDemo))) { setError(L("Couldn't remove that class.", 'No pudimos quitar esa clase.')); return; }
    saveTopics(topicsRef.current.filter((x) => x.id !== topic.id));
  };

  const pickPhotos = (target: PhotoTarget) => {
    photoTarget.current = target;
    fileRef.current?.click();
  };

  /** Reads the class out of the photos and saves it as a class of the subject, adding to what a class already had */
  const readPhotos = async (list: FileList) => {
    const target = photoTarget.current;
    if (!target || list.length === 0) return;
    setReading(target.topic?.id ?? 'new:' + target.subject);
    setError(null);
    try {
      const { files, error: readError } = await readClassFiles(list, MAX_CLASS_FILES, lang);
      if (files.length === 0) throw new Error(readError || L('Pick a photo or a PDF of the class.', 'Elige una foto o un PDF de la clase.'));
      const ks = subjects.find((s) => s.subject === target.subject);
      const hint = target.topic?.title ?? subjectInfo(target.subject, lang, customSubjects, ks).label;
      const lesson = await analyzeClassFiles(files, { grade: kid.grade, lang, contentLang: ks?.lang, hint });
      const title = target.topic?.title ?? (lesson.title.trim() || L('My class', 'Mi clase'));
      const existing = target.topic ?? topicsRef.current.find((x) => x.subject === target.subject && norm(x.title) === norm(title));
      const fresh = lessonNotes(lesson);
      const notes = existing?.notes ? `${existing.notes}\n\n${fresh}` : fresh;
      const saved = await addTopic(kid.id, target.subject, { title, notes, source: 'import' }, isDemo, topicsRef.current);
      if (!saved) throw new Error(L("Couldn't save the class. Please try again.", 'No pudimos guardar la clase. Intenta de nuevo.'));
      saveTopics([saved, ...topicsRef.current.filter((x) => x.id !== saved.id)]);
      if (lesson.summary) setSummaries((s) => ({ ...s, [saved.id]: lesson.summary }));
    } catch (e) {
      setError((e as Error).message);
    }
    setReading(null);
  };

  const errorBox = error && (
    <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 12, background: 'var(--coral-l)', color: 'var(--coral)', fontWeight: 600, fontSize: 13 }}>{error}</div>
  );

  return (
    <AppShell>
      <div className="qk-screen qk-page-enter">
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <Avatar id={kid.avatar} size={36} ring={kid.color || undefined} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{kid.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{L('Class setup', 'Configurar clases')} · {t('onbStep')} {at + 1} {t('of')} {doneStep + 1}</div>
              </div>
            </div>
            {at < doneStep && <Link href={kidPage} className="qk-btn qk-btn-ghost" style={smallBtn}>{L('Finish later', 'Terminar después')}</Link>}
          </div>
          <div className="qk-progress" style={{ marginBottom: 24 }}><span style={{ width: `${((at + 1) / (doneStep + 1)) * 100}%` }} /></div>

          <LoadingBar top active={loading} expectedMs={1200} />

          <input ref={fileRef} type="file" accept="application/pdf,image/*" multiple hidden
            onChange={(e) => { if (e.target.files) readPhotos(e.target.files); e.target.value = ''; }} />

          <div key={at} className="qk-card qk-slide-up" style={{ padding: 'clamp(20px, 5vw, 32px)' }}>
            {at === 0 && (
              <div>
                <h1 className="qk-h1" style={{ fontSize: 'clamp(24px, 3vw, 32px)' }}>{L(`Let's set up ${kid.name}'s classes`, `Preparemos las clases de ${kid.name}`)}</h1>
                <p className="qk-sub" style={{ marginTop: 6 }}>
                  {L(`A quick first-time setup so everything QuizKids makes follows what ${kid.name} learns at school. You can keep adding classes all year.`,
                    `Una configuración rápida para que todo lo que crea QuizKids siga lo que ${kid.name} aprende en la escuela. Puedes seguir agregando clases todo el año.`)}
                </p>

                <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(190px, 100%), 1fr))', gap: 10 }}>
                  {[
                    { icon: '📚', title: L('Subjects', 'Materias'), text: L(`The subjects ${kid.name} has this year.`, `Las materias que ${kid.name} tiene este año.`) },
                    { icon: '✏️', title: L('Classes', 'Clases'), text: L('The classes or units of each subject, like "Fractions".', 'Las clases o unidades de cada materia, como "Fracciones".') },
                    { icon: '📷', title: L('A few photos', 'Algunas fotos'), text: L('Pages of the notebook, homework or textbook, so we learn what each class covers.', 'Páginas del cuaderno, la tarea o el libro, para entender qué cubre cada clase.') },
                  ].map((s, i) => (
                    <div key={s.title} style={{ padding: 14, borderRadius: 16, background: 'var(--surface-2)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 12, background: 'var(--surface)', display: 'grid', placeItems: 'center', fontSize: 18 }}>{s.icon}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>{i + 1}. {s.title}</div>
                        <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2, lineHeight: 1.4 }}>{s.text}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 26, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div className="qk-label" style={{ fontSize: 14 }}>{L(`${kid.name}'s subjects`, `Materias de ${kid.name}`)}</div>
                  <button className="qk-btn qk-btn-ghost" style={smallBtn} onClick={() => setAddingSubject((v) => !v)}>{ICONS.plus}<span>{t('addSubject')}</span></button>
                </div>
                {addingSubject && (
                  <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {subjectChoices.filter((c) => !subjects.some((s) => s.subject === c.id)).map((c) => (
                      <button key={c.id} className="qk-chip" onClick={() => addSubject(c.id)}>{c.icon} {c.label}</button>
                    ))}
                    <CustomSubjectAdder lang={lang} options={subjectChoices} variant="chip" onAdded={addSubject} />
                  </div>
                )}
                {subjects.length === 0 ? (
                  <div style={{ marginTop: 12, fontSize: 13, color: 'var(--ink-3)' }}>{L('Add the first subject to start.', 'Agrega la primera materia para empezar.')}</div>
                ) : (
                  <div className="qk-stagger" style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                    {pathItems.map((s, i) => (
                      <button key={s.id} onClick={() => go(i + 1)} className="qk-card-interactive"
                        style={{ appearance: 'none', border: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: 'var(--surface-2)', cursor: 'pointer', textAlign: 'left', color: 'var(--ink)' }}>
                        <PathDot n={i + 1} done={s.count > 0} />
                        <span style={{ fontSize: 22 }}>{s.icon}</span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>{s.label}</span>
                          <span style={{ display: 'block', fontSize: 12, color: s.count ? 'var(--primary-d)' : 'var(--ink-3)', fontWeight: s.count ? 700 : 400 }}>{classCount(s.count, lang)}</span>
                        </span>
                        <span style={{ color: 'var(--ink-3)' }}>{ICONS.next}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: 16, fontSize: 13, color: 'var(--ink-3)' }}>
                  {L('Using Google Classroom? ', '¿Usan Google Classroom? ')}
                  <Link href={`/dashboard/classroom/import?kid=${kid.id}`} style={{ color: 'var(--primary-d)', fontWeight: 700 }}>{L('Import subjects and classes from it', 'Importa materias y clases desde ahí')}</Link>
                </div>

                {errorBox}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 28 }}>
                  <Btn kind="primary" disabled={subjects.length === 0} onClick={() => go(1)} iconRight={ICONS.next} style={{ opacity: subjects.length ? 1 : .5 }}>
                    {subjects.length ? L(`Start with ${pathItems[0].label}`, `Empezar con ${pathItems[0].label}`) : t('next')}
                  </Btn>
                </div>
              </div>
            )}

            {current && (() => {
              const info = infoOf(current);
              const list = classesOf(current.subject);
              const next = subjects[at];
              const busy = reading !== null;
              const readingNew = reading === 'new:' + current.subject;
              return (
                <div>
                  <SubjectPath items={pathItems} at={at} onPick={go} />
                  <span className="qk-eyebrow" style={{ marginTop: 18 }}>{info.icon} {L('Subject', 'Materia')} {at} {t('of')} {subjects.length}</span>
                  <h2 className="qk-h2" style={{ marginTop: 10 }}>{L(`What is ${kid.name} learning in ${info.label}?`, `¿Qué está aprendiendo ${kid.name} en ${info.label}?`)}</h2>
                  <p className="qk-sub" style={{ marginTop: 6 }}>
                    {L('Add the classes or units from school. A few photos of the notebook, homework or textbook help us learn what each one covers.',
                      'Agrega las clases o unidades de la escuela. Unas fotos del cuaderno, la tarea o el libro nos ayudan a entender qué cubre cada una.')}
                  </p>

                  <form onSubmit={(e) => { e.preventDefault(); addClass(current.subject); }} style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <input className="qk-input" value={draft} maxLength={80} autoFocus onChange={(e) => setDraft(e.target.value)}
                      placeholder={L(`Add a class, e.g. ${classExample(current.subject, 'en')}`, `Agrega una clase, ej. ${classExample(current.subject, 'es')}`)}
                      style={{ flex: '1 1 220px', width: 'auto', minWidth: 0 }} />
                    <Btn kind="primary" icon={ICONS.plus} type="submit" className="qk-full-sm" disabled={adding || !draft.trim()} style={{ opacity: draft.trim() ? 1 : .5 }}>{L('Add class', 'Agregar clase')}</Btn>
                  </form>

                  {list.length > 0 && (
                    <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
                      {list.map((topic) => {
                        const isReading = reading === topic.id;
                        const status = isReading ? L('Reading the photos…', 'Leyendo las fotos…')
                          : topic.source === 'import' ? '📎 ' + L('Photos added', 'Fotos agregadas')
                          : topic.source === 'classroom' ? '🏫 Google Classroom'
                          : L('No photos yet', 'Sin fotos aún');
                        return (
                          <div key={topic.id} className="qk-slide-up" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '10px 12px', borderRadius: 14, background: 'var(--surface-2)' }}>
                            <div style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 10, background: topic.source === 'import' ? 'var(--primary-l)' : 'var(--surface)', color: topic.source === 'import' ? 'var(--primary-d)' : 'var(--ink-3)', display: 'grid', placeItems: 'center' }}>
                              {topic.source === 'import' ? ICONS.camera : ICONS.book}
                            </div>
                            <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topic.title}</div>
                              <div style={{ fontSize: 12, color: isReading ? 'var(--primary-d)' : 'var(--ink-3)', fontWeight: isReading ? 700 : 400 }}>{status}</div>
                              {isReading && <LoadingBar expectedMs={READ_MS} style={{ marginTop: 6, maxWidth: 240 }} />}
                              {summaries[topic.id] && <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 4, lineHeight: 1.4 }}>{summaries[topic.id]}</div>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
                              <button className="qk-btn qk-btn-ghost" style={smallBtn} disabled={busy} onClick={() => pickPhotos({ subject: current.subject, topic })}>
                                {ICONS.camera}<span>{topic.source === 'import' ? L('More photos', 'Más fotos') : L('Add photos', 'Agregar fotos')}</span>
                              </button>
                              <button aria-label={L('Remove class', 'Quitar clase')} title={L('Remove class', 'Quitar clase')} disabled={busy} onClick={() => removeClass(topic)}
                                style={{ appearance: 'none', border: 0, background: 'transparent', color: 'var(--ink-3)', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 6 }}>{ICONS.trash}</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <button onClick={() => pickPhotos({ subject: current.subject })} disabled={busy}
                    style={{ appearance: 'none', width: '100%', marginTop: 14, padding: '18px 16px', borderRadius: 16, border: '2px dashed var(--line)', background: 'var(--surface)', cursor: busy ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', color: 'var(--ink)' }}>
                    <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 14, background: 'var(--honey-l)', color: 'var(--honey)', display: 'grid', placeItems: 'center' }}>{ICONS.camera}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16 }}>
                        {readingNew ? L('Reading the photos…', 'Leyendo las fotos…') : L('Upload photos of a class', 'Sube fotos de una clase')}
                      </div>
                      {readingNew
                        ? <LoadingBar expectedMs={READ_MS} style={{ marginTop: 8, width: 240, maxWidth: '100%' }} />
                        : <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>
                          {L(`We'll read them and add the class for you · photos or PDF, up to ${MAX_CLASS_FILES}`, `Las leemos y agregamos la clase por ti · fotos o PDF, hasta ${MAX_CLASS_FILES}`)}
                        </div>}
                    </div>
                  </button>

                  {list.length === 0 && !loading && (
                    <div style={{ marginTop: 12, fontSize: 13, color: 'var(--ink-3)' }}>
                      {L(`Tip: the latest page of ${kid.name}'s ${info.label} notebook is a great start. No classes here yet? Skip it and come back later.`,
                        `Consejo: la última página del cuaderno de ${info.label} es un gran comienzo. ¿Aún no hay clases? Sáltala y vuelve después.`)}
                    </div>
                  )}

                  {errorBox}

                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', marginTop: 28, gap: 12 }}>
                    <button className="qk-btn qk-btn-ghost" onClick={() => go(at - 1)}>{ICONS.back} <span>{t('back')}</span></button>
                    <Btn kind="primary" onClick={() => go(at + 1)} iconRight={ICONS.next} disabled={busy}>
                      {next ? L(`Next: ${infoOf(next).label}`, `Siguiente: ${infoOf(next).label}`) : L('Finish', 'Terminar')}
                    </Btn>
                  </div>
                </div>
              );
            })()}

            {at === doneStep && at > 0 && (() => {
              const total = topics.filter((x) => subjects.some((s) => s.subject === x.subject)).length;
              return (
                <div>
                  <div style={{ textAlign: 'center' }}>
                    <div className="qk-bounce-in" style={{ display: 'inline-block' }}><Avatar id={kid.avatar} size={84} ring={kid.color || undefined} /></div>
                    <h2 className="qk-h1" style={{ fontSize: 'clamp(24px, 3vw, 32px)', marginTop: 14 }}>
                      {total ? L(`${kid.name}'s classes are set up 🎉`, `¡Las clases de ${kid.name} están listas! 🎉`) : L('All set for now', 'Listo por ahora')}
                    </h2>
                    <p className="qk-sub" style={{ margin: '6px auto 0', maxWidth: 520 }}>
                      {total
                        ? L(`Guides, quizzes and worksheets will follow these classes.`, 'Las guías, quizzes y hojas de práctica seguirán estas clases.')
                        : L(`Add ${kid.name}'s classes whenever you're ready, from here or from each subject.`, `Agrega las clases de ${kid.name} cuando quieras, desde aquí o desde cada materia.`)}
                    </p>
                  </div>

                  <div style={{ marginTop: 22, display: 'grid', gap: 8 }}>
                    {subjects.map((ks, i) => {
                      const info = infoOf(ks);
                      const list = classesOf(ks.subject);
                      const withPhotos = list.filter((x) => x.source === 'import').length;
                      return (
                        <div key={ks.subject} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 14, background: 'var(--surface-2)' }}>
                          <PathDot n={i + 1} done={list.length > 0} />
                          <span style={{ fontSize: 20 }}>{info.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>{info.label}</div>
                            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                              {classCount(list.length, lang)}{withPhotos ? ` · ${withPhotos} ${L('with photos', 'con fotos')}` : ''}
                            </div>
                          </div>
                          <button className="qk-btn qk-btn-ghost" style={smallBtn} onClick={() => go(i + 1)}>{list.length ? L('Edit', 'Editar') : L('Add', 'Agregar')}</button>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 16, background: 'var(--honey-l)', fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                    🌱 {L(`This is just the start. As the school year moves on, add new classes and photos from each subject's page, and QuizKids keeps up with ${kid.name}.`,
                      `Esto es solo el comienzo. A medida que avanza el año escolar, agrega nuevas clases y fotos desde la página de cada materia, y QuizKids sigue el ritmo de ${kid.name}.`)}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', marginTop: 28, gap: 12 }}>
                    <button className="qk-btn qk-btn-ghost" onClick={() => go(at - 1)}>{ICONS.back} <span>{t('back')}</span></button>
                    <Btn kind="primary" icon={ICONS.check} onClick={() => router.push(kidPage)}>{L(`Go to ${kid.name}'s page`, `Ir a la página de ${kid.name}`)}</Btn>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function classCount(n: number, lang: string) {
  if (n === 0) return lang === 'es' ? 'Sin clases aún' : 'No classes yet';
  return lang === 'es' ? `${n} ${n === 1 ? 'clase' : 'clases'}` : `${n} ${n === 1 ? 'class' : 'classes'}`;
}

const EXAMPLES: Record<string, [string, string]> = {
  math: ['Fractions', 'Fracciones'],
  lang: ['Reading comprehension', 'Comprensión lectora'],
  sci: ['The water cycle', 'El ciclo del agua'],
  soc: ['Ancient Egypt', 'Antiguo Egipto'],
  fr: ['Greetings', 'Los saludos'],
  art: ['Primary colors', 'Colores primarios'],
};

function classExample(subject: string, lang: 'en' | 'es') {
  const e = EXAMPLES[subject] || ['Unit 1', 'Unidad 1'];
  return lang === 'es' ? e[1] : e[0];
}

function PathDot({ n, done }: { n: number; done: boolean }) {
  return (
    <span style={{ width: 26, height: 26, flexShrink: 0, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800, background: done ? 'var(--primary)' : 'var(--surface)', color: done ? '#fff' : 'var(--ink-3)', border: done ? 'none' : '1.5px solid var(--line)' }}>
      {done ? <span style={{ transform: 'scale(.7)', display: 'grid' }}>{ICONS.check}</span> : n}
    </span>
  );
}

/** The subjects as stepping stones: done ones (with a class) are filled, the current one is ringed */
function SubjectPath({ items, at, onPick }: { items: Array<SubjectOption & { count: number }>; at: number; onPick: (step: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', overflowX: 'auto', padding: 4, margin: -4 }}>
      {items.map((s, i) => {
        const on = i + 1 === at;
        const done = s.count > 0;
        return (
          <React.Fragment key={s.id}>
            {i > 0 && <div style={{ flex: '1 0 14px', height: 3, marginTop: 21, borderRadius: 2, background: items[i - 1].count > 0 ? 'var(--primary)' : 'var(--line)' }} />}
            <button onClick={() => onPick(i + 1)} title={s.label}
              style={{ appearance: 'none', border: 0, background: 'transparent', padding: '0 4px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0, width: 64 }}>
              <span style={{ position: 'relative', width: 44, height: 44, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 20, background: done ? 'var(--primary-l)' : 'var(--surface-2)', boxShadow: on ? '0 0 0 3px var(--primary)' : 'none', transition: 'box-shadow .15s ease' }}>
                {s.icon}
                {done && <span style={{ position: 'absolute', right: -3, bottom: -3, width: 18, height: 18, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'grid', placeItems: 'center', border: '2px solid var(--surface)' }}><span style={{ transform: 'scale(.55)', display: 'grid' }}>{ICONS.check}</span></span>}
              </span>
              <span style={{ fontSize: 11, fontWeight: on ? 800 : 600, color: on ? 'var(--ink)' : 'var(--ink-3)', maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}
