'use client';
import React from 'react';
import { ICONS } from '@/components/ui/Icons';
import { useStore } from '@/lib/store';
import type { WorksheetMode } from '@/types';

/** Print / on-screen switch for worksheets. The choice is the account's default, so it holds for every worksheet. */
export function WorksheetModePicker({ disabled }: { disabled?: boolean }) {
  const { lang, worksheetMode, setWorksheetMode } = useStore();
  const es = lang === 'es';
  const options: { id: WorksheetMode; label: string; icon: React.ReactNode }[] = [
    { id: 'print', label: es ? 'Imprimir' : 'Print', icon: ICONS.printer },
    { id: 'screen', label: es ? 'Completar en pantalla' : 'Fill in on screen', icon: ICONS.pencil },
  ];
  return (
    <div role="radiogroup" aria-label={es ? 'Formato de la hoja de trabajo' : 'Worksheet format'} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={worksheetMode === o.id} disabled={disabled}
          className={`qk-chip${worksheetMode === o.id ? ' on' : ''}`} onClick={() => setWorksheetMode(o.id)}>
          {o.icon}{o.label}
        </button>
      ))}
    </div>
  );
}
