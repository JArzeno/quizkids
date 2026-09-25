import OpenAI from 'openai';

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'placeholder' });
}

/** Returns a human-readable grade descriptor + vocabulary guidance for OpenAI prompts */
function gradeContext(grade: string): string {
  const g = grade.toUpperCase();
  if (g === 'K') return 'Kindergarten (age 5–6). Use very simple words, short sentences, and playful examples. Avoid multi-syllable words.';
  if (g === '1') return '1st grade (age 6–7). Use simple sentences and familiar vocabulary. Relate concepts to everyday objects.';
  if (g === '2') return '2nd grade (age 7–8). Short paragraphs, basic vocabulary, concrete examples. No abstract reasoning.';
  if (g === '3') return '3rd grade (age 8–9). Moderate vocabulary, 2–3 sentence explanations, introduce grade-appropriate terms with brief definitions.';
  if (g === '4') return '4th grade (age 9–10). More complex sentences, introduce subject-specific vocabulary with context clues.';
  if (g === '5') return '5th grade (age 10–11). Multi-step concepts, grade-level vocabulary, cause-and-effect reasoning expected.';
  if (g === '6') return '6th grade (age 11–12). Middle-school level vocabulary, analytical thinking, compare/contrast encouraged.';
  if (g === '7') return '7th grade (age 12–13). Abstract concepts, technical terminology with definitions, evidence-based reasoning.';
  if (g === '8') return '8th grade (age 13–14). High complexity, pre-algebra/pre-science level rigor, nuanced vocabulary.';
  return `Grade ${grade} (age ~${parseInt(grade) + 5}–${parseInt(grade) + 6}). Use vocabulary and complexity appropriate for this grade level.`;
}

/** Strict output-language rule, so everything the kid sees matches the account language */
function languageRule(lang: string): string {
  const label = lang === 'es' ? 'Spanish' : 'English';
  return `Language: ${label}. Write EVERY piece of text (questions, answer choices, hints, titles, explanations, facts, activities) in ${label}, even if the topic name or the class material is written in another language — translate the topic as needed. Only exception: if the subject itself is a foreign language (e.g. a French class), keep the target-language words and examples being taught as they are.`;
}

const MAX_SOURCE_CHARS = 12000;

/** Prompt block that grounds generation in material imported from the kid's actual class */
function sourceBlock(source?: string): string {
  if (!source) return '';
  return `

IMPORTANT: Base everything ONLY on the class material below (imported from the student's own class notes, worksheet, or textbook page). Use its examples, vocabulary, and methods. Do not introduce concepts the material does not cover.
<class_material>
${source.slice(0, MAX_SOURCE_CHARS)}
</class_material>
`;
}

export async function generateQuiz(topic: string, grade: string, difficulty: string, lang: string, source?: string) {
  const openai = getClient();
  const cardCount = difficulty === 'easy' ? 6 : 8;
  const diffLabel = difficulty === 'easy' ? 'simple and straightforward' : difficulty === 'hard' ? 'challenging with tricky distractors and nuanced distinctions' : 'moderately challenging';
  const gradeDesc = gradeContext(grade);

  const prompt = `Generate ${cardCount} multiple-choice flashcard questions about "${topic}" for a student at: ${gradeDesc}

Questions must be ${diffLabel} and exactly appropriate for that grade level — not too easy, not too hard.
${languageRule(lang)}

Rules:
- Vocabulary must match the grade level described above
- Kindergarten and 1st grade: use pictures-in-words ("the big yellow star"), very short questions
- 4th grade and above: include one or two questions that require applying knowledge, not just recalling it
- Hard difficulty: include distractors that are plausible but clearly wrong to someone who studied the topic
${sourceBlock(source)}
Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "q": "Question text",
      "choices": ["A", "B", "C", "D"],
      "a": 0,
      "hint": "A helpful hint appropriate for the grade level"
    }
  ]
}
The "a" field is the 0-based index of the correct answer in choices.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 2000,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('No content from OpenAI');
  return JSON.parse(content);
}

export async function generateGuide(topic: string, grade: string, lang: string, source?: string) {
  const openai = getClient();
  const gradeDesc = gradeContext(grade);

  const prompt = `Create an educational study guide about "${topic}" for a student at: ${gradeDesc}

${languageRule(lang)}

Rules:
- Every sentence must match the reading level and vocabulary of that grade
- Kindergarten–2nd grade: use 1–2 sentence sections, simple words, relatable analogies (animals, food, toys)
- 3rd–5th grade: 2–3 sentences per section, introduce subject terms with a quick definition
- 6th grade and above: 3–4 sentences, include comparisons, cause/effect, and real-world applications
- The "key" field is one memorable sentence — the #1 takeaway
${sourceBlock(source)}
Return ONLY valid JSON in this exact format:
{
  "intro": "A 1–2 sentence friendly introduction at the grade level",
  "sections": [
    {
      "title": "Section title",
      "body": "Explanation appropriate for the grade level",
      "tone": "honey",
      "key": "One key takeaway sentence"
    }
  ],
  "fact": "A fun, surprising fact about the topic written at the grade level"
}
Include 3–4 sections. Use tone values: honey, primary, sky, coral (rotate them).
Keep language simple and engaging for the grade level.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 2000,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('No content from OpenAI');
  return JSON.parse(content);
}

export async function generateWorksheet(topic: string, grade: string, lang: string, source?: string) {
  const openai = getClient();
  const gradeDesc = gradeContext(grade);

  const prompt = `Create 6 printable worksheet questions about "${topic}" for a student at: ${gradeDesc}

${languageRule(lang)}

Rules:
- Questions must match vocabulary and complexity for that grade level
- Mix question types when appropriate for the grade (multiple choice, fill-in-the-blank, short answer)
- The bonus activity should be hands-on and grade-appropriate (draw, label, write a sentence, etc.)
${sourceBlock(source)}
Return ONLY valid JSON:
{
  "questions": [
    {
      "q": "Question text",
      "choices": ["A", "B", "C", "D"],
      "a": 0,
      "hint": "A hint appropriate for the grade"
    }
  ],
  "bonus": "A fun, grade-appropriate bonus activity description"
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 1500,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('No content from OpenAI');
  return JSON.parse(content);
}

export interface ImportFile {
  kind: 'image' | 'pdf';
  name: string;
  /** data: URL (base64) */
  dataUrl: string;
}

export interface LessonAnalysis {
  title: string;
  subject: string;
  summary: string;
  keyPoints: string[];
  vocabulary: { term: string; def: string }[];
  notes: string;
}

/** Reads photos / PDFs of a class and extracts the topic and teachable content */
export async function analyzeMaterial(files: ImportFile[], grade: string, lang: string, hint?: string): Promise<LessonAnalysis> {
  const openai = getClient();
  const langLabel = lang === 'es' ? 'Spanish' : 'English';
  const gradeDesc = gradeContext(grade);

  const prompt = `The attached files are from a student's class (photos of notes, a worksheet, a textbook page, or a handout). The student is at: ${gradeDesc}
${hint ? `The parent says this class is about: "${hint}"\n` : ''}
Read everything carefully (including handwriting, diagrams, and exercises) and figure out what the class is teaching.

Write all output in ${langLabel}, even if the material is in another language, EXCEPT when the subject itself is a foreign language (e.g. a French class) — then keep the target-language words, phrases, and examples exactly as they appear.

Return ONLY valid JSON in this exact format:
{
  "title": "Short, specific topic title (max 60 chars), e.g. 'Equivalent fractions' not 'Math'",
  "subject": "one of: sci, math, lang, soc, art",
  "summary": "2–3 sentence plain-language summary of what the class covers, for the parent",
  "keyPoints": ["4–6 key ideas or skills the student must learn"],
  "vocabulary": [{ "term": "word", "def": "short grade-level definition" }],
  "notes": "Detailed study notes (300–900 words) capturing ALL the teachable content: definitions, rules, methods, worked examples, and exercise types exactly as taught in the material. This will be used to create quizzes and worksheets, so be complete and faithful to the source."
}
Subject codes: sci = science, math = math, lang = language arts or foreign languages, soc = social studies/history/geography, art = art/music.
Include 0–8 vocabulary terms (only if relevant). If the files contain no readable class content, set "title" to "" and explain in "summary".`;

  const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [{ type: 'text', text: prompt }];
  for (const f of files) {
    if (f.kind === 'image') {
      content.push({ type: 'image_url', image_url: { url: f.dataUrl, detail: 'high' } });
    } else {
      content.push({ type: 'file', file: { filename: f.name || 'class.pdf', file_data: f.dataUrl } });
    }
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content }],
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 3000,
  });

  const out = response.choices[0].message.content;
  if (!out) throw new Error('No content from OpenAI');
  const parsed = JSON.parse(out);
  const subjects = ['sci', 'math', 'lang', 'soc', 'art'];
  return {
    title: String(parsed.title || '').slice(0, 80),
    subject: subjects.includes(parsed.subject) ? parsed.subject : 'sci',
    summary: String(parsed.summary || ''),
    keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.map(String) : [],
    vocabulary: Array.isArray(parsed.vocabulary) ? parsed.vocabulary.filter((v: { term?: string }) => v?.term) : [],
    notes: String(parsed.notes || ''),
  };
}
