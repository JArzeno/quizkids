'use client';
import React from 'react';
import { Btn } from '@/components/ui/Btn';
import { ICONS } from '@/components/ui/Icons';
import { MAX_WORDS, dateLabel, listProgress, loadWordLists, parseWordText, removeWordList, saveWordList } from '@/lib/words';
import { daysUntil } from '@/lib/tests';
import type { ContentLang } from '@/lib/languages';
import type { Kid, WordList } from '@/types';

/** Words (or sentences) the kid practices spelling in this subject: add, edit and remove lists, see the hard words */
export default function WordListsPanel({ kid, subject, lang, wordLang, isDemo, onPractice }: {
  kid: Pick<Kid, 'id' | 'name'>;
  subject: string;
  /** Language of the app */
  lang: string;
  /** Language new lists are read aloud in */
  wordLang: ContentLang;
  isDemo: boolean;
  onPractice: (list: WordList) => void;
}) {
  const L = (en: string, es: string) => (lang === 'es' ? es : en);
  const [lists, setLists] = React.useState<WordList[]>([]);
  /** The list being edited, 'new' for a new one */
  const [editing, setEditing] = React.useState<WordList | 'new' | null>(null);
  const [title, setTitle] = React.useState('');
  const [date, setDate] = React.useState('');
  const [text, setText] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    loadWordLists(kid.id, subject, isDemo)
      .then((all) => { if (!cancelled) setLists(all); })
      .catch((e) => { console.warn('Could not load word lists:', e); if (!cancelled) setError(L("Couldn't load the word lists. If this is new, run migration 013_word_lists.sql.", 'No pudimos cargar las listas de palabras. Si es nuevo, corre la migración 013_word_lists.sql.')); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kid.id, subject, isDemo]);

  const words = parseWordText(text);

  const open = (list: WordList | 'new') => {
    setEditing(list);
    setError(null);
    setTitle(list === 'new' ? '' : list.title);
    setDate(list === 'new' ? '' : list.testDate || '');
    setText(list === 'new' ? '' : list.words.join('\n'));
  };

  const save = async () => {
    if (!editing || !words.length) return;
    setBusy(true); setError(null);
    try {
      const existing = editing === 'new' ? undefined : editing;
      const saved = await saveWordList(kid.id, subject, { title: title.trim() || L('Spelling words', 'Palabras para practicar'), words, testDate: date || undefined, lang: existing?.lang ?? wordLang }, isDemo, existing);
      setLists((all) => (existing ? all.map((l) => (l.id === saved.id ? saved : l)) : [saved, ...all]));
      setEditing(null);
    } catch {
      setError(L("Couldn't save the list. Please try again.", 'No pudimos guardar la lista. Intenta de nuevo.'));
    }
    setBusy(false);
  };

  const remove = async (list: WordList) => {
    if (!window.confirm(L(`Delete "${list.title}"? Its practice results are deleted too.`, `¿Eliminar "${list.title}"? También se borran sus resultados de práctica.`))) return;
    setError(null);
    if (await removeWordList(kid.id, list.id, isDemo)) setLists((all) => all.filter((l) => l.id !== list.id));
    else setError(L("Couldn't delete that list.", 'No pudimos eliminar esa lista.'));
  };

  const smallBtn: React.CSSProperties = { fontSize: 12, padding: '6px 10px' };
  const label: React.CSSProperties = { display: 'grid', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--ink-2)' };

  return (
    <div className="qk-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px', minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>✏️ {L('Spelling words', 'Palabras para practicar')}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
            {L(`For dictations and spelling contests. Add the words (or sentences) and ${kid.name} practices them by listening and writing them, or by picking the one spelled right.`,
              `Para dictados y concursos de ortografía, como la Olimpiada de Lengua. Agrega las palabras (u oraciones) y ${kid.name} las practica escuchándolas y escribiéndolas, o eligiendo la que está bien escrita.`)}
          </div>
        </div>
        {!editing && <Btn kind="primary" icon={ICONS.plus} style={smallBtn} onClick={() => open('new')}>{L('New list', 'Nueva lista')}</Btn>}
      </div>

      {error && <div style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--coral-l)', color: 'var(--coral-d)', fontWeight: 600, fontSize: 13 }}>{error}</div>}

      {editing && (
        <form onSubmit={(e) => { e.preventDefault(); void save(); }} style={{ padding: 14, background: 'var(--surface-2)', borderRadius: 14, display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: 12 }}>
            <label style={label}>
              {L('Name', 'Nombre')}
              <input className="qk-input" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder={L('e.g. Spelling bee: words', 'Ej. Olimpiada: dictado de palabras')} />
            </label>
            <label style={label}>
              {L('Dictation day (optional)', 'Día del dictado (opcional)')}
              <input className="qk-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
          </div>
          <label style={label}>
            {L('Words', 'Palabras')}
            <textarea className="qk-input" value={text} onChange={(e) => setText(e.target.value)} rows={8} spellCheck={false}
              placeholder={L('One word or sentence per line, or words separated by commas:\nknight\nreceive\nthrough (We walked through the park)', 'Una palabra u oración por línea, o palabras separadas por comas:\nhormiga\nzanahoria\nvaca, huevo, jirafa\ntuvo (Él tuvo mucha suerte)')}
              style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }} />
          </label>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>
            {L('Tip: for words that sound alike, add a sentence in parentheses so it is read aloud with it: ',
              'Consejo: para palabras que suenan igual, agrega una oración entre paréntesis y se leerá con ella: ')}
            <strong>{L('their (It is their house)', 'tuvo (Él tuvo suerte)')}</strong>
          </div>
          {words.length > 0 && (
            <div style={{ display: 'grid', gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)' }}>{words.length} {words.length === 1 ? L('word', 'palabra') : L('words', 'palabras')}{words.length >= MAX_WORDS ? ` (${L('max', 'máx.')} ${MAX_WORDS})` : ''}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxHeight: 120, overflowY: 'auto' }}>
                {words.map((w) => <span key={w} style={{ padding: '2px 8px', borderRadius: 999, fontSize: 12, background: 'var(--surface)', border: '1px solid var(--line)' }}>{w}</span>)}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Btn kind="primary" type="submit" icon={ICONS.check} disabled={busy || !words.length}>{busy ? L('Saving…', 'Guardando…') : L('Save list', 'Guardar lista')}</Btn>
            <Btn kind="ghost" type="button" onClick={() => setEditing(null)} disabled={busy}>{L('Cancel', 'Cancelar')}</Btn>
          </div>
        </form>
      )}

      {lists.length === 0 && !editing && !error && (
        <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{L('No word lists yet.', 'Aún no hay listas de palabras.')}</div>
      )}

      {lists.length > 0 && (
        <div style={{ display: 'grid', gap: 8 }}>
          {lists.map((list) => {
            const p = listProgress(list);
            const upcoming = list.testDate ? daysUntil(list.testDate) >= 0 : false;
            return (
              <div key={list.id} style={{ padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 12, display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 180px', minWidth: 0, fontSize: 14, fontWeight: 700, overflowWrap: 'anywhere' }}>{list.title}</div>
                  {list.testDate && <span style={{ padding: '2px 9px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: upcoming ? 'var(--honey-l)' : 'var(--surface)', color: upcoming ? 'var(--honey-d)' : 'var(--ink-3)' }}>📅 {dateLabel(list.testDate, lang)}</span>}
                  <span style={{ padding: '2px 9px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: p.known ? 'var(--primary-l)' : 'var(--surface)', color: p.known ? 'var(--primary-d)' : 'var(--ink-3)' }}>
                    ✅ {p.known}/{p.total} {L('known', 'dominadas')}
                  </span>
                </div>
                {p.missed.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--coral)' }}>🎯 {L('To go over:', 'Para repasar:')}</span>
                    {p.missed.slice(0, 20).map((w) => <span key={w} style={{ padding: '2px 8px', borderRadius: 999, fontSize: 12, background: 'var(--coral-l)', border: '1px solid var(--coral)', color: 'var(--coral)', fontWeight: 700 }}>{w}</span>)}
                    {p.missed.length > 20 && <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>+{p.missed.length - 20}</span>}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Btn kind="primary" icon={<span aria-hidden>✏️</span>} style={smallBtn} onClick={() => onPractice(list)}>{L('Practice', 'Practicar')}</Btn>
                  <Btn kind="ghost" style={smallBtn} onClick={() => open(list)} disabled={!!editing}>{L('Edit words', 'Editar palabras')}</Btn>
                  <button aria-label={L('Delete list', 'Eliminar lista')} title={L('Delete list', 'Eliminar lista')} onClick={() => remove(list)} style={{ appearance: 'none', border: 0, background: 'transparent', color: 'var(--ink-3)', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 6, marginLeft: 'auto' }}>{ICONS.trash}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
