import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { generateGame } from '@/lib/openai';
import { contentLang } from '@/lib/languages';
import { GAME_VERSION } from '@/lib/games';
import { createClient } from '@/lib/supabase/server';
import { listedTopics, parseTopics, promptTopic } from '@/lib/topicsParam';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { kind, topic, grade, source, difficulty, lang, subject, exclude, topics, cacheOnly } = await req.json();
    if (kind !== 'tf' && kind !== 'fill') return NextResponse.json({ error: 'Unknown game' }, { status: 400 });
    if (!topic || !grade) return NextResponse.json({ error: 'Missing topic or grade' }, { status: 400 });

    const diff = difficulty || 'medium';
    const lng = contentLang(lang);
    // Cards of an earlier round ("play again"): the new round must not repeat them
    const asked: string[] = Array.isArray(exclude)
      ? exclude.filter((q): q is string => typeof q === 'string' && q.trim().length > 0).map((q) => q.trim().slice(0, 200)).slice(-40)
      : [];
    // Several topics at once: the round covers all of them
    const multi = parseTopics(topics);
    // Several topics or a replay are personalised requests: never served from, or mistaken for, the shared cache
    const isVariant = asked.length > 0 || listedTopics(topics).length > 1;
    const subj = subject || 'sci';
    // Imported class material: cache per exact material, not just per topic
    const src: string | undefined = typeof source === 'string' && source.trim() ? source.trim() : undefined;
    const sourceHash = src ? createHash('sha256').update(src).digest('hex') : null;
    const type = `game_${kind}`;
    const make = () => generateGame(kind, promptTopic(topic, topics), grade, diff, lng, src, multi, asked);

    try {
      const supabase = await createClient();
      let cacheQuery = supabase
        .from('generated_content')
        .select('id, content')
        .eq('type', type)
        .eq('topic', topic)
        .eq('grade', grade)
        .eq('difficulty', diff)
        .eq('lang', lng)
        .eq('content->>v', String(GAME_VERSION));
      if (sourceHash) cacheQuery = cacheQuery.eq('source_hash', sourceHash);
      const { data: cached } = isVariant ? { data: null } : await cacheQuery.order('created_at').limit(1).maybeSingle();

      if (cached?.content) {
        return NextResponse.json({ ...(cached.content as object), contentId: cached.id, cached: true });
      }
      if (cacheOnly) return NextResponse.json({ cached: false });

      const data = await make();
      const { data: saved } = await supabase
        .from('generated_content')
        .insert({ subject: subj, topic, grade, difficulty: diff, lang: lng, type, content: data, ...(sourceHash ? { source_hash: sourceHash } : {}) })
        .select('id')
        .single();

      return NextResponse.json({ ...data, contentId: saved?.id ?? null, cached: false });
    } catch (dbErr) {
      // DB unavailable: generate without caching
      console.warn('Supabase cache miss/error, generating fresh:', dbErr);
      if (cacheOnly) return NextResponse.json({ cached: false });
      const data = await make();
      return NextResponse.json({ ...data, contentId: null, cached: false });
    }
  } catch (err) {
    console.error('Game generation error:', err);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
