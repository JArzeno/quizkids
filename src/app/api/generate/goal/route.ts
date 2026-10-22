import { NextRequest, NextResponse } from 'next/server';
import { generateGoal } from '@/lib/openai';

export const maxDuration = 60;

const strList = (v: unknown, max: number) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').map((x) => x.slice(0, 80)).slice(0, max) : undefined;

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    if (!b.subject || !b.grade) return NextResponse.json({ error: 'Missing subject or grade' }, { status: 400 });

    // Goals are built only from the topics the parent added to the subject
    const available = strList(b.topics, 40)?.map((t) => t.trim()).filter(Boolean) ?? [];
    if (available.length === 0) return NextResponse.json({ error: 'No topics to build a goal from' }, { status: 400 });

    const data = await generateGoal({
      subject: String(b.subject).slice(0, 80),
      available,
      grade: String(b.grade),
      level: Number.isInteger(b.level) ? b.level : undefined,
      focus: typeof b.focus === 'string' && b.focus.trim() ? b.focus.trim().slice(0, 200) : undefined,
      strong: strList(b.strong, 8),
      weak: strList(b.weak, 8),
      done: strList(b.done, 10),
      lang: b.lang === 'es' || b.lang === 'fr' ? b.lang : 'en',
    });

    // Keep only topics that are really in the list (written back exactly as the parent added them)
    const byName = new Map(available.map((t) => [t.toLowerCase(), t]));
    const chosen = (strList(data.topics, 8) ?? []).map((t) => byName.get(t.trim().toLowerCase())).filter((t): t is string => !!t);
    const topics = Array.from(new Set(chosen)).slice(0, 6);
    // With a single added topic the goal is just that topic; otherwise the AI must have picked at least two
    if (typeof data.title !== 'string' || !data.title.trim() || topics.length < Math.min(2, available.length)) {
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
