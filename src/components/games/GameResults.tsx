'use client';
import React from 'react';
import { Btn } from '@/components/ui/Btn';
import { ICONS } from '@/components/ui/Icons';
import { starsFor, type FillItem, type GameKind, type TfItem } from '@/lib/games';
import type { Played } from '@/components/games/GameBits';

const PASS = 70;

/** End of a round: score, stars, per-topic bars and the cards that were missed, with their answers */
export default function GameResults({ kind, played, bestStreak, minimal, saved, lang, onAgain, onOther, onBack }: {
  kind: GameKind;
  played: Played<TfItem | FillItem>[];
  bestStreak: number;
  minimal: boolean;
  /** False for sample cards: nothing was saved */
  saved: boolean;
  lang: string;
  onAgain: () => void;
  onOther: () => void;
  onBack: () => void;
}) {
  const L = (en: string, es: string) => (lang === 'es' ? es : en);
  const right = played.filter((p) => p.ok).length;
  const pct = played.length ? Math.round((right / played.length) * 100) : 0;
  const stars = starsFor(pct);
  const missed = played.filter((p) => !p.ok);
  const byTopic = new Map<string, { right: number; total: number }>();
  played.forEach((p) => {
    if (!p.item.topic) return;
    const row = byTopic.get(p.item.topic) || { right: 0, total: 0 };
    byTopic.set(p.item.topic, { right: row.right + (p.ok ? 1 : 0), total: row.total + 1 });
  });

  return (
    <div className="qk-slide-up" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 18 }}>
      <div className="qk-card" style={{ padding: 'clamp(18px, 4vw, 28px)', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%', display: 'grid', placeItems: 'center', background: `conic-gradient(${pct >= PASS ? 'var(--primary)' : 'var(--coral)'} ${pct * 3.6}deg, var(--surface-2) 0)`, flexShrink: 0 }}>
            <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'var(--surface)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24 }}>{pct}%</div>
          </div>
          <div style={{ flex: '1 1 220px', minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22 }}>
              {pct >= 90 ? L('Amazing! 🌟', '¡Increíble! 🌟') : pct >= PASS ? L('Great work! 👏', '¡Muy bien! 👏') : pct >= 50 ? L('Getting there! 💪', '¡Vas bien! 💪') : L('Let’s keep practicing 📚', 'Sigamos practicando 📚')}
            </div>
            <div style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 4 }}>
              {right}/{played.length} {L('right on the first try', 'bien al primer intento')}
              {bestStreak > 1 && !minimal ? ` · 🔥 ${L('best streak', 'mejor racha')} ${bestStreak}` : ''}
            </div>
            {!minimal && saved && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '4px 12px', borderRadius: 999, background: 'var(--honey-l)', color: '#7C5410', fontWeight: 700 }}>
                {React.cloneElement(ICONS.star as React.ReactElement<{ size?: number }>, { size: 16 })} +{stars}
              </div>
            )}
          </div>
        </div>

        {byTopic.size > 1 && (
          <div style={{ display: 'grid', gap: 8 }}>
            {Array.from(byTopic, ([name, r]) => {
              const p = Math.round((r.right / r.total) * 100);
              return (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: '1 1 140px', minWidth: 0, fontSize: 13, fontWeight: 600, overflowWrap: 'anywhere' }}>{name}</div>
                  <div className="qk-progress" style={{ flex: '2 1 120px' }}><span style={{ width: p + '%', background: p < PASS ? 'var(--coral)' : undefined }} /></div>
                  <span style={{ width: 42, textAlign: 'right', fontSize: 13, fontWeight: 700, color: p < PASS ? 'var(--coral)' : 'var(--primary-d)' }}>{p}%</span>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn kind="primary" icon={ICONS.shuffle} onClick={onAgain}>{L('Play again', 'Jugar otra vez')}</Btn>
          <Btn kind="soft" icon={ICONS.cards} onClick={onOther}>{L('Another way to learn', 'Otra forma de aprender')}</Btn>
          <Btn kind="ghost" icon={ICONS.back} onClick={onBack}>{L('Back to subject', 'Volver a la materia')}</Btn>
        </div>
      </div>

      {missed.length > 0 && (
        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 10 }}>
          <h2 className="qk-h2" style={{ margin: 0 }}>{L('Worth another look', 'Vale la pena repasar')}</h2>
          {missed.map((p, i) => (
            <div key={i} className="qk-card" style={{ padding: 14, display: 'grid', gap: 4 }}>
              {kind === 'tf' ? (
                <>
                  <div style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.4 }}>{(p.item as TfItem).s}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                    {(p.item as TfItem).a ? L('True', 'Verdadero') : L('False', 'Falso')}{(p.item as TfItem).fix ? ` · ${(p.item as TfItem).fix}` : ''}
                  </div>
                </>
              ) : (
                <div style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.5 }}>
                  {(p.item as FillItem).s.split('___')[0]}<span style={{ padding: '1px 8px', borderRadius: 8, background: 'var(--primary-l)', color: 'var(--primary-d)' }}>{(p.item as FillItem).a}</span>{(p.item as FillItem).s.split('___')[1]}
                </div>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
