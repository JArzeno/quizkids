import type { ImportedLesson, Lang } from '@/types';

/** Class material (photos of notes, homework, a textbook page, or a PDF) read in the browser for /api/import/analyze */
export const MAX_CLASS_FILES = 6;
const MAX_PDF_BYTES = 15 * 1024 * 1024;
const MAX_IMAGE_SIDE = 1600;

export interface PickedFile {
  id: string;
  name: string;
  kind: 'image' | 'pdf';
  dataUrl: string;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

/** Downscale photos (phone pictures are huge) so uploads stay fast and under limits */
async function compressImage(file: File): Promise<string> {
  const src = await readAsDataUrl(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = src;
  });
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return src;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.85);
}

/** Reads up to `room` PDFs or photos. Files that can't be used are skipped, with a message for the parent in `error`. */
export async function readClassFiles(list: FileList | File[], room: number, lang: Lang): Promise<{ files: PickedFile[]; error: string | null }> {
  const es = lang === 'es';
  const incoming = Array.from(list);
  let error: string | null = incoming.length > room ? (es ? `Máximo ${MAX_CLASS_FILES} archivos.` : `Up to ${MAX_CLASS_FILES} files.`) : null;
  const files: PickedFile[] = [];
  for (const f of incoming.slice(0, Math.max(0, room))) {
    try {
      if (f.type === 'application/pdf') {
        if (f.size > MAX_PDF_BYTES) { error = es ? 'El PDF es muy grande (máx. 15 MB).' : 'PDF is too large (max 15 MB).'; continue; }
        files.push({ id: crypto.randomUUID(), name: f.name, kind: 'pdf', dataUrl: await readAsDataUrl(f) });
      } else if (f.type.startsWith('image/')) {
        files.push({ id: crypto.randomUUID(), name: f.name, kind: 'image', dataUrl: await compressImage(f) });
      } else {
        error = es ? 'Solo se aceptan PDF o imágenes.' : 'Only PDF or image files are supported.';
      }
    } catch {
      error = es ? `No se pudo leer ${f.name}.` : `Could not read ${f.name}.`;
    }
  }
  return { files, error };
}

/**
 * Reads the class out of the files, written in `contentLang` (default: the account language `lang`).
 * Throws an Error whose message is ready to show the parent.
 */
export async function analyzeClassFiles(files: PickedFile[], opts: { grade: string; lang: Lang; contentLang?: string; hint?: string }): Promise<ImportedLesson> {
  const es = opts.lang === 'es';
  const res = await fetch('/api/import/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: files.map(({ name, dataUrl }) => ({ name, dataUrl })), grade: opts.grade, lang: opts.contentLang || opts.lang, hint: opts.hint?.trim() || undefined }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 422) throw new Error(es ? 'No encontramos contenido de clase legible. Prueba con una foto más clara.' : "We couldn't find readable class content. Try a clearer photo.");
    if (res.status === 413) throw new Error(es ? 'Los archivos son muy grandes.' : 'Files are too large.');
    throw new Error(es ? 'No se pudo analizar. Intenta de nuevo.' : 'Analysis failed. Please try again.');
  }
  return data as ImportedLesson;
}
