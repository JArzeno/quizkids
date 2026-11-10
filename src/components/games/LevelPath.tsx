'use client';
import React from 'react';
import { ICONS } from '@/components/ui/Icons';
import { Stars } from '@/components/ui/Stars';
import { GAME_MODES } from '@/lib/games';
import { LEVELS_PER_DAY, type Level, type LevelPath as Path } from '@/lib/levels';

/** Passed levels shown under the current one before "see earlier levels" */
const RECENT_DONE = 2;

/**
 * "My path": level 1 at the bottom, the level to play now in the middle, the next ones (still closed) on top.
 * The list is in level order for screen readers and drawn bottom-up.
 */
export default function LevelPath({ path, lang, minimal, subjectOf, onPlay }: {
  path: Path;
  lang: string;
  /** Parent turned rewards down: no stars */
  minimal: boolean;
  subjectOf: (subject: string) => { icon: string; label: string };
  onPlay: (level: Level) => void;
}) {
  const L = (en: string, es: string) => (lang === 'es' ? es : en);
  const [showAll, setShowAll] = React.useState(false);
  const done = path.levels.filter((l) => l.state === 'done');
  const hidden = showAll ? 0 : Math.max(0, done.length - RECENT_DONE);
  const shown = path.levels.slice(hidden);
  const left = Math.max(0, LEVELS_PER_DAY - path.doneToday);

  return (
    <div className="qk-card qk-path-card">
      <div className="qk-path-head">
        <div style={{ minWidth: 0 }}>
          <h2 className="qk-h2">{L('My path', 'Mi camino')}</h2>
          <p className="qk-path-sub">{L('Pass a level with each class. New levels open every day.', 'Pasa un nivel con cada clase. Cada día se abren niveles nuevos.')}</p>
        </div>
        <div className="qk-path-today" aria-label={L(`${path.doneToday} of ${LEVELS_PER_DAY} levels passed today`, `${path.doneToday} de ${LEVELS_PER_DAY} niveles pasados hoy`)}>
          <span className="qk-path-today-label">{L('Today', 'Hoy')}</span>
          <span className="qk-path-pips" aria-hidden>
            {Array.from({ length: LEVELS_PER_DAY }).map((_, i) => <i key={i} className={i < path.doneToday ? 'on' : undefined} />)}
          </span>
        </div>
      </div>

      <ol className="qk-path">
        {hidden > 0 && (
          <li className="qk-path-more">
            <button type="button" onClick={() => setShowAll(true)}>{L(`See levels 1–${hidden}`, `Ver niveles 1 al ${hidden}`)}</button>
          </li>
        )}
        {shown.map((lv) => {
          const info = subjectOf(lv.subject);
          const mode = GAME_MODES.find((m) => m.id === lv.mode)!;
          const game = lang === 'es' ? mode.es.title : mode.en.title;
          return (
            <li key={lv.n} className="qk-path-row" data-state={lv.state}>
              <span className="qk-path-node" aria-hidden>
                {lv.state === 'done' ? ICONS.check : lv.state === 'current' ? lv.n : lv.state === 'tomorrow' ? '🌙' : '🔒'}
              </span>
              <div className="qk-path-body">
                <div className="qk-path-meta">{L('Level', 'Nivel')} {lv.n} · {info.icon} {info.label}</div>
                <div className="qk-path-title">{lv.topic.title}</div>
                {lv.state === 'done' && !minimal && <Stars count={lv.stars} size={16} />}
                {lv.state === 'done' && minimal && <div className="qk-path-note">{L('Passed', 'Pasado')}</div>}
                {lv.state === 'current' && (
                  <button type="button" className="qk-btn qk-btn-primary qk-path-play" onClick={() => onPlay(lv)}>
                    <span aria-hidden>{mode.emoji}</span> {L('Play', 'Jugar')}: {game}
                  </button>
                )}
                {lv.state === 'tomorrow' && <div className="qk-path-note">{L(`You passed ${LEVELS_PER_DAY} levels today. This one opens tomorrow!`, `Hoy pasaste ${LEVELS_PER_DAY} niveles. ¡Este se abre mañana!`)}</div>}
                {lv.state === 'locked' && <div className="qk-path-note">{mode.emoji} {game}</div>}
              </div>
            </li>
          );
        })}
        {path.finished && (
          <li className="qk-path-row" data-state="tomorrow">
            <span className="qk-path-node" aria-hidden>🏆</span>
            <div className="qk-path-body">
              <div className="qk-path-title">{L('You passed every level!', '¡Pasaste todos los niveles!')}</div>
              <div className="qk-path-note">{L('New levels appear when a grown-up adds more classes.', 'Aparecen niveles nuevos cuando un adulto agrega más clases.')}</div>
            </div>
          </li>
        )}
      </ol>

      {!path.finished && left > 0 && left < LEVELS_PER_DAY && (
        <p className="qk-path-foot">{left === 1 ? L('1 more level today.', 'Te queda 1 nivel hoy.') : L(`${left} more levels today.`, `Te quedan ${left} niveles hoy.`)}</p>
      )}
    </div>
  );
}
