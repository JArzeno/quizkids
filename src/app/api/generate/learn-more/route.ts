import { NextRequest, NextResponse } from 'next/server';
import { generateLearnMore } from '@/lib/openai';
import { createClient } from '@/lib/supabase/server';

/**
 * Deeper information for a topic the kid is already studying, plus a small dataset
 * the guide renders as a graph. Cached in generated_content like the other
 * generators so a second "Learn more" tap costs nothing.
 */
export async function POST(req: NextRequest) {
  try {
    const { topic, grade, lang, subject, focus } = await req.json();
    if (!topic || !grade) return NextResponse.json({ error: 'Missing topic or grade' }, { status: 400 });

    const lng = lang || 'en';
    const subj = subject || 'sci';
    // Focus is part of the cache key: a section deep-dive is not the whole-topic one.
    const cacheTopic = focus ? `${topic} :: ${focus}` : topic;

    try {
      const supabase = await createClient();
      const { data: cached } = await supabase
        .from('generated_content')
        .select('id, content')
        .eq('type', 'learnmore')
        .eq('topic', cacheTopic)
        .eq('grade', grade)
        .eq('lang', lng)
        .single();

      if (cached?.content) {
        return NextResponse.json({ ...(cached.content as object), contentId: cached.id, cached: true });
      }

      const data = await generateLearnMore(topic, grade, lng, focus);

      const { data: saved } = await supabase
        .from('generated_content')
        .insert({ subject: subj, topic: cacheTopic, grade, lang: lng, type: 'learnmore', content: data })
        .select('id')
        .single();

      return NextResponse.json({ ...data, contentId: saved?.id ?? null, cached: false });
    } catch (dbErr) {
      console.warn('Supabase cache miss/error, generating fresh:', dbErr);
      const data = await generateLearnMore(topic, grade, lng, focus);
      return NextResponse.json({ ...data, contentId: null, cached: false });
    }
  } catch (err) {
    console.error('Learn-more generation error:', err);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
