'use client';
import React from 'react';
import { ICONS } from '@/components/ui/Icons';
import { LoadingBar } from '@/components/ui/LoadingBar';
import { Btn } from '@/components/ui/Btn';
import { KIT_PARTS, MAX_TEST_TOPICS, defaultTestTopics, topicsInTests, type KitPart } from '@/lib/tests';
import type { KidTest, KidTopic } from '@/types';

export type PartState = 'waiting' | 'done' | 'failed';

export interface ExamSetupValue {
  title: string;
  /** Titles of the picked topics */
  picked: string[];
  /** yyyy-mm-dd or '' */
  date: string;
}

const norm = (x: string) => x.trim().toLowerCase();

/** Name, icon and one-line pitch of each part of the study kit */
export function kitPartCopy(part: KitPart, lang: string): { icon: React.ReactNode; tone: string; title: string; sub: string } {
  const es = lang === 'es';
  if (part === 'guide') return { icon: ICONS.book, tone: 'sky', title: es ? 'Guía de estudio' : 'Study guide', sub: es ? 'Todo lo que entra, explicado paso a paso' : 'Everything on the test, explained step by step' };
  if (part === 'quiz') return { icon: ICONS.cards, tone: 'primary', title: es ? 'Tarjetas de quiz' : 'Flashcards', sub: es ? 'Repaso rápido de opción múltiple' : 'Quick multiple-choice review' };
  if (part === 'practice') return { icon: ICONS.pencil, tone: 'berry', title: es ? 'Examen de práctica' : 'Practice test', sub: es ? 'Verdadero o falso, completar y respuestas escritas que la IA corrige' : 'True/false, fill-ins and written answers the AI checks' };
  return { icon: ICONS.printer, tone: 'coral', title: es ? 'Hoja para imprimir' : 'Printable worksheet', sub: es ? 'Para practicar en papel' : 'To practice on paper' };
}

/**
 * Form to set up a school test: which topics (classes) it covers, when it is and its name. Used by the kid
 * ("test mode") and the parent. While `parts` is set the kit is being made and each part shows how it went.
 */
export default function ExamSetup({ lang, topics, tests, busy, parts, forKid, onSubmit, onCancel }: {
  lang: string;
  /** The subject's topics, newest first */
  topics: KidTopic[];
  /** The subject's earlier tests, newest first */
  tests: KidTest[];
  busy: boolean;
  parts?: Record<KitPart, PartState> | null;
  forKid?: boolean;
  onSubmit: (v: ExamSetupValue) => void;
  onCancel?: () => void;
}) {
  const L = (en: string, es: string) => (lang === 'es' ? es : en);
  const [value, setValue] = React.useState<ExamSetupValue>(() => ({ title: '', picked: defaultTestTopics(topics, tests), date: '' }));
  const used = topicsInTests(tests);
  const isOn = (title: string) => value.picked.some((n) => norm(n) === norm(title));
  const toggle = (title: string) => setValue((v) => ({ ...v, picked: isOn(title) ? v.picked.filter((n) => norm(n) !== norm(title)) : [...v.picked, title].slice(0, MAX_TEST_TOPICS) }));
  const full = value.picked.length >= MAX_TEST_TOPICS;
  const step = (n: number, label: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{n}</span>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: forKid ? 19 : 16 }}>{label}</span>
    </div>
  );

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (value.picked.length && !busy) onSubmit(value); }} style={{ display: 'grid', gap: 22 }}>
      <fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: 22, minWidth: 0 }}>
        <div>
          {step(1, forKid ? L('Which classes are on your test?', '¿Qué clases entran en tu examen?') : L('What does the test cover?', '¿Qué cubre el examen?'))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 12, color: 'var(--ink-3)', marginBottom: 8 }}>
            <span>{L('Pick only what the teacher said goes in.', 'Elige solo lo que la maestra dijo que entra.')} · {value.picked.length}/{MAX_TEST_TOPICS}</span>
            {value.picked.length > 0 && <button type="button" onClick={() => setValue((v) => ({ ...v, picked: [] }))} style={{ appearance: 'none', border: 0, background: 'transparent', color: 'var(--primary-d)', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: 12 }}>{L('Clear', 'Quitar todo')}</button>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))', gap: 8 }}>
            {topics.map((x) => {
              const on = isOn(x.title);
              const before = used.get(norm(x.title));
              return (
                <label key={x.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: on ? 'var(--primary-l)' : 'var(--surface)', border: '1.5px solid ' + (on ? 'var(--primary)' : 'var(--line)'), cursor: !on && full ? 'not-allowed' : 'pointer', opacity: !on && full ? 0.55 : 1, minWidth: 0 }}>
                  <input type="checkbox" checked={on} disabled={!on && full} onChange={() => toggle(x.title)} style={{ width: 18, height: 18, accentColor: 'var(--primary)', flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 14, fontWeight: 700, overflowWrap: 'anywhere' }}>{x.title}</span>
                    {(before || x.source !== 'manual') && (
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                        {x.source !== 'manual' ? `📎 ${L('Class notes', 'Apuntes de clase')}` : ''}
                        {x.source !== 'manual' && before ? ' · ' : ''}
                        {before ? `${L('In', 'En')} ${before.title}` : ''}
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div>
          {step(2, forKid ? L('When is it?', '¿Cuándo es?') : L('When is it?', '¿Cuándo es?'))}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <label style={{ flex: '1 1 160px', fontSize: 12, color: 'var(--ink-3)' }}>{L('Test date (optional)', 'Fecha del examen (opcional)')}
              <input className="qk-input" type="date" value={value.date} onChange={(e) => setValue({ ...value, date: e.target.value })} style={{ marginTop: 4, fontSize: 14 }} />
            </label>
            <label style={{ flex: '2 1 220px', fontSize: 12, color: 'var(--ink-3)' }}>{L('Name (optional)', 'Nombre (opcional)')}
              <input className="qk-input" value={value.title} maxLength={80} onChange={(e) => setValue({ ...value, title: e.target.value })} placeholder={L('e.g. Unit 3 test', 'ej. Examen de la unidad 3')} style={{ marginTop: 4, fontSize: 14 }} />
            </label>
          </div>
        </div>
      </fieldset>

      <div>
        {step(3, forKid ? L('Your study kit', 'Tu kit de estudio') : L('The study kit', 'El kit de estudio'))}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(330px, 100%), 1fr))', gap: 8 }}>
          {KIT_PARTS.map((part) => {
            const c = kitPartCopy(part, lang);
            const state = parts?.[part];
            return (
              <div key={part} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: 'var(--surface-2)', minWidth: 0 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: `var(--${c.tone === 'primary' ? 'primary-l' : c.tone + '-l'})`, color: `var(--${c.tone})`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{c.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.3 }}>{c.sub}</div>
                </div>
                {state === 'done' && <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{React.cloneElement(ICONS.check as React.ReactElement<{ size?: number }>, { size: 14 })}</span>}
                {state === 'failed' && <span title={L('Will be made when you open it', 'Se hará cuando lo abras')} style={{ fontSize: 11, fontWeight: 700, color: '#7C5410', flexShrink: 0 }}>{L('Later', 'Luego')}</span>}
                {state === 'waiting' && <span aria-hidden style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--honey)', animation: 'qk-pulse 1s ease-in-out infinite', flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Btn kind="primary" type="submit" icon={ICONS.spark} className="qk-full-sm" disabled={busy || value.picked.length === 0}>
            {busy ? L('Making your study kit…', 'Haciendo tu kit de estudio…') : forKid ? L('Make my study kit', 'Hacer mi kit de estudio') : L('Make the study kit', 'Hacer el kit de estudio')}
          </Btn>
          {onCancel && <button type="button" className="qk-btn qk-btn-ghost" onClick={onCancel} disabled={busy}>{L('Cancel', 'Cancelar')}</button>}
        </div>
        {busy && <LoadingBar expectedMs={25000} />}
        {busy && <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{L('This takes about half a minute. Everything is made at once.', 'Tarda como medio minuto. Todo se hace a la vez.')}</div>}
      </div>
    </form>
  );
}
