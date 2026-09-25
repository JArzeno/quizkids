import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { generateQuiz } from '@/lib/openai';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { topic, grade, source, difficulty, lang, subject } = await req.json();
    if (!topic || !grade) return NextResponse.json({ error: 'Missing topic or grade' }, { status: 400 });

    const diff = difficulty || 'medium';
    const lng = lang || 'en';
    const subj = subject || 'sci';
    // Imported class material: cache per exact material, not just per topic
    const src: string | undefined = typeof source === 'string' && source.trim() ? source.trim() : undefined;
    const sourceHash = src ? createHash('sha256').update(src).digest('hex') : null;

    // Check cache first
    try {
      const supabase = await createClient();
      let cacheQuery = supabase
        .from('generated_content')
        .select('id, content')
        .eq('type', 'quiz')
        .eq('topic', topic)
        .eq('grade', grade)
        .eq('difficulty', diff)
        .eq('lang', lng);
      if (sourceHash) cacheQuery = cacheQuery.eq('source_hash', sourceHash);
      const { data: cached } = await cacheQuery.single();

      if (cached?.content) {
        return NextResponse.json({ ...(cached.content as object), contentId: cached.id, cached: true });
      }

      // Generate new
      const data = await generateQuiz(topic, grade, diff, lng, src);

      // Save to cache
      const { data: saved } = await supabase
        .from('generated_content')
        .insert({ subject: subj, topic, grade, difficulty: diff, lang: lng, type: 'quiz', content: data, ...(sourceHash ? { source_hash: sourceHash } : {}) })
        .select('id')
        .single();

      return NextResponse.json({ ...data, contentId: saved?.id ?? null, cached: false });
    } catch (dbErr) {
      // DB unavailable — generate without caching
      console.warn('Supabase cache miss/error, generating fresh:', dbErr);
      const data = await generateQuiz(topic, grade, diff, lng, src);
      return NextResponse.json({ ...data, contentId: null, cached: false });
    }
  } catch (err) {
    console.error('Quiz generation error:', err);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
