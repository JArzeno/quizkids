'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ICONS, Ico } from '@/components/ui/Icons';
import { Btn } from '@/components/ui/Btn';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';

const SUBJECT_LABELS: Record<string, string> = { sci: '🔬 Science', math: '➗ Math', lang: '📖 Language', soc: '🌎 Social Studies', art: '🎨 Art' };

interface ParseResult {
  pages: number;
  textPages: number;
  imagePages: number;
  rawText: string;
  detectedTopic: string;
  detectedSubject: string;
  suggestedGrade: string;
  summary: string;
  error?: string;
}

export default function ConvertPdfCatalogClient() {
  const { lang, setStudyParams, studyParams } = useStore();
  const t = useT(lang);
  const router = useRouter();

  const [dragging, setDragging] = React.useState(false);
  const [parsing, setParsing] = React.useState(false);
  const [result, setResult] = React.useState<ParseResult | null>(null);
  const [parseError, setParseError] = React.useState<string | null>(null);
  const [topic, setTopic] = React.useState('');
  const [subject, setSubject] = React.useState('sci');
  const [grade, setGrade] = React.useState('4');
  const [fileName, setFileName] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setParseError('Please upload a PDF file.');
      return;
    }
    setFileName(file.name);
    setResult(null);
    setParseError(null);
    setParsing(true);

    try {
      const fd = new FormData();
      fd.append('pdf', file);
      const res = await fetch('/api/parse-pdf', { method: 'POST', body: fd });
      const data: ParseResult = await res.json();

      if (!res.ok || data.error) {
        setParseError(data.error ?? 'Failed to parse PDF.');
        setParsing(false);
        return;
      }

      setResult(data);
      setTopic(data.detectedTopic);
      setSubject(data.detectedSubject);
      setGrade(data.suggestedGrade);
    } catch {
      setParseError('Network error. Please try again.');
    }
    setParsing(false);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const proceed = (type: 'quiz' | 'guide' | 'pdf') => {
    setStudyParams({ ...studyParams, topic, subject, grade });
    router.push(`/dashboard/generate?type=${type}`);
  };

  return (
    <AppShell>
      <div className="qk-screen qk-page-enter">
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <button className="qk-btn qk-btn-ghost" onClick={() => router.push('/dashboard')}>
            {ICONS.back} <span>{t('back')}</span>
          </button>

          <div style={{ marginTop: 20 }}>
            <span className="qk-eyebrow">{lang === 'es' ? 'Herramienta' : 'Tool'}</span>
            <h1 className="qk-h1" style={{ marginTop: 8 }}>
              {lang === 'es' ? 'Importar catálogo PDF' : 'Import PDF Catalog'}
            </h1>
            <p className="qk-sub">
              {lang === 'es'
                ? 'Sube un PDF — menú, guía, folleto — y genera contenido educativo a partir de él.'
                : 'Upload a PDF — menu, guide, brochure — and generate educational content from it.'}
            </p>
          </div>

          {/* Drop zone */}
          {!result && !parsing && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              style={{
                marginTop: 28,
                border: `2px dashed ${dragging ? 'var(--primary)' : 'var(--line)'}`,
                borderRadius: 24,
                background: dragging ? 'var(--primary-l)' : 'var(--surface)',
                padding: '56px 32px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 14,
                cursor: 'pointer',
                transition: 'all .15s ease',
              }}
            >
              <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--coral-l)', color: 'var(--coral)', display: 'grid', placeItems: 'center' }}>
                <div style={{ transform: 'scale(2)' }}>{ICONS.pdf}</div>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20 }}>
                {lang === 'es' ? 'Arrastra tu PDF aquí' : 'Drag your PDF here'}
              </div>
              <div style={{ fontSize: 14, color: 'var(--ink-3)' }}>
                {lang === 'es' ? 'o haz clic para buscar · máx 20 MB' : 'or click to browse · max 20 MB'}
              </div>
              <Btn kind="primary" icon={ICONS.pdf} onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>
                {lang === 'es' ? 'Seleccionar PDF' : 'Select PDF'}
              </Btn>
              <input ref={inputRef} type="file" accept=".pdf,application/pdf" style={{ display: 'none' }} onChange={onInputChange} />
            </div>
          )}

          {/* Parsing state */}
          {parsing && (
            <div style={{ marginTop: 28, padding: 40, borderRadius: 24, background: 'var(--surface)', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
              <div style={{ fontSize: 15, color: 'var(--ink-2)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                {lang === 'es' ? `Leyendo ${fileName}…` : `Reading ${fileName}…`}
              </div>
              <div className="qk-progress" style={{ width: 280 }}>
                <span style={{ width: '60%', animation: 'qk-pulse 1.2s ease infinite' }} />
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
                {lang === 'es' ? 'Extrayendo texto y detectando tema…' : 'Extracting text and detecting topic…'}
              </div>
            </div>
          )}

          {/* Error */}
          {parseError && !parsing && (
            <div style={{ marginTop: 20 }}>
              <div style={{ padding: '14px 18px', borderRadius: 14, background: 'var(--coral-l)', color: 'var(--coral)', fontWeight: 600, marginBottom: 16 }}>
                {parseError}
              </div>
              <button className="qk-btn qk-btn-ghost" onClick={() => { setParseError(null); setResult(null); setFileName(''); }}>
                {lang === 'es' ? '← Intentar de nuevo' : '← Try another file'}
              </button>
            </div>
          )}

          {/* Results */}
          {result && !parsing && (
            <div className="qk-slide-up" style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Page stats */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <StatChip icon="📄" label={lang === 'es' ? 'páginas totales' : 'total pages'} value={String(result.pages)} tone="primary" />
                <StatChip icon="✅" label={lang === 'es' ? 'con texto' : 'with text'} value={String(result.textPages)} tone="sky" />
                {result.imagePages > 0 && (
                  <StatChip icon="🖼️" label={lang === 'es' ? 'solo imagen' : 'image-only'} value={String(result.imagePages)} tone="honey" />
                )}
              </div>

              {result.imagePages > 0 && (
                <div style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--honey-l)', color: 'var(--honey)', fontSize: 13, fontWeight: 600 }}>
                  {lang === 'es'
                    ? `${result.imagePages} página(s) no tienen texto extraíble (posiblemente escaneadas). Se usó el texto disponible.`
                    : `${result.imagePages} page(s) had no extractable text (likely scanned images). Used available text.`}
                </div>
              )}

              {/* Summary */}
              {result.summary && (
                <div style={{ padding: '12px 16px', borderRadius: 14, background: 'var(--surface-2)', border: '1px solid var(--line)', fontSize: 14, color: 'var(--ink-2)', fontStyle: 'italic' }}>
                  {result.summary}
                </div>
              )}

              {/* Edit detected params */}
              <div className="qk-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>
                  {lang === 'es' ? 'Tema detectado' : 'Detected topic'}
                </div>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    {lang === 'es' ? 'Tema / Título' : 'Topic / Title'}
                  </span>
                  <input
                    className="qk-input"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={lang === 'es' ? 'Ej: Menú de restaurante' : 'e.g. Restaurant Menu'}
                  />
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                      {t('subject')}
                    </span>
                    <select
                      className="qk-input"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      style={{ cursor: 'pointer' }}
                    >
                      {Object.entries(SUBJECT_LABELS).map(([id, label]) => (
                        <option key={id} value={id}>{label}</option>
                      ))}
                    </select>
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                      {lang === 'es' ? 'Grado' : 'Grade'}
                    </span>
                    <select
                      className="qk-input"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      style={{ cursor: 'pointer' }}
                    >
                      {['K', '1', '2', '3', '4', '5', '6', '7', '8'].map((g) => (
                        <option key={g} value={g}>{g === 'K' ? 'Kindergarten' : `Grade ${g}`}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              {/* Extracted text preview */}
              <details style={{ borderRadius: 14, border: '1px solid var(--line)', overflow: 'hidden' }}>
                <summary style={{ padding: '12px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 14, background: 'var(--surface)', userSelect: 'none' }}>
                  {lang === 'es' ? '📋 Ver texto extraído' : '📋 View extracted text'}
                </summary>
                <div style={{ padding: '12px 16px', maxHeight: 220, overflowY: 'auto', fontSize: 13, color: 'var(--ink-2)', whiteSpace: 'pre-wrap', lineHeight: 1.6, background: 'var(--surface-2)', fontFamily: 'ui-monospace, monospace' }}>
                  {result.rawText || (lang === 'es' ? '(sin texto extraído)' : '(no text extracted)')}
                </div>
              </details>

              {/* Generate buttons */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', paddingTop: 4 }}>
                <Btn kind="primary" icon={ICONS.cards} disabled={!topic.trim()} onClick={() => proceed('quiz')}>
                  {lang === 'es' ? 'Generar quiz' : 'Generate quiz'}
                </Btn>
                <Btn kind="ghost" icon={ICONS.book} disabled={!topic.trim()} onClick={() => proceed('guide')}>
                  {lang === 'es' ? 'Guía de estudio' : 'Study guide'}
                </Btn>
                <Btn kind="ghost" icon={ICONS.pdf} disabled={!topic.trim()} onClick={() => proceed('pdf')}>
                  {lang === 'es' ? 'Hoja de trabajo' : 'Worksheet'}
                </Btn>
              </div>

              <button className="qk-btn qk-btn-ghost" style={{ alignSelf: 'flex-start' }} onClick={() => { setResult(null); setParseError(null); setFileName(''); }}>
                {lang === 'es' ? '← Subir otro PDF' : '← Upload another PDF'}
              </button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function StatChip({ icon, label, value, tone }: { icon: string; label: string; value: string; tone: string }) {
  const bg = `var(--${tone === 'primary' ? 'primary-l' : tone + '-l'})`;
  const fg = `var(--${tone === 'primary' ? 'primary' : tone})`;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 99, background: bg, color: fg, fontWeight: 700, fontSize: 14 }}>
      <span>{icon}</span>
      <span style={{ fontSize: 20 }}>{value}</span>
      <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--ink-3)' }}>{label}</span>
    </div>
  );
}
