'use client';
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ICONS } from '@/components/ui/Icons';
import { AppShell } from '@/components/layout/AppShell';
import ExamSetup, { type ExamSetupValue, type PartState } from '@/components/exam/ExamSetup';
import { useStore } from '@/lib/store';
import { subjectInfo } from '@/lib/subjects';
import { loadTopics } from '@/lib/topics';
import { KIT_PARTS, createTest, examMemory, loadTests, type KitPart } from '@/lib/tests';
import type { KidTest, KidTopic } from '@/types';

const norm = (x: string) => x.trim().toLowerCase();

/** Test mode: the kid picks the classes a school test covers and gets the whole study kit for it */
export default function ExamNewClient() {
  const params = useParams<{ subject: string }>();
  const subject = decodeURIComponent(typeof params?.subject === 'string' ? params.subject : '');
  const { lang, kids, activeKidId, isDemo, updateKid, customSubjects, difficulty, setMode } = useStore();
  const L = (en: string, es: string) => (lang === 'es' ? es : en);
  const router = useRouter();
  const kid = kids.find((k) => k.id === activeKidId) || kids[0];
  const ks = kid?.subjects?.find((s) => s.subject === subject);
  const info = subjectInfo(subject, lang, customSubjects, ks);
  const back = `/kids/subject/${encodeURIComponent(subject)}`;

  const [topics, setTopics] = React.useState<KidTopic[] | null>(null);
  const [tests, setTests] = React.useState<KidTest[]>([]);
  const [parts, setParts] = React.useState<Record<KitPart, PartState> | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => { setMode('kid'); }, []);

  React.useEffect(() => {
    if (!kid || !subject) return;
    let cancelled = false;
    (async () => {
      const [topicList, testList] = await Promise.all([
        loadTopics(kid, subject, isDemo).catch((e) => { console.warn('Could not load topics:', e); return [] as KidTopic[]; }),
        loadTests(kid, subject, isDemo).catch((e) => { console.warn('Could not load tests:', e); return [] as KidTest[]; }),
      ]);
      if (cancelled) return;
      setTopics(topicList);
      setTests(testList);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kid?.id, subject, isDemo]);

  if (!kid) return null;

  const submit = async (v: ExamSetupValue) => {
    if (!topics) return;
    setError(null);
    setParts(Object.fromEntries(KIT_PARTS.map((p) => [p, 'waiting'])) as Record<KitPart, PartState>);
    try {
      const picked = topics.filter((x) => v.picked.some((n) => norm(n) === norm(x.title)));
      const test = await createTest(kid, subject, { title: v.title, topics: picked, testDate: v.date || undefined }, {
        lang: ks?.lang ?? lang, difficulty, existing: tests, isDemo, memory: examMemory(tests),
        onPart: (part, ok) => setParts((p) => (p ? { ...p, [part]: ok ? 'done' : 'failed' } : p)),
      });
      if (isDemo) updateKid(kid.id, { tests: [...(useStore.getState().kids.find((k) => k.id === kid.id)?.tests || []), test] });
      router.push(`/kids/exam/${test.id}`);
    } catch (e) {
      console.warn('Could not create test:', e);
      setError(L("We couldn't make your study kit. Please try again.", 'No pudimos hacer tu kit de estudio. Intenta de nuevo.'));
      setParts(null);
    }
  };

  return (
    <AppShell>
      <div className="qk-screen qk-page-enter" style={{ padding: '32px clamp(16px, 5vw, 56px) 64px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <button className="qk-btn qk-btn-ghost" onClick={() => router.push(back)} disabled={!!parts}>{ICONS.back} <span>{info.label}</span></button>

          <div className="qk-slide-up" style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--honey-l)', display: 'grid', placeItems: 'center', fontSize: 34, flexShrink: 0 }}>📝</div>
            <div style={{ minWidth: 0 }}>
              <span className="qk-eyebrow">{info.icon} {info.label}</span>
              <h1 className="qk-h1" style={{ margin: '6px 0 0', fontSize: 'clamp(26px, 4vw, 36px)' }}>{L('Test mode', 'Modo examen')}</h1>
              <p className="qk-sub" style={{ marginTop: 4, fontSize: 15 }}>{L('Tell us what’s on your test and get everything you need to study for it.', 'Dinos qué entra en tu examen y recibe todo lo que necesitas para estudiar.')}</p>
            </div>
          </div>

          {error && <div style={{ marginTop: 20, padding: '10px 14px', borderRadius: 12, background: 'var(--coral-l)', color: 'var(--coral)', fontWeight: 600, fontSize: 13 }}>{error}</div>}

          <div className="qk-card" style={{ marginTop: 22, padding: 'clamp(16px, 4vw, 26px)' }}>
            {topics == null ? (
              <div style={{ color: 'var(--ink-3)' }}>{L('Loading…', 'Cargando…')}</div>
            ) : topics.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 12, color: 'var(--ink-3)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>{L('No classes here yet.', 'Todavía no hay clases aquí.')}</div>
                <div style={{ marginTop: 8, fontSize: 14 }}>{L('Ask a grown-up to add the classes of this subject first.', 'Pídele a un adulto que agregue primero las clases de esta materia.')}</div>
              </div>
            ) : (
              <ExamSetup lang={lang} topics={topics} tests={tests} busy={!!parts} parts={parts} forKid onSubmit={submit} onCancel={() => router.push(back)} />
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
