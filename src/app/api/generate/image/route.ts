import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { generateTopicImage, imageBand } from '@/lib/openai';
import { subjectPromptName } from '@/lib/subjects';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { parseTopics } from '@/lib/topicsParam';

export const maxDuration = 60;

const BUCKET = 'topic-images';
/** A 'pending' row older than this was left by a request that died mid-drawing: the next request takes it over */
const STALE_MS = 3 * 60 * 1000;

const clean = (v: unknown) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, 120) : '');

/**
 * Illustration of a study guide, shared by every kid studying the same topic in the same age band: the header picture,
 * or with `section` the picture of one section. `cachedOnly` never draws: it only answers with a picture that exists.
 * Answers { status: 'ready', url } | { status: 'pending' } (another request is drawing it: ask again in a few seconds) |
 * { status: 'none', reason } (reason says why there is no picture, to tell a missing key from a blocked topic).
 */
export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const topic = clean(b.topic);
    if (!topic || !b.grade) return NextResponse.json({ error: 'Missing topic or grade' }, { status: 400 });

    const grade = String(b.grade);
    const band = imageBand(grade);
    const subject = clean(b.subjectName) || subjectPromptName(String(b.subject || 'sci'));
    // A test guide covers several topics: the picture is about all of them, not the test's title
    const topics = parseTopics(b.topics)?.map(clean) ?? [topic];
    const sectionTitle = clean(b.section);
    const section = sectionTitle ? { title: sectionTitle, hint: clean(b.hint) || undefined } : undefined;
    const none = (reason: string, status = 200) => NextResponse.json({ status: 'none', reason }, { status });
    const key = createHash('sha256')
      .update([band, subject.toLowerCase(), ...topics.map((t) => t.toLowerCase()).sort(), ...(section ? ['§' + section.title.toLowerCase()] : [])].join('|'))
      .digest('hex')
      .slice(0, 40);

    const admin = createAdminClient();
    if (!admin) {
      console.warn('Topic images need SUPABASE_SERVICE_ROLE_KEY');
      return none('no-service-key');
    }
    const url = (path: string) => admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

    const { data: row, error: readErr } = await admin.from('topic_images').select('status, path, updated_at').eq('key', key).maybeSingle();
    if (readErr) throw readErr;
    if (row?.status === 'ready' && row.path) return NextResponse.json({ status: 'ready', url: url(row.path), band });
    if (row?.status === 'blocked') return none('blocked');
    const stale = !!row && Date.now() - new Date(row.updated_at).getTime() > STALE_MS;
    if (row && !stale) return NextResponse.json({ status: 'pending' });
    if (b.cachedOnly) return none('not-drawn');
    if (!process.env.OPENAI_API_KEY) {
      console.warn('Topic images need OPENAI_API_KEY');
      return none('no-openai-key');
    }

    // Drawing costs money: only signed-in families trigger it (the demo only sees pictures that already exist)
    const { data: { user } } = await (await createClient()).auth.getUser();
    if (!user) return none('signed-out');

    // Claim the drawing so kids opening the same guide at once don't each pay for a picture
    const now = new Date().toISOString();
    if (!row) {
      const { error } = await admin.from('topic_images').insert({ key, band, subject, topic: topics.join('; ') + (section ? ` § ${section.title}` : ''), status: 'pending', updated_at: now });
      // Unique violation: another request claimed it first
      if (error?.code === '23505') return NextResponse.json({ status: 'pending' });
      if (error) throw error;
    } else {
      const { data: taken } = await admin.from('topic_images').update({ updated_at: now })
        .eq('key', key).eq('status', 'pending').eq('updated_at', row.updated_at).select('key');
      if (!taken?.length) return NextResponse.json({ status: 'pending' });
    }

    try {
      const image = await generateTopicImage(subject, topics, grade, section);
      if (!image) {
        await admin.from('topic_images').update({ status: 'blocked', updated_at: new Date().toISOString() }).eq('key', key);
        return none('blocked');
      }
      const path = `${band}/${key}.webp`;
      const { error: upErr } = await admin.storage.from(BUCKET).upload(path, image, { contentType: 'image/webp', cacheControl: '31536000', upsert: true });
      if (upErr) throw upErr;
      await admin.from('topic_images').update({ status: 'ready', path, updated_at: new Date().toISOString() }).eq('key', key);
      return NextResponse.json({ status: 'ready', url: url(path), band });
    } catch (err) {
      // Free the claim so a later visit can try again
      await admin.from('topic_images').delete().eq('key', key).eq('status', 'pending');
      throw err;
    }
  } catch (err) {
    console.error('Topic image error:', err);
    // The message tells a wrong key or an unverified OpenAI organization from a storage problem
    return NextResponse.json({ status: 'none', reason: 'error', detail: err instanceof Error ? err.message.slice(0, 300) : String(err) }, { status: 500 });
  }
}
