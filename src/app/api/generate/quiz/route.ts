import { NextRequest, NextResponse } from 'next/server';
import { generateQuiz } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const { topic, grade, difficulty, lang } = await req.json();
    if (!topic || !grade) return NextResponse.json({ error: 'Missing topic or grade' }, { status: 400 });
    const data = await generateQuiz(topic, grade, difficulty || 'medium', lang || 'en');
    return NextResponse.json(data);
  } catch (err) {
    console.error('Quiz generation error:', err);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
