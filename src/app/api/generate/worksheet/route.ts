import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { generateWorksheet, parseContext } from '@/lib/openai';
import { WORKSHEET_VERSION } from '@/lib/worksheet';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { topic, grade, source, lang, subject, variant, context } = await req.json();
    if (!topic || !grade) return NextResponse.json({ error: 'Missing topic or grade' }, { status: 400 });

    const lng = lang || 'en';
    const ctx = parseContext(context);
    // A variant is a personalised request (review / retake): never served from, or mistaken for, the shared cache
    const isVariant = typeof variant === 'string' && variant.length > 0;
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
        .eq('type', 'worksheet')
        .eq('topic', topic)
        .eq('grade', grade)
        .eq('lang', lng)
        // Worksheets from the old prompt are multiple choice only: only serve the current format
        .eq('content->>v', String(WORKSHEET_VERSION));
      if (sourceHash) cacheQuery = cacheQuery.eq('source_hash', sourceHash);
      const { data: cached } = isVariant ? { data: null } : await cacheQuery.order('created_at').limit(1).maybeSingle();

      if (cached?.content) {
        return NextResponse.json({ ...(cached.content as object), contentId: cached.id, cached: true });
      }

      // Generate new
      const data = await generateWorksheet(topic, grade, lng, src, ctx);

      // Save to cache
      const { data: saved } = await supabase
        .from('generated_content')
        .insert({ subject: subj, topic, grade, lang: lng, type: 'worksheet', content: data, ...(sourceHash ? { source_hash: sourceHash } : {}) })
        .select('id')
        .single();

      return NextResponse.json({ ...data, contentId: saved?.id ?? null, cached: false });
    } catch (dbErr) {
      console.warn('Supabase cache miss/error, generating fresh:', dbErr);
      const data = await generateWorksheet(topic, grade, lng, src, ctx);
      return NextResponse.json({ ...data, contentId: null, cached: false });
    }
  } catch (err) {
    console.error('Worksheet generation error:', err);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
