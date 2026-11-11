'use client';
import React from 'react';
import { Btn } from '@/components/ui/Btn';
import { ICONS } from '@/components/ui/Icons';
import { Feedback, GameHeader, RetryPill, useRound } from '@/components/games/GameBits';
import { DiffLine, ListenButtons, spoken, type WordPlayed } from '@/components/words/WordBits';
import { useSpeech } from '@/lib/speech';
import { isRight, maskedHint, spellDiff, spellTips, type WordEntry } from '@/lib/words';

/** Letters that are hard to type on a plain keyboard, per language */
const EXTRA_KEYS: Record<string, string[]> = {
  es: ['á', 'é', 'í', 'ó', 'ú', 'ü', 'ñ'],
  fr: ['é', 'è', 'ê', 'à', 'â', 'ç', 'ù', 'û', 'ô', 'î', 'ë', 'ï'],
};

/** Dictation: the word is read aloud (or flashed, without a voice), the kid writes it and checks */
export default function WriteGame({ items, lang, wordLang, minimal, label, onFinish }: {
  items: WordEntry[];
  /** Language of the app, for the buttons */
  lang: string;
  /** Language of the words, for the voice and the accent keys */
  wordLang: string;
  minimal: boolean;
  label?: string;
  onFinish: (played: WordPlayed[], stars: number, bestStreak: number) => void;
}) {
  const L = (en: string, es: string) => (lang === 'es' ? es : en);
  const answers = React.useRef<Record<number, string>>({});
  const round = useRound(items, (played, stars, best) => onFinish(played.map((p, i) => ({ ...p, answer: answers.current[i] })), stars, best));
  const { turn } = round;
  const speech = useSpeech(wordLang);
  const [text, setText] = React.useState('');
  const [checked, setChecked] = React.useState(false);
  const [ok, setOk] = React.useState(false);
  const [peek, setPeek] = React.useState(false);
  const [caps, setCaps] = React.useState(false);
  const field = React.useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const long = !!turn && /\s/.test(turn.item.w);

  // Each new card is read aloud once, and the box is ready to type in
  React.useEffect(() => {
    if (!turn) return;
    if (speech.state === 'ready') speech.say(spoken(turn.item));
    field.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round.pos, speech.state]);

  // Without a voice the word is shown for a moment (look, cover, write)
  React.useEffect(() => {
    if (!peek) return;
    const id = setTimeout(() => { setPeek(false); field.current?.focus(); }, 2500);
    return () => clearTimeout(id);
  }, [peek]);

  if (!turn) return null;
  const { item } = turn;
  const hint = maskedHint(item);
  const keys = (EXTRA_KEYS[wordLang] || []).map((k) => (caps ? k.toUpperCase() : k));

  const check = () => {
    if (checked || !text.trim()) return;
    const right = isRight(item.w, text);
    if (!turn.retry) answers.current[turn.id] = text.trim();
    setOk(right);
    setChecked(true);
    round.record(right);
  };
  const next = () => { setText(''); setChecked(false); setOk(false); setPeek(false); round.advance(); };

  const insert = (ch: string) => {
    const el = field.current;
    const s = el?.selectionStart ?? text.length;
    const e = el?.selectionEnd ?? text.length;
    setText(text.slice(0, s) + ch + text.slice(e));
    setCaps(false);
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(s + ch.length, s + ch.length); });
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    e.preventDefault();
    if (checked) next(); else check();
  };

  const diff = checked && !ok ? spellDiff(item.w, text) : null;
  const tips = checked && !ok ? spellTips(item.w, text, lang) : [];
  const boxStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', font: 'inherit', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: long ? 'clamp(18px, 3vw, 22px)' : 'clamp(26px, 5vw, 36px)',
    textAlign: long ? 'left' : 'center', padding: long ? '12px 14px' : '10px 14px', borderRadius: 16, outline: 'none', resize: 'vertical',
    border: '2.5px solid ' + (checked ? (ok ? 'var(--primary)' : 'var(--coral)') : 'var(--ink-3)'),
    background: checked ? (ok ? 'var(--primary-l)' : 'var(--coral-l)') : 'var(--surface)', color: 'var(--ink)',
  };
  const shared = {
    value: text, disabled: checked, onKeyDown: onKey, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setText(e.target.value),
    autoComplete: 'off', autoCorrect: 'off', autoCapitalize: 'off', spellCheck: false, 'aria-label': L('Write it here', 'Escríbela aquí'),
    placeholder: L('Write it here…', 'Escríbela aquí…'), style: boxStyle,
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 18 }}>
      <GameHeader pos={round.pos} total={round.total} stars={round.stars} streak={round.streak} minimal={minimal} lang={lang} label={label} />

      <div key={round.pos} className={checked && !ok ? 'qk-card qk-shake' : 'qk-card qk-bounce-in'}
        style={{ padding: 'clamp(18px, 4vw, 28px)', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 16, borderColor: checked ? (ok ? 'var(--primary)' : 'var(--coral)') : 'var(--line)', boxShadow: checked ? `0 0 0 6px ${ok ? 'var(--primary-l)' : 'var(--coral-l)'}, var(--shadow)` : 'var(--shadow)', transition: 'box-shadow .25s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span className="qk-eyebrow">{long ? L('Write the sentence', 'Escribe la oración') : L('Write the word', 'Escribe la palabra')}</span>
          {turn.retry && <RetryPill lang={lang} />}
        </div>

        {speech.state === 'none' ? (
          <div style={{ display: 'grid', justifyItems: 'center', gap: 8, minHeight: 64 }}>
            {peek
              ? <div className="qk-bounce-in" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: long ? 22 : 34, textAlign: 'center', overflowWrap: 'anywhere' }}>{item.w}</div>
              : !checked && <Btn kind="soft" onClick={() => setPeek(true)} icon={<span aria-hidden>👀</span>}>{L('Look at it', 'Mírala')}</Btn>}
            {!peek && !checked && <div style={{ fontSize: 13, color: 'var(--ink-3)', textAlign: 'center' }}>{L('Look, then write it from memory.', 'Mírala y luego escríbela de memoria.')}</div>}
          </div>
        ) : (
          <ListenButtons lang={lang} big onSay={(slow) => speech.say(spoken(item), slow)} />
        )}

        {hint && <div style={{ textAlign: 'center', fontSize: 15, color: 'var(--ink-2)', fontStyle: 'italic' }}>“{hint}”</div>}

        <form onSubmit={(e) => { e.preventDefault(); if (checked) next(); else check(); }} style={{ display: 'grid', gap: 10 }}>
          {long ? <textarea ref={field} rows={3} {...shared} /> : <input ref={field} type="text" {...shared} />}
          {!checked && keys.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              {keys.map((k) => (
                <button key={k} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insert(k)} aria-label={k}
                  style={{ appearance: 'none', font: 'inherit', fontWeight: 700, fontSize: 18, minWidth: 42, height: 42, borderRadius: 12, border: '2px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', cursor: 'pointer', boxShadow: '0 2px 0 var(--line)' }}>{k}</button>
              ))}
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setCaps((c) => !c)} aria-pressed={caps} title={L('Capital letters', 'Mayúsculas')}
                style={{ appearance: 'none', font: 'inherit', fontWeight: 700, fontSize: 14, minWidth: 42, height: 42, borderRadius: 12, border: '2px solid ' + (caps ? 'var(--ink)' : 'var(--line)'), background: caps ? 'var(--surface-2)' : 'var(--surface)', color: 'var(--ink)', cursor: 'pointer' }}>{caps ? 'ABC' : 'abc'}</button>
            </div>
          )}
        </form>
      </div>

      {checked && (
        <Feedback ok={ok} lang={lang}>
          {diff && (
            <div style={{ display: 'grid', gap: 6, fontSize: 18 }}>
              <div><span style={{ fontSize: 13, fontWeight: 600, marginRight: 8 }}>{L('You wrote:', 'Escribiste:')}</span><DiffLine tokens={diff.got} sep={diff.sep} tone="wrong" /></div>
              <div><span style={{ fontSize: 13, fontWeight: 600, marginRight: 8 }}>{L("It's spelled:", 'Se escribe:')}</span><DiffLine tokens={diff.want} sep={diff.sep} tone="right" /></div>
              {tips.map((t) => <div key={t} style={{ fontSize: 14 }}>💡 {t}</div>)}
            </div>
          )}
        </Feedback>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {!checked
          ? <Btn kind="primary" icon={ICONS.check} disabled={!text.trim()} onClick={check} style={{ opacity: text.trim() ? 1 : 0.5 }}>{L('Check', 'Revisar')}</Btn>
          : <Btn kind="primary" iconRight={ICONS.next} onClick={next}>{round.pos + 1 >= round.total ? L('See results', 'Ver resultados') : L('Next word', 'Siguiente')}</Btn>}
      </div>
    </div>
  );
}
