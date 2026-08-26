import { NextRequest, NextResponse } from 'next/server';
import { generateSuggestions } from '@/lib/openai';
import { localSuggestions, LIBRARY_SUBJECTS } from '@/lib/topics';
import type { Lang, StudySuggestion } from '@/types';

/**
 * "What should I study next?" for the kid's home screen. Answers with AI-picked
 * topics when possible and always falls back to the local topic library so the
 * section is never empty.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const grade: string = body.grade || '3';
  const lang: Lang = body.lang === 'es' ? 'es' : 'en';
  const recentTopics: string[] = Array.isArray(body.recentTopics) ? body.recentTopics.slice(0, 20) : [];
  const subjects: Array<{ id: string; label: string }> = Array.isArray(body.subjects) ? body.subjects.slice(0, 12) : [];
  const limit = Math.min(Math.max(Number(body.limit) || 6, 3), 9);

  const allowed = new Set(subjects.length ? subjects.map((s) => s.id) : LIBRARY_SUBJECTS);
  const fallback = () => localSuggestions({
    lang,
    grade,
    subjects: subjects.length ? subjects.map((s) => s.id) : undefined,
    exclude: recentTopics,
    limit,
  });

  try {
    const data = await generateSuggestions({ grade, lang, recentTopics, subjects, limit });
    const raw: unknown = (data as { suggestions?: unknown }).suggestions;
    const cleaned: StudySuggestion[] = (Array.isArray(raw) ? raw : [])
      .map((s) => s as Partial<StudySuggestion>)
      .filter((s): s is StudySuggestion => typeof s?.topic === 'string' && !!s.topic.trim())
      .map((s) => ({
        // A hallucinated subject id would break the picker, so snap it to a known one.
        subject: allowed.has(s.subject) ? s.subject : (subjects[0]?.id || 'sci'),
        topic: s.topic.trim(),
        reason: (s.reason || '').trim() || (lang === 'es' ? 'Buen siguiente paso' : 'A good next step'),
      }))
      .slice(0, limit);

    if (!cleaned.length) return NextResponse.json({ suggestions: fallback(), source: 'library' });
    return NextResponse.json({ suggestions: cleaned, source: 'ai' });
  } catch (err) {
    console.warn('Suggestion generation failed, using topic library:', err);
    return NextResponse.json({ suggestions: fallback(), source: 'library' });
  }
}
