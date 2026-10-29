'use client';
import React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ICONS } from '@/components/ui/Icons';
import { LoadingBar } from '@/components/ui/LoadingBar';
import { Btn } from '@/components/ui/Btn';
import { AppShell } from '@/components/layout/AppShell';
import ModePicker from '@/components/games/ModePicker';
import TrueFalseGame from '@/components/games/TrueFalseGame';
import FillGame from '@/components/games/FillGame';
import GameResults from '@/components/games/GameResults';
import type { Played } from '@/components/games/GameBits';
import { useStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { fetchContent } from '@/lib/fetchContent';
import { subjectInfo } from '@/lib/subjects';
import { loadTopics } from '@/lib/topics';
import { testSource } from '@/lib/tests';
import { GAME_MODES, MAX_GAME_TOPICS, isGameMode, itemText, sampleGame, starsFor, toGame, type FillItem, type GameKind, type GameMode, type TfItem } from '@/lib/games';
import type { KidTopic } from '@/types';

const norm = (x: string) => x.trim().toLowerCase();

/** A topic needs this many cards in a round for the round to count toward its mastery (a few cards prove nothing) */
const MIN_CARDS_FOR_MASTERY = 5;

type Item = TfItem | FillItem;
interface Round { kind: GameKind; items: Item[]; sample: boolean }

/** Pick a way to learn and the topics to play with, then play: true or false, fill the blank, or the flip cards */
export default function PlayClient() {
  const params = useParams<{ subject: string }>();
  const subject = decodeURIComponent(typeof params?.subject === 'string' ? params.subject : '');
  const modeParam = useSearchParams().get('mode');
  const { lang, kids, activeKidId, isDemo, updateKid, customSubjects, difficulty, gamification, studyParams, setStudyParams, setMode: setAppMode } = useStore();
  const L = (en: string, es: string) => (lang === 'es' ? es : en);
  const router = useRouter();
  const kid = kids.find((k) => k.id === activeKidId) || kids[0];
  const ks = kid?.subjects?.find((s) => s.subject === subject);
  const info = subjectInfo(subject, lang, customSubjects, ks);
  const contentLang = ks?.lang ?? lang;
  const here = `/kids/subject/${encodeURIComponent(subject)}`;

  const [mode, setMode] = React.useState<GameMode>(isGameMode(modeParam) ? modeParam : 'tf');
  const [topics, setTopics] = React.useState<KidTopic[] | null>(null);
  const [picked, setPicked] = React.useState<string[]>([]);
  const [phase, setPhase] = React.useState<'setup' | 'loading' | 'playing' | 'done'>('setup');
  const [loadPhase, setLoadPhase] = React.useState<'loading' | 'creating'>('loading');
  const [round, setRound] = React.useState<Round | null>(null);
  const [played, setPlayed] = React.useState<{ played: Played<Item>[]; bestStreak: number } | null>(null);
  // Cards seen in earlier rounds of this visit, so "play again" brings new ones
  const seen = React.useRef<string[]>([]);
  // A new round starts a fresh game component even when the cards look alike
  const [roundNo, setRoundNo] = React.useState(0);

  React.useEffect(() => { setAppMode('kid'); }, []);

  React.useEffect(() => {
    if (!kid || !subject) return;
    let cancelled = false;
    loadTopics(kid, subject, isDemo)
      .catch((e) => { console.warn('Could not load topics:', e); return [] as KidTopic[]; })
      .then((list) => {
        if (cancelled) return;
        setTopics(list);
        setPicked(list.slice(0, MAX_GAME_TOPICS).map((x) => x.title));
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kid?.id, subject, isDemo]);

  if (!kid) return null;

  const isOn = (title: string) => picked.some((n) => norm(n) === norm(title));
  const full = picked.length >= MAX_GAME_TOPICS;
  const toggle = (title: string) => setPicked((p) => (isOn(title) ? p.filter((n) => norm(n) !== norm(title)) : [...p, title].slice(0, MAX_GAME_TOPICS)));
  const chosen = (topics || []).filter((x) => isOn(x.title));
  const titles = chosen.map((x) => x.title);
  const label = titles.length === 1 ? titles[0] : titles.join(' · ').slice(0, 80);

  const start = async (again = false) => {
    if (!chosen.length) return;
    const source = chosen.length === 1 ? chosen[0].notes : testSource(chosen);

    if (mode === 'flip') {
      // The flashcard quiz: one topic, or all the picked ones mixed
      setStudyParams({
        ...studyParams,
        subject, topic: label, grade: kid.grade,
        contentId: undefined, assignmentId: undefined, planItemId: undefined,
        contentLang: ks?.lang, source, returnTo: here, topics: chosen.length > 1 ? titles : undefined, pairedContentId: undefined, testId: undefined, memory: undefined,
      });
      router.push('/kids/quiz');
      return;
    }

    if (!again) seen.current = [];
    setPhase('loading');
    setLoadPhase('loading');
    let next: Round | null = null;
    try {
      const data = await fetchContent<unknown>('/api/generate/game', {
        kind: mode, topic: label, topics: titles, grade: kid.grade, difficulty, lang: contentLang, subject, source,
        ...(seen.current.length ? { exclude: seen.current } : {}),
      }, () => setLoadPhase('creating'), titles.length > 1 || seen.current.length > 0);
      const made = data ? toGame(mode, data) : null;
      if (made) next = { kind: mode, items: made.items, sample: false };
    } catch (e) {
      console.warn('Could not make the game:', e);
    }
    if (!next) next = { kind: mode, items: sampleGame(mode, contentLang, titles).items, sample: true };
    seen.current = [...seen.current, ...next.items.map(itemText)].slice(-40);
    setRound(next);
    setPlayed(null);
    setRoundNo((n) => n + 1);
    setPhase('playing');
  };

  const finish = (results: Played<Item>[], _stars: number, bestStreak: number) => {
    setPlayed({ played: results, bestStreak });
    setPhase('done');
    // Sample cards are not about the real topics: nothing to save
    if (!round || (round.sample && !isDemo)) return;
    const right = results.filter((r) => r.ok).length;
    const earned = starsFor(Math.round((right / Math.max(1, results.length)) * 100));
    updateKid(kid.id, { stars: (kid.stars || 0) + earned, lastSubject: subject });
    if (isDemo) return;
    const byTopic = new Map<string, { right: number; total: number }>();
    results.forEach((r) => {
      const t = r.item.topic || label;
      const row = byTopic.get(t) || { right: 0, total: 0 };
      byTopic.set(t, { right: row.right + (r.ok ? 1 : 0), total: row.total + 1 });
    });
    const rows = Array.from(byTopic).filter(([, r]) => r.total >= MIN_CARDS_FOR_MASTERY).map(([topic, r]) => ({
      kid_id: kid.id, subject, topic, grade: kid.grade, difficulty: round.kind, total: r.total, correct: r.right,
      stars: starsFor(Math.round((r.right / r.total) * 100)), lang: contentLang,
    }));
    const supabase = createClient();
    if (rows.length) supabase.from('quiz_results').insert(rows).then(({ error }) => { if (error) console.warn('Could not save game result:', error); });
    supabase.from('kids').update({ stars: (kid.stars || 0) + earned, last_subject: subject }).eq('id', kid.id).then(() => {});
  };

  const meta = GAME_MODES.find((m) => m.id === mode)!;
  const copy = lang === 'es' ? meta.es : meta.en;
  const step = (n: number, text: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{n}</span>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 19 }}>{text}</span>
    </div>
  );

  return (
    <AppShell>
      <div className="qk-screen qk-page-enter" style={{ padding: '24px clamp(16px, 5vw, 56px) 64px' }}>
        <div style={{ maxWidth: phase === 'setup' ? 860 : 640, margin: '0 auto' }}>
          <button className="qk-btn qk-btn-ghost" onClick={() => (phase === 'playing' ? setPhase('setup') : router.push(here))}>{ICONS.back} <span>{phase === 'playing' ? L('Stop game', 'Salir del juego') : info.label}</span></button>

          {phase === 'setup' && (
            <>
              <div className="qk-slide-up" style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--primary-l)', display: 'grid', placeItems: 'center', fontSize: 34, flexShrink: 0 }}>{info.icon}</div>
                <div style={{ minWidth: 0 }}>
                  <span className="qk-eyebrow">{info.label}</span>
                  <h1 className="qk-h1" style={{ margin: '6px 0 0', fontSize: 'clamp(26px, 4vw, 36px)' }}>{L('How do you want to learn?', '¿Cómo quieres aprender?')}</h1>
                </div>
              </div>

              <div className="qk-card" style={{ marginTop: 22, padding: 'clamp(16px, 4vw, 26px)', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 24 }}>
                {topics == null ? (
                  <div style={{ color: 'var(--ink-3)' }}>{L('Loading…', 'Cargando…')}</div>
                ) : topics.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 12, color: 'var(--ink-3)' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>{L('No classes here yet.', 'Todavía no hay clases aquí.')}</div>
                    <div style={{ marginTop: 8, fontSize: 14 }}>{L('Ask a grown-up to add the classes of this subject first.', 'Pídele a un adulto que agregue primero las clases de esta materia.')}</div>
                  </div>
                ) : (
                  <>
                    <div>
                      {step(1, L('Pick a game', 'Elige un juego'))}
                      <ModePicker lang={lang} selected={mode} onPick={setMode} />
                    </div>

                    <div>
                      {step(2, L('What do you want to practice?', '¿Qué quieres practicar?'))}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 12, color: 'var(--ink-3)', marginBottom: 8 }}>
                        <span>{picked.length}/{Math.min(topics.length, MAX_GAME_TOPICS)} {L('classes picked', 'clases elegidas')}</span>
                        {picked.length > 0 && <button type="button" onClick={() => setPicked([])} style={{ appearance: 'none', border: 0, background: 'transparent', color: 'var(--primary-d)', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: 12 }}>{L('Clear', 'Quitar todo')}</button>}
                        {picked.length < Math.min(topics.length, MAX_GAME_TOPICS) && <button type="button" onClick={() => setPicked(topics.slice(0, MAX_GAME_TOPICS).map((x) => x.title))} style={{ appearance: 'none', border: 0, background: 'transparent', color: 'var(--primary-d)', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: 12 }}>{L('Pick all', 'Elegir todas')}</button>}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))', gap: 8 }}>
                        {topics.map((x) => {
                          const on = isOn(x.title);
                          return (
                            <label key={x.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: on ? 'var(--primary-l)' : 'var(--surface)', border: '1.5px solid ' + (on ? 'var(--primary)' : 'var(--line)'), cursor: !on && full ? 'not-allowed' : 'pointer', opacity: !on && full ? 0.55 : 1, minWidth: 0 }}>
                              <input type="checkbox" checked={on} disabled={!on && full} onChange={() => toggle(x.title)} style={{ width: 18, height: 18, accentColor: 'var(--primary)', flexShrink: 0 }} />
                              <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, overflowWrap: 'anywhere' }}>{x.title}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Btn kind="primary" icon={<span aria-hidden style={{ fontSize: 18, lineHeight: 1 }}>{meta.emoji}</span>} className="qk-full-sm" disabled={!chosen.length} onClick={() => start()} style={{ fontSize: 17, padding: '14px 26px' }}>
                        {L(`Play ${copy.title}`, `Jugar: ${copy.title}`)}
                      </Btn>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {phase === 'loading' && (
            <div className="qk-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, minHeight: '50vh' }}>
              <div aria-hidden style={{ fontSize: 44 }}>{meta.emoji}</div>
              <LoadingBar expectedMs={9000} style={{ width: 'min(280px, 100%)' }} />
              <div style={{ fontSize: 16, color: 'var(--ink-3)', fontFamily: 'var(--font-display)', textAlign: 'center' }}>{loadPhase === 'creating' ? L('Getting your game ready…', 'Preparando tu juego…') : L('Loading…', 'Cargando…')}</div>
            </div>
          )}

          {phase === 'playing' && round && (
            <div style={{ marginTop: 18 }}>
              {round.sample && <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 12, background: 'var(--honey-l)', color: '#7C5410', fontWeight: 600, fontSize: 13 }}>{isDemo ? L('Demo: these are sample cards.', 'Demo: estas son tarjetas de ejemplo.') : L("These are sample cards: we couldn't make your game right now.", 'Estas son tarjetas de ejemplo: no pudimos hacer tu juego ahora.')}</div>}
              {round.kind === 'tf'
                ? <TrueFalseGame key={roundNo} items={round.items as TfItem[]} lang={lang} minimal={gamification === 'minimal'} label={label} onFinish={finish} />
                : <FillGame key={roundNo} items={round.items as FillItem[]} lang={lang} minimal={gamification === 'minimal'} label={label} onFinish={finish} />}
            </div>
          )}

          {phase === 'done' && round && played && (
            <div style={{ marginTop: 18 }}>
              <GameResults kind={round.kind} played={played.played} bestStreak={played.bestStreak} minimal={gamification === 'minimal'} saved={!round.sample || isDemo} lang={lang}
                onAgain={() => start(true)} onOther={() => setPhase('setup')} onBack={() => router.push(here)} />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
