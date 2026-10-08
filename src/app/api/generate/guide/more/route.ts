import { NextRequest, NextResponse } from 'next/server';
import { generateGuideMore, parseContext } from '@/lib/openai';

/** Extra sections for a guide the kid is reading. Not cached: it depends on what the guide already covers. */
export async function POST(req: NextRequest) {
  try {
    const { topic, grade, lang, source, focus, covered, context } = await req.json();
    if (!topic || !grade) return NextResponse.json({ error: 'Missing topic or grade' }, { status: 400 });

    const have: string[] = Array.isArray(covered)
      ? covered.filter((c): c is string => typeof c === 'string' && c.trim().length > 0).map((c) => c.trim().slice(0, 120)).slice(0, 24)
      : [];
    const data = await generateGuideMore(topic, grade, lang || 'en', {
      focus: typeof focus === 'string' && focus.trim() ? focus.trim().slice(0, 120) : undefined,
      covered: have,
      source: typeof source === 'string' && source.trim() ? source.trim() : undefined,
      ctx: parseContext(context),
    });
    return NextResponse.json(data);
  } catch (err) {
    console.error('Guide more error:', err);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
