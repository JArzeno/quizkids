'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ICONS } from '@/components/ui/Icons';
import { Btn, Chip } from '@/components/ui/Btn';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/store';
import { completePlanItem } from '@/lib/plan';
import { useT } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';
import type { Worksheet, WorksheetSection, WorksheetSectionType } from '@/types';
import { shuffledOrder, toWorksheet } from '@/lib/worksheet';

const FALLBACK_EN: Worksheet = {
  sections: [
    { type: 'mc', items: [
      { q: 'How many planets are in our solar system?', choices: ['6', '7', '8', '9'], a: 2 },
      { q: 'Which planet is closest to the Sun?', choices: ['Mercury', 'Venus', 'Earth', 'Mars'], a: 0 },
      { q: 'Which is the largest planet?', choices: ['Saturn', 'Jupiter', 'Neptune', 'Earth'], a: 1 },
    ] },
    { type: 'tf', items: [
      { s: 'The Sun is a star.', a: true },
      { s: 'Mars is called the Blue Planet.', a: false, fix: 'Mars is called the Red Planet.' },
      { s: 'Saturn has rings.', a: true },
    ] },
    { type: 'fill', bank: ['Earth', 'gravity', 'Moon', 'orbit'], items: [
      { s: 'We live on the planet ___.', a: 'Earth' },
      { s: 'The ___ goes around the Earth.', a: 'Moon' },
      { s: 'Planets ___ the Sun.', a: 'orbit' },
    ] },
    { type: 'match', items: [
      { left: 'Sun', right: 'A star that gives us light' },
      { left: 'Moon', right: 'Goes around the Earth' },
      { left: 'Jupiter', right: 'The biggest planet' },
      { left: 'Mercury', right: 'Closest to the Sun' },
    ] },
    { type: 'open', items: [
      { q: 'Why can people live on Earth but not on the Sun?', a: 'The Sun is far too hot. Earth has air, water, and the right temperature for life.', lines: 3 },
    ] },
  ],
  bonus: 'Draw your favorite planet and write 2 things you learned.',
};

const FALLBACK_ES: Worksheet = {
  sections: [
    { type: 'mc', items: [
      { q: '¿Cuántos planetas hay en nuestro sistema solar?', choices: ['6', '7', '8', '9'], a: 2 },
      { q: '¿Qué planeta está más cerca del Sol?', choices: ['Mercurio', 'Venus', 'Tierra', 'Marte'], a: 0 },
      { q: '¿Cuál es el planeta más grande?', choices: ['Saturno', 'Júpiter', 'Neptuno', 'Tierra'], a: 1 },
    ] },
    { type: 'tf', items: [
      { s: 'El Sol es una estrella.', a: true },
      { s: 'A Marte lo llaman el Planeta Azul.', a: false, fix: 'A Marte lo llaman el Planeta Rojo.' },
      { s: 'Saturno tiene anillos.', a: true },
    ] },
    { type: 'fill', bank: ['gravedad', 'Luna', 'órbita', 'Tierra'], items: [
      { s: 'Vivimos en el planeta ___.', a: 'Tierra' },
      { s: 'La ___ gira alrededor de la Tierra.', a: 'Luna' },
      { s: 'Cada planeta sigue una ___ alrededor del Sol.', a: 'órbita' },
    ] },
    { type: 'match', items: [
      { left: 'Sol', right: 'Una estrella que nos da luz' },
      { left: 'Luna', right: 'Gira alrededor de la Tierra' },
      { left: 'Júpiter', right: 'El planeta más grande' },
      { left: 'Mercurio', right: 'El más cercano al Sol' },
    ] },
    { type: 'open', items: [
      { q: '¿Por qué podemos vivir en la Tierra pero no en el Sol?', a: 'El Sol es demasiado caliente. La Tierra tiene aire, agua y la temperatura justa para la vida.', lines: 3 },
    ] },
  ],
  bonus: 'Dibuja tu planeta favorito y escribe 2 cosas que aprendiste.',
};

const INK = '#1F3326';
const MUTED = '#5b6e60';
const RULE = '#9aa79e';

const SECTION_COPY: Record<WorksheetSectionType, { en: [string, string]; es: [string, string] }> = {
  mc: { en: ['Multiple choice', 'Check the box next to the right answer.'], es: ['Opción múltiple', 'Marca la casilla de la respuesta correcta.'] },
  tf: { en: ['True or false', 'Circle True or False.'], es: ['Verdadero o falso', 'Encierra Verdadero o Falso.'] },
  fill: { en: ['Complete the sentence', 'Write the missing word on the line.'], es: ['Completa la oración', 'Escribe la palabra que falta en la línea.'] },
  match: { en: ['Match it', 'Write the letter of the match on the line, or draw a line.'], es: ['Relaciona', 'Escribe la letra correcta en la línea o une con una raya.'] },
  open: { en: ['Explain', 'Answer in your own words.'], es: ['Explica', 'Responde con tus propias palabras.'] },
};

export default function PdfClient() {
  const { lang, kids, activeKidId, studyParams, setMode, isDemo } = useStore();
  const contentLang = studyParams.contentLang ?? lang;
  const [marked, setMarked] = React.useState(false);
  const t = useT(lang);
  const es = lang === 'es';
  const FALLBACK = es ? FALLBACK_ES : FALLBACK_EN;
  const router = useRouter();
  const kid = kids.find((k) => k.id === activeKidId) || kids[0];
  const gradeNum = studyParams.grade.toUpperCase() === 'K' ? 0 : parseInt(studyParams.grade) || 3;

  React.useEffect(() => { setMode('kid'); }, []);

  const [data, setData] = React.useState<Worksheet | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [hidden, setHidden] = React.useState<Set<WorksheetSectionType>>(new Set());
  const [showKey, setShowKey] = React.useState(false);

  React.useEffect(() => {
    const fetchWorksheet = async () => {
      setLoading(true);
      setHidden(new Set());
      try {
        // Try loading from cached contentId first
        if (studyParams.contentId && !isDemo) {
          try {
            const supabase = createClient();
            const { data: cached } = await supabase
              .from('generated_content')
              .select('content, lang')
              .eq('id', studyParams.contentId)
              .single();
            // Only reuse assigned content if it is in the account's current language
            const ws = cached && (cached.lang || 'en') === contentLang ? toWorksheet(cached.content) : null;
            if (ws) {
              setData(ws);
              setLoading(false);
              return;
            }
          } catch (e) {
            console.warn('Could not load cached worksheet:', e);
          }
        }

        // Call API (also checks cache server-side)
        const res = await fetch('/api/generate/worksheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: studyParams.topic,
            grade: studyParams.grade,
            lang: contentLang,
            subject: studyParams.subject,
            source: studyParams.source,
          }),
        });
        setData((res.ok ? toWorksheet(await res.json()) : null) ?? FALLBACK);
      } catch {
        setData(FALLBACK);
      }
      setLoading(false);
    };
    fetchWorksheet();
  }, [studyParams.topic, studyParams.grade, studyParams.contentId, lang, contentLang]);

  const visible = data ? data.sections.filter((s) => !hidden.has(s.type)) : [];
  // Items are numbered across the whole sheet, so the answer key can point at them
  const starts = visible.reduce<number[]>((acc, s, i) => [...acc, i === 0 ? 1 : acc[i - 1] + visible[i - 1].items.length], []);
  const total = visible.reduce((n, s) => n + s.items.length, 0);

  const toggle = (type: WorksheetSectionType) => setHidden((h) => {
    const next = new Set(h);
    if (next.has(type)) next.delete(type);
    else if (data && data.sections.length - next.size > 1) next.add(type);
    return next;
  });

  const copy = (type: WorksheetSectionType) => SECTION_COPY[type][es ? 'es' : 'en'];
  const instruction = (s: WorksheetSection) => {
    if (s.type === 'fill' && s.bank?.length) return es ? 'Usa las palabras del recuadro para completar cada oración.' : 'Use the words in the box to complete each sentence.';
    if (s.type === 'tf' && gradeNum >= 3) return es ? 'Encierra Verdadero o Falso. Si es falso, corrígelo en la línea.' : 'Circle True or False. If it is false, fix it on the line.';
    return copy(s.type)[1];
  };

  return (
    <AppShell>
      <div className="qk-screen qk-page-enter">
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div className="qk-no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            <button className="qk-btn qk-btn-ghost" onClick={() => router.back()}>{ICONS.back} <span>{t('back')}</span></button>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {studyParams.planItemId && (
                <Btn kind="ghost" icon={ICONS.check} disabled={marked} onClick={() => { setMarked(true); void completePlanItem(studyParams.planItemId!, isDemo); router.push('/kids/home'); }}>{t('planMarkDone')}</Btn>
              )}
              <Btn kind="primary" icon={ICONS.printer} disabled={loading} onClick={() => window.print()}>{t('print')}</Btn>
            </div>
          </div>

          {!loading && data && (
            <div className="qk-no-print" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, margin: '0 auto 16px', maxWidth: 780 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-3)', marginRight: 2 }}>{es ? 'Incluir:' : 'Include:'}</span>
              {data.sections.map((s) => (
                <Chip key={s.type} on={!hidden.has(s.type)} onClick={() => toggle(s.type)}>
                  {!hidden.has(s.type) && ICONS.check}{copy(s.type)[0]} <span style={{ opacity: 0.6, fontWeight: 600 }}>{s.items.length}</span>
                </Chip>
              ))}
              <span style={{ width: 1, alignSelf: 'stretch', background: 'var(--line)', margin: '0 4px' }} />
              <Chip on={showKey} onClick={() => setShowKey((v) => !v)}>
                {showKey && ICONS.check}{es ? 'Hoja de respuestas' : 'Answer key'}
              </Chip>
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, paddingTop: 80 }}>
              <div className="qk-progress" style={{ width: 'min(280px, 100%)' }}><span style={{ width: '60%', animation: 'qk-pulse 1.2s ease infinite' }} /></div>
              <div style={{ fontSize: 16, color: 'var(--ink-3)', fontFamily: 'var(--font-display)' }}>{t('generating')}</div>
            </div>
          ) : data && (
            <>
              <div className="qk-paper" style={paperStyle}>
                <div className="qk-paper-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: `2px dashed ${INK}`, paddingBottom: 12, gap: 18 }}>
                  <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 26, lineHeight: 1.1 }}>{studyParams.topic}</div>
                    <div style={{ fontSize: 14, marginTop: 6 }}>{t(studyParams.subject)} · {es ? 'Grado ' : 'Grade '}{studyParams.grade}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 13, flex: '0 0 auto' }}>
                    <div>{es ? 'Nombre:' : 'Name:'} <span style={{ display: 'inline-block', borderBottom: `1.5px solid ${INK}`, minWidth: 120, marginLeft: 4 }}>{kid?.name || ''}</span></div>
                    <div style={{ marginTop: 6 }}>{es ? 'Fecha:' : 'Date:'} <span style={{ display: 'inline-block', borderBottom: `1.5px solid ${INK}`, minWidth: 120, marginLeft: 4 }} /></div>
                    <div style={{ marginTop: 6 }}>{es ? 'Puntos:' : 'Score:'} <span style={{ display: 'inline-block', borderBottom: `1.5px solid ${INK}`, minWidth: 48, marginLeft: 4 }} /> / {total}</div>
                  </div>
                </div>

                {visible.map((s, si) => (
                  <section key={s.type} style={{ marginTop: si === 0 ? 22 : 28 }}>
                    <div className="qk-ws-head" style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px 10px', marginBottom: 12 }}>
                      <span style={{ border: `1.5px solid ${INK}`, borderRadius: 999, padding: '1px 10px', fontSize: 12, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>{es ? 'Parte' : 'Part'} {si + 1}</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 19 }}>{copy(s.type)[0]}</span>
                      <span style={{ fontSize: 14, color: MUTED, flexBasis: '100%' }}>{instruction(s)}</span>
                    </div>
                    <SectionBody section={s} start={starts[si]} es={es} fixLines={gradeNum >= 3} />
                  </section>
                ))}

                {data.bonus && (
                  <div className="qk-ws-item" style={{ marginTop: 28, padding: 14, border: `1.5px dashed ${INK}`, borderRadius: 8, fontSize: 14 }}>
                    <div>⭐ {es ? 'Extra:' : 'Bonus:'} {data.bonus}</div>
                    <div style={{ height: 130 }} />
                  </div>
                )}

                <div style={{ marginTop: 24, fontSize: 11, color: MUTED, textAlign: 'center', fontFamily: 'ui-monospace, monospace' }}>
                  QuizKids · Generated for {kid?.name || '—'} · Grade {studyParams.grade} · {new Date().toLocaleDateString(es ? 'es' : 'en')}
                </div>
              </div>

              {showKey && (
                <div className="qk-paper qk-page-break" style={{ ...paperStyle, marginTop: 24 }}>
                  <div style={{ borderBottom: `2px dashed ${INK}`, paddingBottom: 12 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22 }}>{es ? 'Hoja de respuestas' : 'Answer key'}</div>
                    <div style={{ fontSize: 13, marginTop: 4, color: MUTED }}>{studyParams.topic} · {es ? 'Para papá y mamá' : 'For grown-ups'}</div>
                  </div>
                  {visible.map((s, si) => (
                    <div key={s.type} className="qk-ws-item" style={{ marginTop: 16 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{es ? 'Parte' : 'Part'} {si + 1} · {copy(s.type)[0]}</div>
                      <AnswerKey section={s} start={starts[si]} es={es} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}

const paperStyle: React.CSSProperties = { background: '#fff', color: INK, borderRadius: 8, boxShadow: 'var(--shadow-lg)', padding: '56px 60px', maxWidth: 780, margin: '0 auto', fontFamily: '"Patrick Hand", "Quicksand", sans-serif' };

const Box = ({ round }: { round?: boolean }) => (
  <span style={{ width: 18, height: 18, marginTop: 2, border: `1.5px solid ${INK}`, borderRadius: round ? 999 : 4, display: 'inline-block', flexShrink: 0 }} />
);
const Blank = ({ width = 120 }: { width?: number }) => (
  <span style={{ display: 'inline-block', minWidth: width, borderBottom: `1.5px solid ${INK}`, margin: '0 4px', transform: 'translateY(-3px)' }}>&nbsp;</span>
);
const Lines = ({ n }: { n: number }) => (
  <div style={{ marginTop: 4 }}>
    {Array.from({ length: n }, (_, i) => <div key={i} style={{ height: 30, borderBottom: `1px solid ${RULE}` }} />)}
  </div>
);
const Num = ({ n }: { n: number }) => <span style={{ fontWeight: 700 }}>{n}.</span>;

function SectionBody({ section: s, start, es, fixLines }: { section: WorksheetSection; start: number; es: boolean; fixLines: boolean }) {
  const list: React.CSSProperties = { margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14, fontSize: 16 };

  if (s.type === 'mc') return (
    <ol style={list}>
      {s.items.map((q, i) => (
        <li key={i} className="qk-ws-item">
          <div style={{ fontWeight: 700, fontSize: 17 }}>{start + i}. {q.q}</div>
          <div className="qk-stack-xs" style={{ marginTop: 6, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: 18, rowGap: 6, fontSize: 15 }}>
            {q.choices.map((ch, ci) => (
              <div key={ci} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 0 }}>
                <Box /><span>{String.fromCharCode(65 + ci)}. {ch}</span>
              </div>
            ))}
          </div>
        </li>
      ))}
    </ol>
  );

  if (s.type === 'tf') return (
    <ol style={list}>
      {s.items.map((it, i) => (
        <li key={i} className="qk-ws-item">
          <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '6px 16px' }}>
            <div style={{ flex: '1 1 260px', minWidth: 0 }}><Num n={start + i} /> {it.s}</div>
            <div style={{ display: 'flex', gap: 10, flex: '0 0 auto', fontSize: 14, fontWeight: 700 }}>
              {(es ? ['Verdadero', 'Falso'] : ['True', 'False']).map((w) => (
                <span key={w} style={{ border: `1.5px solid ${INK}`, borderRadius: 999, padding: '1px 12px' }}>{w}</span>
              ))}
            </div>
          </div>
          {fixLines && <div style={{ marginLeft: 22 }}><Lines n={1} /></div>}
        </li>
      ))}
    </ol>
  );

  if (s.type === 'fill') return (
    <>
      {s.bank && (
        <div className="qk-ws-item" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 22px', border: `1.5px solid ${INK}`, borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 16, fontWeight: 700 }}>
          {s.bank.map((w) => <span key={w}>{w}</span>)}
        </div>
      )}
      <ol style={list}>
        {s.items.map((it, i) => {
          const [before, after] = it.s.split('___');
          return (
            <li key={i} className="qk-ws-item" style={{ lineHeight: 1.9 }}>
              <Num n={start + i} /> {before}<Blank />{after}
            </li>
          );
        })}
      </ol>
    </>
  );

  if (s.type === 'match') {
    const order = shuffledOrder(s.items.length, s.items.map((x) => x.left).join('|'));
    return (
      <div className="qk-ws-item" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', columnGap: 'clamp(24px, 8vw, 64px)', rowGap: 12, fontSize: 16 }}>
        {s.items.map((it, i) => {
          const right = s.items[order[i]].right;
          return (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
                <Blank width={34} />
                <span style={{ flex: 1, minWidth: 0 }}><Num n={start + i} /> {it.left}</span>
                <span style={{ width: 7, height: 7, borderRadius: 99, background: INK, flexShrink: 0, alignSelf: 'center' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
                <span style={{ width: 7, height: 7, borderRadius: 99, background: INK, flexShrink: 0, alignSelf: 'center' }} />
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
          <Lines n={it.lines} />
        </li>
      ))}
    </ol>
  );
}

function AnswerKey({ section: s, start, es }: { section: WorksheetSection; start: number; es: boolean }) {
  const row = (n: number, answer: React.ReactNode, extra?: string) => (
    <div key={n} style={{ fontSize: 14, lineHeight: 1.5 }}>
      <span style={{ fontWeight: 700 }}>{n}.</span> {answer}{extra && <span style={{ color: MUTED }}> — {extra}</span>}
    </div>
  );
  const wrap = (rows: React.ReactNode[]) => <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>{rows}</div>;

  if (s.type === 'mc') return wrap(s.items.map((q, i) => row(start + i, <b>{String.fromCharCode(65 + q.a)}</b>, q.choices[q.a])));
  if (s.type === 'tf') return wrap(s.items.map((it, i) => row(start + i, <b>{it.a ? (es ? 'Verdadero' : 'True') : (es ? 'Falso' : 'False')}</b>, it.fix)));
  if (s.type === 'fill') return wrap(s.items.map((it, i) => row(start + i, <b>{it.a}</b>)));
  if (s.type === 'match') {
    const order = shuffledOrder(s.items.length, s.items.map((x) => x.left).join('|'));
    return wrap(s.items.map((it, i) => row(start + i, <b>{String.fromCharCode(65 + order.indexOf(i))}</b>, `${it.left} → ${it.right}`)));
  }
  return wrap(s.items.map((it, i) => row(start + i, it.a || '—')));
}
