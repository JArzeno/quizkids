import { NextRequest, NextResponse } from 'next/server';
import { generatePlacement } from '@/lib/openai';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { subject, focus, grade, lang } = await req.json();
    if (!subject || !grade) return NextResponse.json({ error: 'Missing subject or grade' }, { status: 400 });

    const data = await generatePlacement(
      String(subject).slice(0, 80),
      typeof focus === 'string' && focus.trim() ? focus.trim().slice(0, 200) : undefined,
      String(grade),
      lang === 'es' || lang === 'fr' ? lang : 'en',
    );

    // Keep only well-formed questions; unknown bands fall back to "at grade"
    const questions = (Array.isArray(data.questions) ? data.questions : [])
      .filter((q: { q?: unknown; choices?: unknown; a?: unknown }) => typeof q.q === 'string' && Array.isArray(q.choices) && q.choices.length >= 2 && Number.isInteger(q.a) && (q.a as number) >= 0 && (q.a as number) < q.choices.length)
      .map((q: { q: string; choices: string[]; a: number; hint?: string; band?: number; topic?: string }) => ({
        q: q.q,
        choices: q.choices,
        a: q.a,
        hint: q.hint || '',
        band: q.band === -1 || q.band === 1 ? q.band : 0,
        topic: (q.topic || subject).toString().slice(0, 60),
      }));

    if (questions.length < 4) return NextResponse.json({ error: 'Generation failed' }, { status: 502 });
    return NextResponse.json({ questions });
  } catch (err) {
    console.error('placement generation error:', err);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
