import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { generatePractice, parseContext } from '@/lib/openai';
import { contentLang } from '@/lib/languages';
import { PRACTICE_VERSION } from '@/lib/practice';
import { createClient } from '@/lib/supabase/server';
import { listedTopics, parseTopics, promptTopic } from '@/lib/topicsParam';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { topic, grade, source, lang, subject, variant, context, exclude, topics, cacheOnly } = await req.json();
    if (!topic || !grade) return NextResponse.json({ error: 'Missing topic or grade' }, { status: 400 });

    const lng = contentLang(lang);
    const ctx = parseContext(context);
    // Questions of an earlier practice test ("new questions" round): the new test must not repeat them
    const asked: string[] = Array.isArray(exclude)
      ? exclude.filter((q): q is string => typeof q === 'string' && q.trim().length > 0).map((q) => q.trim().slice(0, 200)).slice(-40)
      : [];
    // Several topics at once (a school test): the practice test covers all of them
    const multi = parseTopics(topics);
    // A variant is a personalised request (a test's topics, the kid's memory, new questions): never served from, or mistaken for, the shared cache
    const isVariant = (typeof variant === 'string' && variant.length > 0) || asked.length > 0 || listedTopics(topics).length > 0 || !!ctx?.memory?.length;
    const subj = subject || 'sci';
    // Imported class material: cache per exact material, not just per topic
    const src: string | undefined = typeof source === 'string' && source.trim() ? source.trim() : undefined;
    const sourceHash = src ? createHash('sha256').update(src).digest('hex') : null;

    try {
      const supabase = await createClient();
      let cacheQuery = supabase
        .from('generated_content')
        .select('id, content')
        .eq('type', 'practice')
        .eq('topic', topic)
        .eq('grade', grade)
        .eq('lang', lng)
        .eq('content->>v', String(PRACTICE_VERSION));
      if (sourceHash) cacheQuery = cacheQuery.eq('source_hash', sourceHash);
      const { data: cached } = isVariant ? { data: null } : await cacheQuery.order('created_at').limit(1).maybeSingle();

      if (cached?.content) {
        return NextResponse.json({ ...(cached.content as object), contentId: cached.id, cached: true });
      }

      if (cacheOnly) return NextResponse.json({ cached: false });
      const data = await generatePractice(promptTopic(topic, topics), grade, lng, src, ctx, multi, asked);

      const { data: saved } = await supabase
        .from('generated_content')
        .insert({ subject: subj, topic, grade, lang: lng, type: 'practice', content: data, ...(sourceHash ? { source_hash: sourceHash } : {}) })
        .select('id')
        .single();

      return NextResponse.json({ ...data, contentId: saved?.id ?? null, cached: false });
    } catch (dbErr) {
      console.warn('Supabase cache miss/error, generating fresh:', dbErr);
      if (cacheOnly) return NextResponse.json({ cached: false });
      const data = await generatePractice(promptTopic(topic, topics), grade, lng, src, ctx, multi, asked);
      return NextResponse.json({ ...data, contentId: null, cached: false });
    }
  } catch (err) {
    console.error('Practice test generation error:', err);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
