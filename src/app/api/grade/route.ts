import { NextRequest, NextResponse } from 'next/server';
import { gradeAnswers, type AnswerToGrade } from '@/lib/openai';
import { contentLang } from '@/lib/languages';
import { fallbackGrade } from '@/lib/practice';

export const maxDuration = 60;

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Grades the written answers of a practice test. Falls back to a simple word match when the AI cannot be reached. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const lng = contentLang(body.lang);
    const grade = text(body.grade, 4) || '3';
    const items: AnswerToGrade[] = (Array.isArray(body.items) ? body.items : []).slice(0, 24).map((x: Record<string, unknown>) => ({
      kind: x?.kind === 'fill' ? 'fill' : 'short',
      q: text(x?.q, 500),
      expected: text(x?.expected, 800),
      points: Array.isArray(x?.points) ? x.points.map((p: unknown) => text(p, 120)).filter(Boolean).slice(0, 5) : [],
      answer: text(x?.answer, 1500),
    }));
    if (items.length === 0) return NextResponse.json({ results: [] });

    const offline = (it: AnswerToGrade) => fallbackGrade(it.expected, it.points || [], it.answer, lng, it.kind);
    try {
      const graded = await gradeAnswers(items, grade, lng, text(body.subject, 80) || undefined);
      return NextResponse.json({ results: items.map((it, i) => graded[i] ?? offline(it)) });
    } catch (e) {
      console.warn('Could not grade with the AI, using the offline check:', e);
      return NextResponse.json({ results: items.map(offline), offline: true });
    }
  } catch (err) {
    console.error('Grading error:', err);
    return NextResponse.json({ error: 'Grading failed' }, { status: 500 });
  }
}
