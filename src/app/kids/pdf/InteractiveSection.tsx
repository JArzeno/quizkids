'use client';
import React from 'react';
import type { WorksheetSection } from '@/types';
import { answerKey, matchOrder, normalizeAnswer, type Verdict, type WorksheetAnswers } from '@/lib/worksheetGrade';

const INK = '#1F3326';
const MUTED = '#5b6e60';

interface Props {
  section: WorksheetSection;
  start: number;
  es: boolean;
  /** Grade 3+: a false statement asks for the corrected sentence */
  fixLines: boolean;
  answers: WorksheetAnswers;
  onAnswer: (key: string, value: string) => void;
  /** Set once the sheet is checked: one verdict per item. Answers lock and the right ones show. */
  verdicts?: Verdict[];
}

const Num = ({ n }: { n: number }) => <span style={{ fontWeight: 700 }}>{n}.</span>;

/** ✓ / ✗ beside an item once the sheet is checked */
function Mark({ v, es }: { v?: Verdict; es: boolean }) {
  if (!v || v === 'open') return null;
  const ok = v === 'right';
  return (
    <span role="img" aria-label={ok ? (es ? 'Correcto' : 'Correct') : v === 'blank' ? (es ? 'Sin responder' : 'Not answered') : (es ? 'Incorrecto' : 'Not quite')}
      style={{ marginLeft: 8, fontWeight: 700, color: ok ? 'var(--primary)' : 'var(--coral)', whiteSpace: 'nowrap' }}>
      {ok ? '✓' : v === 'blank' ? (es ? '— sin responder' : '— not answered') : '✗'}
    </span>
  );
}

const reveal = (text: React.ReactNode) => <div style={{ marginTop: 4, fontSize: 14, color: 'var(--primary-d)', fontWeight: 700 }}>✔ {text}</div>;

export function InteractiveSection({ section: s, start, es, fixLines, answers, onAnswer, verdicts }: Props) {
  const locked = !!verdicts;
  const ans = (i: number) => answers[answerKey(s.type, i)] ?? '';
  const set = (i: number, v: string) => onAnswer(answerKey(s.type, i), v);
  const list: React.CSSProperties = { margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 16, fontSize: 16 };
  const tone = (v?: Verdict) => (v === 'right' ? ' right' : v === 'wrong' || v === 'blank' ? ' wrong' : '');

  if (s.type === 'mc') return (
    <ol style={list}>
      {s.items.map((q, i) => (
        <li key={i} className="qk-ws-item">
          <div style={{ fontWeight: 700, fontSize: 17 }}>{start + i}. {q.q}<Mark v={verdicts?.[i]} es={es} /></div>
          <div role="radiogroup" aria-label={q.q} className="qk-stack-xs" style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, fontSize: 15 }}>
            {q.choices.map((ch, ci) => {
              const picked = ans(i) === String(ci);
              const cls = locked ? (ci === q.a ? ' right' : picked ? ' wrong' : '') : picked ? ' on' : '';
              return (
                <label key={ci} className={`qk-ws-opt${cls}${locked ? ' locked' : ''}`}>
                  <input type="radio" name={`ws-mc-${i}`} checked={picked} disabled={locked} onChange={() => set(i, String(ci))} style={{ accentColor: INK, marginTop: 3 }} />
                  <span>{String.fromCharCode(65 + ci)}. {ch}</span>
                </label>
              );
            })}
          </div>
        </li>
      ))}
    </ol>
  );

  if (s.type === 'tf') return (
    <ol style={list}>
      {s.items.map((it, i) => {
        const v = verdicts?.[i];
        const pick = ans(i);
        return (
          <li key={i} className="qk-ws-item">
            <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px 16px' }}>
              <div style={{ flex: '1 1 260px', minWidth: 0 }}><Num n={start + i} /> {it.s}<Mark v={v} es={es} /></div>
              <div role="group" aria-label={it.s} style={{ display: 'flex', gap: 10, flex: '0 0 auto', fontSize: 14, fontWeight: 700 }}>
                {([['true', es ? 'Verdadero' : 'True'], ['false', es ? 'Falso' : 'False']] as const).map(([val, label]) => {
                  const picked = pick === val;
                  const cls = locked ? ((val === 'true') === it.a ? ' right' : picked ? ' wrong' : '') : picked ? ' on' : '';
                  return (
                    <button key={val} type="button" aria-pressed={picked} disabled={locked} onClick={() => set(i, val)} className={`qk-ws-pill${cls}`}>{label}</button>
                  );
                })}
              </div>
            </div>
            {fixLines && pick === 'false' && !locked && (
              <input className="qk-ws-line" style={{ marginTop: 8, marginLeft: 22, width: 'calc(100% - 22px)' }} autoComplete="off" spellCheck={false}
                placeholder={es ? 'Corrígelo aquí…' : 'Fix it here…'} aria-label={es ? 'Corrige la oración' : 'Fix the sentence'}
                value={answers[`${answerKey('tf', i)}.fix`] ?? ''} onChange={(e) => onAnswer(`${answerKey('tf', i)}.fix`, e.target.value)} />
            )}
            {locked && (
              <div style={{ marginLeft: 22 }}>
                {fixLines && answers[`${answerKey('tf', i)}.fix`]?.trim() && <div style={{ marginTop: 4, fontSize: 14, color: MUTED }}>{es ? 'Tu corrección:' : 'Your fix:'} {answers[`${answerKey('tf', i)}.fix`]}</div>}
                {!it.a && it.fix && reveal(it.fix)}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );

  if (s.type === 'fill') {
    const used = new Set(s.items.map((_, i) => normalizeAnswer(ans(i))));
    // Tapping a word in the box drops it into the first empty blank
    const drop = (w: string) => {
      const next = s.items.findIndex((_, i) => ans(i).trim() === '');
      if (next >= 0) set(next, w);
    };
    return (
      <>
        {s.bank && (
          <div className="qk-ws-item" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 12px', border: `1.5px solid ${INK}`, borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 16, fontWeight: 700 }}>
            {s.bank.map((w) => (
              <button key={w} type="button" disabled={locked} onClick={() => drop(w)} className={`qk-ws-word${used.has(normalizeAnswer(w)) ? ' used' : ''}`}>{w}</button>
            ))}
          </div>
        )}
        <ol style={list}>
          {s.items.map((it, i) => {
            const [before, after] = it.s.split('___');
            const v = verdicts?.[i];
            return (
              <li key={i} className="qk-ws-item" style={{ lineHeight: 1.9 }}>
                <Num n={start + i} /> {before}
                <input className={`qk-ws-line${tone(v)}`} style={{ width: 140, maxWidth: '100%', margin: '0 4px', textAlign: 'center' }} autoComplete="off" autoCapitalize="off" spellCheck={false}
                  aria-label={`${es ? 'Espacio' : 'Blank'} ${start + i}`} value={ans(i)} readOnly={locked} onChange={(e) => set(i, e.target.value)} />
                {after}<Mark v={v} es={es} />
                {(v === 'wrong' || v === 'blank') && reveal(it.a)}
              </li>
            );
          })}
        </ol>
      </>
    );
  }

  if (s.type === 'match') {
    const order = matchOrder(s);
    return (
      <div className="qk-ws-item" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', columnGap: 'clamp(16px, 6vw, 48px)', rowGap: 14, fontSize: 16 }}>
        {s.items.map((it, i) => {
          const right = s.items[order[i]].right;
          const v = verdicts?.[i];
          return (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexWrap: 'wrap' }}>
                <select className={`qk-ws-select${tone(v)}`} aria-label={`${it.left}: ${es ? 'letra' : 'letter'}`} value={ans(i)} disabled={locked} onChange={(e) => set(i, e.target.value)}>
                  <option value="">–</option>
                  {s.items.map((_, ci) => <option key={ci} value={String(ci)}>{String.fromCharCode(65 + ci)}</option>)}
                </select>
                <span style={{ flex: 1, minWidth: 0 }}><Num n={start + i} /> {it.left}<Mark v={v} es={es} /></span>
                {(v === 'wrong' || v === 'blank') && <span style={{ flexBasis: '100%', fontSize: 14, color: 'var(--primary-d)', fontWeight: 700 }}>✔ {String.fromCharCode(65 + order.indexOf(i))}</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
                <span style={{ minWidth: 0 }}><span style={{ fontWeight: 700 }}>{String.fromCharCode(65 + i)}.</span> {right}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <ol style={list}>
      {s.items.map((it, i) => (
        <li key={i} className="qk-ws-item">
          <div style={{ fontWeight: 700, fontSize: 17 }}>{start + i}. {it.q}</div>
          <textarea className="qk-ws-area" rows={it.lines} aria-label={it.q} placeholder={es ? 'Escribe tu respuesta…' : 'Type your answer…'} value={ans(i)} readOnly={locked} onChange={(e) => set(i, e.target.value)} />
          {locked && it.a && (
            <div style={{ marginTop: 6, fontSize: 14, color: MUTED }}>
              <b style={{ color: 'var(--primary-d)' }}>{es ? 'Compárala con esta respuesta:' : 'Compare with this answer:'}</b> {it.a}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
