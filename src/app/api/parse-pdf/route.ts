import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const maxDuration = 30;

interface PageText { page: number; text: string; chars: number }

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('pdf') as File | null;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'PDF must be under 20 MB' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Direct import bypasses the test-file loader that breaks Next.js webpack
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse/lib/pdf-parse.js');

    const pageTexts: PageText[] = [];
    let pageIndex = 0;

    const options = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pagerender: async (pageData: any): Promise<string> => {
        const current = ++pageIndex;
        try {
          const content = await pageData.getTextContent();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const text = content.items.map((item: any) => item.str ?? '').join(' ').replace(/\s+/g, ' ').trim();
          pageTexts.push({ page: current, text, chars: text.length });
          return text;
        } catch {
          pageTexts.push({ page: current, text: '', chars: 0 });
          return '';
        }
      },
    };

    const parsed = await pdfParse(buffer, options);
    const totalPages: number = parsed.numpages ?? pageTexts.length;

    // Sort in case pagerender fired out of order
    pageTexts.sort((a, b) => a.page - b.page);

    const pagesWithText = pageTexts.filter((p) => p.chars > 20);
    const rawText = pagesWithText.map((p) => p.text).join('\n\n').slice(0, 4000);

    if (!rawText.trim()) {
      return NextResponse.json({
        error: 'No extractable text found. This PDF appears to be fully image-based. Try a scanned PDF with OCR text layer.',
        pages: totalPages,
        textPages: 0,
        imagePages: totalPages,
        rawText: '',
      }, { status: 422 });
    }

    // Detect topic/subject/grade using GPT
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'placeholder' });

    const analysis = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Analyze this text extracted from a PDF document and return JSON:

{
  "topic": "Short title for the main content (3-6 words)",
  "subject": "One of: sci, math, lang, soc, art",
  "grade": "Best grade level: K, 1, 2, 3, 4, 5, 6, 7, or 8",
  "summary": "One sentence describing the content in plain language"
}

Text:
${rawText.slice(0, 2000)}

Return ONLY valid JSON.`,
      }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 200,
    });

    const detected = JSON.parse(analysis.choices[0].message.content || '{}');
    const filename = file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');

    return NextResponse.json({
      pages: totalPages,
      textPages: pagesWithText.length,
      imagePages: totalPages - pagesWithText.length,
      rawText: rawText.slice(0, 3000),
      detectedTopic: (detected.topic as string) || filename,
      detectedSubject: (detected.subject as string) || 'sci',
      suggestedGrade: String(detected.grade ?? '4'),
      summary: (detected.summary as string) || '',
    });
  } catch (err) {
    console.error('PDF parse error:', err);
    return NextResponse.json({ error: 'Failed to parse PDF' }, { status: 500 });
  }
}
