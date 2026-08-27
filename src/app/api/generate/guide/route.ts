import { NextRequest, NextResponse } from 'next/server';
import { generateGuide } from '@/lib/openai';
import { queryOne } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { topic, grade, lang, subject } = await req.json();
    if (!topic || !grade) return NextResponse.json({ error: 'Missing topic or grade' }, { status: 400 });

    const lng = lang || 'en';
    const subj = subject || 'sci';

    // Check cache first
    try {
      const cached = await queryOne<{ id: string; content: object | null }>(
        `select id, content from generated_content
          where type = 'guide' and topic = $1 and grade = $2 and lang = $3
          limit 1`,
        [topic, grade, lng]
      );

      if (cached?.content) {
        return NextResponse.json({ ...cached.content, contentId: cached.id, cached: true });
      }

      // Generate new
      const data = await generateGuide(topic, grade, lng);

      // Save to cache
      const saved = await queryOne<{ id: string }>(
        `insert into generated_content (subject, topic, grade, lang, type, content)
         values ($1, $2, $3, $4, 'guide', $5)
         returning id`,
        [subj, topic, grade, lng, JSON.stringify(data)]
      );

      return NextResponse.json({ ...data, contentId: saved?.id ?? null, cached: false });
    } catch (dbErr) {
      console.warn('Content cache miss/error, generating fresh:', dbErr);
      const data = await generateGuide(topic, grade, lng);
      return NextResponse.json({ ...data, contentId: null, cached: false });
    }
  } catch (err) {
    console.error('Guide generation error:', err);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
