'use client';
import React from 'react';
import { Btn } from '@/components/ui/Btn';
import { ICONS } from '@/components/ui/Icons';
import { starsFor } from '@/lib/games';
import { spellDiff, type WordGame } from '@/lib/words';
import { DiffLine, type WordPlayed } from '@/components/words/WordBits';

const PASS = 70;

/** End of a word round: score, stars, and every word that was missed with how it is spelled */
export default function WordResults({ game, played, bestStreak, minimal, lang, onMissed, onAgain, onOther, onBack }: {
  game: WordGame;
  played: WordPlayed[];
  bestStreak: number;
  minimal: boolean;
  lang: string;
  /** Plays a round with only the missed words */
  onMissed: () => void;
  onAgain: () => void;
  onOther: () => void;
  onBack: () => void;
}) {
  const L = (en: string, es: string) => (lang === 'es' ? es : en);
  const right = played.filter((p) => p.ok).length;
  const pct = played.length ? Math.round((right / played.length) * 100) : 0;
  const missed = played.filter((p) => !p.ok);

  return (
    <div className="qk-slide-up" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 18 }}>
      <div className="qk-card" style={{ padding: 'clamp(18px, 4vw, 28px)', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%', display: 'grid', placeItems: 'center', background: `conic-gradient(${pct >= PASS ? 'var(--primary)' : 'var(--coral)'} ${pct * 3.6}deg, var(--surface-2) 0)`, flexShrink: 0 }}>
            <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'var(--surface)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24 }}>{pct}%</div>
          </div>
          <div style={{ flex: '1 1 220px', minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22 }}>
              {pct === 100 ? L('Perfect spelling! 🏆', '¡Ortografía perfecta! 🏆') : pct >= 90 ? L('Amazing! 🌟', '¡Increíble! 🌟') : pct >= PASS ? L('Great work! 👏', '¡Muy bien! 👏') : pct >= 50 ? L('Getting there! 💪', '¡Vas bien! 💪') : L('Let’s keep practicing 📚', 'Sigamos practicando 📚')}
            </div>
            <div style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 4 }}>
              {right}/{played.length} {L('right on the first try', 'bien al primer intento')}
              {bestStreak > 1 && !minimal ? ` · 🔥 ${L('best streak', 'mejor racha')} ${bestStreak}` : ''}
            </div>
            {!minimal && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '4px 12px', borderRadius: 999, background: 'var(--honey-l)', color: 'var(--honey-d)', fontWeight: 700 }}>
                {React.cloneElement(ICONS.star as React.ReactElement<{ size?: number }>, { size: 16 })} +{starsFor(pct)}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {missed.length > 0 && <Btn kind="primary" icon={<span aria-hidden>🎯</span>} onClick={onMissed}>{L(`Practice the ${missed.length} I missed`, `Practicar las ${missed.length} que fallé`)}</Btn>}
          <Btn kind={missed.length ? 'soft' : 'primary'} icon={ICONS.shuffle} onClick={onAgain}>{L('More words', 'Más palabras')}</Btn>
          <Btn kind="ghost" icon={ICONS.cards} onClick={onOther}>{L('Change game', 'Cambiar juego')}</Btn>
          <Btn kind="ghost" icon={ICONS.back} onClick={onBack}>{L('Back', 'Volver')}</Btn>
        </div>
      </div>

      {missed.length > 0 && (
        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 10 }}>
          <h2 className="qk-h2" style={{ margin: 0 }}>{L('Words to go over', 'Palabras para repasar')}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))', gap: 10 }}>
            {missed.map((p, i) => {
              const diff = game === 'write' && p.answer ? spellDiff(p.item.w, p.answer) : null;
              return (
                <div key={i} className="qk-card" style={{ padding: 14, display: 'grid', gap: 6 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--primary-d)', overflowWrap: 'anywhere' }}>✓ {p.item.w}</div>
                  {p.answer && (
                    <div style={{ fontSize: 14, color: 'var(--ink-3)' }}>
                      {game === 'write' ? L('You wrote', 'Escribiste') : L('You picked', 'Elegiste')}:{' '}
                      {diff ? <DiffLine tokens={diff.got} sep={diff.sep} tone="wrong" /> : <span style={{ color: '#B23A22', textDecoration: 'line-through' }}>{p.answer}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
