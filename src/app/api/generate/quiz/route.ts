import { NextRequest, NextResponse } from 'next/server';
import { generateQuiz } from '@/lib/openai';
import { queryOne } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { topic, grade, difficulty, lang, subject } = await req.json();
    if (!topic || !grade) return NextResponse.json({ error: 'Missing topic or grade' }, { status: 400 });

    const diff = difficulty || 'medium';
    const lng = lang || 'en';
    const subj = subject || 'sci';

    // Check cache first
    try {
      const cached = await queryOne<{ id: string; content: object | null }>(
        `select id, content from generated_content
          where type = 'quiz' and topic = $1 and grade = $2 and difficulty = $3 and lang = $4
          limit 1`,
        [topic, grade, diff, lng]
      );

      if (cached?.content) {
        return NextResponse.json({ ...cached.content, contentId: cached.id, cached: true });
      }

      // Generate new
      const data = await generateQuiz(topic, grade, diff, lng);

      // Save to cache
      const saved = await queryOne<{ id: string }>(
        `insert into generated_content (subject, topic, grade, difficulty, lang, type, content)
         values ($1, $2, $3, $4, $5, 'quiz', $6)
         returning id`,
        [subj, topic, grade, diff, lng, JSON.stringify(data)]
      );

      return NextResponse.json({ ...data, contentId: saved?.id ?? null, cached: false });
    } catch (dbErr) {
      // DB unavailable — generate without caching
      console.warn('Content cache miss/error, generating fresh:', dbErr);
      const data = await generateQuiz(topic, grade, diff, lng);
      return NextResponse.json({ ...data, contentId: null, cached: false });
    }
  } catch (err) {
    console.error('Quiz generation error:', err);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
