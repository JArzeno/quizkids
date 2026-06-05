import { NextRequest, NextResponse } from 'next/server';
import { generateGuide } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const { topic, grade, lang } = await req.json();
    if (!topic || !grade) return NextResponse.json({ error: 'Missing topic or grade' }, { status: 400 });
    const data = await generateGuide(topic, grade, lang || 'en');
    return NextResponse.json(data);
  } catch (err) {
    console.error('Guide generation error:', err);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
