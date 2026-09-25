import { NextRequest, NextResponse } from 'next/server';
import { analyzeMaterial, type ImportFile } from '@/lib/openai';

export const maxDuration = 60;

const MAX_FILES = 6;
const MAX_TOTAL_CHARS = 25 * 1024 * 1024; // ~18MB of binary once base64-decoded

export async function POST(req: NextRequest) {
  try {
    const { files, grade, lang, hint } = await req.json();
    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Up to ${MAX_FILES} files at a time` }, { status: 400 });
    }

    const clean: ImportFile[] = [];
    let total = 0;
    for (const f of files) {
      const dataUrl = typeof f?.dataUrl === 'string' ? f.dataUrl : '';
      const isImage = /^data:image\/(png|jpe?g|webp|gif);base64,/.test(dataUrl);
      const isPdf = dataUrl.startsWith('data:application/pdf;base64,');
      if (!isImage && !isPdf) {
        return NextResponse.json({ error: 'Only PDF or image files are supported' }, { status: 400 });
      }
      total += dataUrl.length;
      clean.push({ kind: isPdf ? 'pdf' : 'image', name: String(f.name || '').slice(0, 120), dataUrl });
    }
    if (total > MAX_TOTAL_CHARS) {
      return NextResponse.json({ error: 'Files are too large' }, { status: 413 });
    }

    const analysis = await analyzeMaterial(clean, grade || '3', lang || 'en', typeof hint === 'string' ? hint.slice(0, 200) : undefined);
    if (!analysis.title || !analysis.notes) {
      return NextResponse.json({ error: 'unreadable', summary: analysis.summary }, { status: 422 });
    }
    return NextResponse.json(analysis);
  } catch (err) {
    console.error('Import analysis error:', err);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
