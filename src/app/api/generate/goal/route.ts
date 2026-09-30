import { NextRequest, NextResponse } from 'next/server';
import { generateGoal } from '@/lib/openai';

export const maxDuration = 60;

const strList = (v: unknown, max: number) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').map((x) => x.slice(0, 80)).slice(0, max) : undefined;

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    if (!b.subject || !b.grade) return NextResponse.json({ error: 'Missing subject or grade' }, { status: 400 });

    const data = await generateGoal({
      subject: String(b.subject).slice(0, 80),
      grade: String(b.grade),
      level: Number.isInteger(b.level) ? b.level : undefined,
      focus: typeof b.focus === 'string' && b.focus.trim() ? b.focus.trim().slice(0, 200) : undefined,
      strong: strList(b.strong, 8),
      weak: strList(b.weak, 8),
      done: strList(b.done, 10),
      lang: b.lang === 'es' || b.lang === 'fr' ? b.lang : 'en',
    });

    const topics = strList(data.topics, 6)?.map((t) => t.trim()).filter(Boolean) ?? [];
    if (typeof data.title !== 'string' || !data.title.trim() || topics.length < 2) {
      return NextResponse.json({ error: 'Generation failed' }, { status: 502 });
    }
    const weeks = Number.isInteger(data.weeks) ? Math.min(4, Math.max(1, data.weeks)) : 2;
    return NextResponse.json({
      title: data.title.trim().slice(0, 120),
      description: typeof data.description === 'string' ? data.description.trim().slice(0, 300) : undefined,
      topics,
      weeks,
    });
  } catch (err) {
    console.error('goal generation error:', err);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
