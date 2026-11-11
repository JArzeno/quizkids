'use client';
import React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ICONS } from '@/components/ui/Icons';
import { Btn } from '@/components/ui/Btn';
import { AppShell } from '@/components/layout/AppShell';
import { ModeTiles } from '@/components/games/ModePicker';
import WriteGame from '@/components/words/WriteGame';
import PickGame from '@/components/words/PickGame';
import WordResults from '@/components/words/WordResults';
import type { WordPlayed } from '@/components/words/WordBits';
import { useStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { subjectInfo } from '@/lib/subjects';
import { starsFor } from '@/lib/games';
import {
  WORD_GAMES, dateLabel, defaultWordList, filterEntries, isKnown, isMissed, isNew, isWordGame, listProgress, loadWordLists, nextStats,
  parseEntry, pickChoices, roundEntries, saveWordStats, wordKey,
  type PickItem, type WordEntry, type WordFilter, type WordGame,
} from '@/lib/words';
import type { WordList } from '@/types';

/** Results are saved to the subject's history only for rounds this long (a couple of words prove little) */
const MIN_WORDS_TO_SAVE = 5;
const SIZES = [10, 20];

interface Round { game: WordGame; items: WordEntry[] | PickItem[] }

/** Spelling practice with the words a grown-up added: pick a list, a game and the words, then play */
export default function WordsClient() {
  const params = useParams<{ subject: string }>();
  const subject = decodeURIComponent(typeof params?.subject === 'string' ? params.subject : '');
  const search = useSearchParams();
  const backHome = search.get('from') === 'home';
  const { lang, kids, activeKidId, isDemo, updateKid, customSubjects, gamification, setMode: setAppMode } = useStore();
  const L = (en: string, es: string) => (lang === 'es' ? es : en);
  const router = useRouter();
  const kid = kids.find((k) => k.id === activeKidId) || kids[0];
  const ks = kid?.subjects?.find((s) => s.subject === subject);
  const info = subjectInfo(subject, lang, customSubjects, ks);
  const backTo = backHome ? '/kids/home' : `/kids/subject/${encodeURIComponent(subject)}`;

  const [lists, setLists] = React.useState<WordList[] | null>(null);
  const [listId, setListId] = React.useState<string | null>(search.get('list'));
  const [game, setGame] = React.useState<WordGame>(isWordGame(search.get('mode')) ? (search.get('mode') as WordGame) : 'write');
  const [filter, setFilter] = React.useState<WordFilter | 'choose'>('all');
  const [chosen, setChosen] = React.useState<string[]>([]);
  const [size, setSize] = React.useState<number | null>(10);
  const [phase, setPhase] = React.useState<'setup' | 'playing' | 'done'>('setup');
  const [round, setRound] = React.useState<Round | null>(null);
  const [played, setPlayed] = React.useState<{ played: WordPlayed[]; bestStreak: number } | null>(null);
  const [roundNo, setRoundNo] = React.useState(0);

  React.useEffect(() => { setAppMode('kid'); }, []);

  React.useEffect(() => {
    if (!kid || !subject) return;
    let cancelled = false;
    loadWordLists(kid.id, subject, isDemo)
      .catch((e) => { console.warn('Could not load word lists:', e); return [] as WordList[]; })
      .then((all) => {
        if (cancelled) return;
        setLists(all);
        setListId((id) => (id && all.some((l) => l.id === id) ? id : defaultWordList(all)?.id ?? null));
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kid?.id, subject, isDemo]);

  const list = lists?.find((l) => l.id === listId) || null;
  const entries = React.useMemo(() => (list ? list.words.map(parseEntry) : []), [list]);

  if (!kid) return null;

  const minimal = gamification === 'minimal';
  const wordLang = list?.lang ?? ks?.lang ?? lang;
  const stats = list?.stats || {};
  const progress = list ? listProgress(list) : null;
  const counts = { all: entries.length, missed: entries.filter((e) => isMissed(stats, e.w)).length, new: entries.filter((e) => isNew(stats, e.w)).length };
  const pool = filter === 'choose' ? entries.filter((e) => chosen.includes(wordKey(e.w))) : filterEntries(entries, stats, filter);
  const roundSize = filter === 'choose' || size == null ? pool.length : Math.min(size, pool.length);
  const meta = WORD_GAMES.find((g) => g.id === game)!;

  const switchList = (id: string) => { setListId(id); setFilter('all'); setChosen([]); };

  const start = (only?: WordEntry[]) => {
    if (!list) return;
    const picked = only ? [...only] : roundEntries(pool, stats, filter === 'choose' ? null : size);
    if (!picked.length) return;
    const avoid = new Set(entries.map((e) => wordKey(e.w)));
    const items = game === 'pick' ? picked.map((e): PickItem => ({ ...e, choices: pickChoices(e.w, wordLang, avoid) })) : picked;
    setRound({ game, items });
    setPlayed(null);
    setRoundNo((n) => n + 1);
    setPhase('playing');
  };

  const finish = (results: WordPlayed[], _stars: number, bestStreak: number) => {
    setPlayed({ played: results, bestStreak });
    setPhase('done');
    if (!list || !round) return;
    const nextList = { ...list, stats: nextStats(list.stats, results.map((r) => ({ w: r.item.w, ok: r.ok }))) };
    setLists((all) => (all || []).map((l) => (l.id === list.id ? nextList : l)));
    void saveWordStats(kid.id, list, nextList.stats, isDemo);
    const right = results.filter((r) => r.ok).length;
    const earned = starsFor(Math.round((right / Math.max(1, results.length)) * 100));
    updateKid(kid.id, { stars: (kid.stars || 0) + earned, lastSubject: subject });
    if (isDemo) return;
    const supabase = createClient();
    supabase.from('kids').update({ stars: (kid.stars || 0) + earned, last_subject: subject }).eq('id', kid.id).then(() => {});
    if (results.length >= MIN_WORDS_TO_SAVE) {
      supabase.from('quiz_results').insert({
        kid_id: kid.id, subject, topic: list.title, grade: kid.grade, difficulty: round.game === 'write' ? 'dictation' : 'spelling',
        total: results.length, correct: right, stars: earned, lang: wordLang,
      }).then(({ error }) => { if (error) console.warn('Could not save word result:', error); });
    }
  };

  const chip = (on: boolean, disabled?: boolean): React.CSSProperties => ({
    appearance: 'none', font: 'inherit', fontWeight: 700, fontSize: 14, padding: '8px 14px', borderRadius: 999, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1,
    border: '2px solid ' + (on ? 'var(--primary)' : 'var(--line)'), background: on ? 'var(--primary-l)' : 'var(--surface)', color: on ? 'var(--primary-d)' : 'var(--ink-2)',
  });
  const step = (n: number, text: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{n}</span>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 19 }}>{text}</span>
    </div>
  );
  const toggleWord = (k: string) => setChosen((c) => (c.includes(k) ? c.filter((x) => x !== k) : [...c, k]));

  return (
    <AppShell>
      <div className="qk-screen qk-page-enter" style={{ padding: '24px clamp(16px, 5vw, 56px) 64px' }}>
        <div style={{ maxWidth: phase === 'setup' ? 860 : 640, margin: '0 auto' }}>
          <button className="qk-btn qk-btn-ghost" onClick={() => (phase === 'playing' ? setPhase('setup') : router.push(backTo))}>
            {ICONS.back} <span>{phase === 'playing' ? L('Stop game', 'Salir del juego') : backHome ? L('Home', 'Inicio') : info.label}</span>
          </button>

          {phase === 'setup' && (
            <>
              <div className="qk-slide-up" style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--berry-l)', display: 'grid', placeItems: 'center', fontSize: 34, flexShrink: 0 }}>✏️</div>
                <div style={{ minWidth: 0 }}>
                  <span className="qk-eyebrow">{info.icon} {info.label}</span>
                  <h1 className="qk-h1" style={{ margin: '6px 0 0', fontSize: 'clamp(26px, 4vw, 36px)' }}>{L('Spelling words', 'Palabras para practicar')}</h1>
                </div>
              </div>

              <div className="qk-card" style={{ marginTop: 22, padding: 'clamp(16px, 4vw, 26px)', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 24 }}>
                {lists == null ? (
                  <div style={{ color: 'var(--ink-3)' }}>{L('Loading…', 'Cargando…')}</div>
                ) : !list ? (
                  <div style={{ textAlign: 'center', padding: 12, color: 'var(--ink-3)' }}>
                    <div aria-hidden style={{ fontSize: 40 }}>📝</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>{L('No words here yet.', 'Todavía no hay palabras aquí.')}</div>
                    <div style={{ marginTop: 8, fontSize: 14 }}>{L('Ask a grown-up to add the words you need to practice.', 'Pídele a un adulto que agregue las palabras que tienes que practicar.')}</div>
                  </div>
                ) : (
                  <>
                    {/* the list: which one, when, how far along */}
                    <div style={{ display: 'grid', gap: 12 }}>
                      {lists.length > 1 && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} role="radiogroup" aria-label={L('Word list', 'Lista de palabras')}>
                          {lists.map((l) => (
                            <button key={l.id} type="button" role="radio" aria-checked={l.id === list.id} onClick={() => switchList(l.id)} style={chip(l.id === list.id)}>
                              {l.title}{l.testDate ? ` · ${dateLabel(l.testDate, lang)}` : ''}
                            </button>
                          ))}
                        </div>
                      )}
                      <div style={{ padding: '14px 16px', borderRadius: 16, background: 'var(--surface-2)', display: 'grid', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <div style={{ flex: '1 1 200px', minWidth: 0, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, overflowWrap: 'anywhere' }}>{list.title}</div>
                          {list.testDate && <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: 'var(--honey-l)', color: 'var(--honey-d)' }}>📅 {dateLabel(list.testDate, lang)}</span>}
                        </div>
                        {progress && (
                          <>
                            <div className="qk-progress" role="progressbar" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.known} aria-label={L('Words you know', 'Palabras que ya sabes')} style={{ background: 'var(--surface)' }}>
                              <span style={{ width: `${progress.total ? (progress.known / progress.total) * 100 : 0}%` }} />
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--ink-2)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                              <span>✅ {progress.known}/{progress.total} {L('right last time', 'bien la última vez')}</span>
                              {progress.missed.length > 0 && <span style={{ color: 'var(--coral)', fontWeight: 700 }}>🎯 {progress.missed.length} {L('to go over', 'para repasar')}</span>}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      {step(1, L('Pick a game', 'Elige un juego'))}
                      <ModeTiles modes={WORD_GAMES} lang={lang} selected={game} onPick={setGame} />
                    </div>

                    <div>
                      {step(2, L('Which words?', '¿Qué palabras?'))}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button type="button" style={chip(filter === 'all')} onClick={() => setFilter('all')}>{L('All', 'Todas')} ({counts.all})</button>
                        <button type="button" style={chip(filter === 'missed', !counts.missed)} disabled={!counts.missed} onClick={() => setFilter('missed')}>🎯 {L('To go over', 'Para repasar')} ({counts.missed})</button>
                        <button type="button" style={chip(filter === 'new', !counts.new)} disabled={!counts.new} onClick={() => setFilter('new')}>✨ {L('New', 'Nuevas')} ({counts.new})</button>
                        <button type="button" style={chip(filter === 'choose')} onClick={() => setFilter('choose')}>☑️ {L('Pick them', 'Elegirlas')}</button>
                      </div>

                      {filter === 'choose' && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 12, color: 'var(--ink-3)', marginBottom: 8 }}>
                            <span>{chosen.length} {L('picked', 'elegidas')}</span>
                            {chosen.length < entries.length && <button type="button" onClick={() => setChosen(entries.map((e) => wordKey(e.w)))} style={{ appearance: 'none', border: 0, background: 'transparent', color: 'var(--primary-d)', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: 12 }}>{L('Pick all', 'Elegir todas')}</button>}
                            {chosen.length > 0 && <button type="button" onClick={() => setChosen([])} style={{ appearance: 'none', border: 0, background: 'transparent', color: 'var(--primary-d)', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: 12 }}>{L('Clear', 'Quitar todo')}</button>}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(170px, 100%), 1fr))', gap: 8, maxHeight: 360, overflowY: 'auto', padding: 2 }}>
                            {entries.map((e) => {
                              const k = wordKey(e.w);
                              const on = chosen.includes(k);
                              const mark = isMissed(stats, e.w) ? '🎯' : isKnown(stats, e.w) ? '✅' : '';
                              return (
                                <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 12, background: on ? 'var(--primary-l)' : 'var(--surface)', border: '1.5px solid ' + (on ? 'var(--primary)' : 'var(--line)'), cursor: 'pointer', minWidth: 0 }}>
                                  <input type="checkbox" checked={on} onChange={() => toggleWord(k)} style={{ width: 18, height: 18, accentColor: 'var(--primary)', flexShrink: 0 }} />
                                  <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 700, overflowWrap: 'anywhere' }}>{e.w}</span>
                                  {mark && <span aria-hidden style={{ fontSize: 13 }}>{mark}</span>}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {filter !== 'choose' && pool.length > SIZES[0] && (
                      <div>
                        {step(3, L('How many?', '¿Cuántas?'))}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {SIZES.filter((n) => n < pool.length).map((n) => <button key={n} type="button" style={chip(size === n)} onClick={() => setSize(n)}>{n}</button>)}
                          <button type="button" style={chip(size == null || size >= pool.length)} onClick={() => setSize(null)}>{L('All', 'Todas')} ({pool.length})</button>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Btn kind="primary" icon={<span aria-hidden style={{ fontSize: 18, lineHeight: 1 }}>{meta.emoji}</span>} className="qk-full-sm" disabled={!pool.length} onClick={() => start()} style={{ fontSize: 17, padding: '14px 26px' }}>
                        {L(`Play: ${meta.en.title}`, `Jugar: ${meta.es.title}`)}{pool.length ? ` (${roundSize})` : ''}
                      </Btn>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {phase === 'playing' && round && list && (
            <div style={{ marginTop: 18 }}>
              {round.game === 'write'
                ? <WriteGame key={roundNo} items={round.items} lang={lang} wordLang={wordLang} minimal={minimal} label={list.title} onFinish={finish} />
                : <PickGame key={roundNo} items={round.items as PickItem[]} lang={lang} wordLang={wordLang} minimal={minimal} label={list.title} onFinish={finish} />}
            </div>
          )}

          {phase === 'done' && round && played && (
            <div style={{ marginTop: 18 }}>
              <WordResults game={round.game} played={played.played} bestStreak={played.bestStreak} minimal={minimal} lang={lang}
                onMissed={() => start(played.played.filter((p) => !p.ok).map((p) => ({ w: p.item.w, hint: p.item.hint })))}
                onAgain={() => start()} onOther={() => setPhase('setup')} onBack={() => router.push(backTo)} />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
