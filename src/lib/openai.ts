import OpenAI from 'openai';
import { normalizeWorksheet } from '@/lib/worksheet';

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
  const label = lang === 'es' ? 'Spanish' : lang === 'fr' ? 'French' : 'English';
  return `Language: ${label}. Write EVERY piece of text (questions, answer choices, hints, titles, explanations, facts, activities) in ${label}, even if the topic name or the class material is written in another language — translate the topic as needed. Only exception: if the subject itself is a foreign language (e.g. a French class), keep the target-language words and examples being taught as they are.`;
}

/** What we know about how this kid is doing, used to tailor review material and retakes */
export interface StudentContext {
  level?: number;
  weak?: string[];
  strong?: string[];
  /** Score (0-100) on the previous attempt at this topic */
  lastScore?: number;
  review?: boolean;
}

export function parseContext(v: unknown): StudentContext | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const c = v as Record<string, unknown>;
  const list = (x: unknown) => (Array.isArray(x) ? x.filter((i): i is string => typeof i === 'string').map((i) => i.slice(0, 80)).slice(0, 8) : undefined);
  return {
    level: Number.isInteger(c.level) ? (c.level as number) : undefined,
    weak: list(c.weak),
    strong: list(c.strong),
    lastScore: typeof c.lastScore === 'number' ? Math.round(Math.min(100, Math.max(0, c.lastScore))) : undefined,
    review: c.review === true,
  };
}

/** Prompt block describing the student, so the material fits where they really are */
function studentBlock(ctx?: StudentContext): string {
  if (!ctx) return '';
  const lines: string[] = [];
  if (ctx.level != null) lines.push(`- Working at about grade level ${ctx.level === 0 ? 'K' : ctx.level} in this subject.`);
  if (ctx.weak?.length) lines.push(`- Struggles with: ${ctx.weak.join(', ')}.`);
  if (ctx.strong?.length) lines.push(`- Strong at: ${ctx.strong.join(', ')}.`);
  if (ctx.lastScore != null) lines.push(`- Scored ${ctx.lastScore}% on the last attempt at this topic.`);
  if (ctx.review) lines.push('- This is a REVIEW after a weak result: use simpler wording, smaller steps, and NEW examples and questions that differ from a standard lesson on the topic. Rebuild the basics before anything tricky.');
  return lines.length ? `\nAbout the student:\n${lines.join('\n')}\n` : '';
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

/** Prompt block listing questions the student already answered, so a "more questions" round is all new */
function excludeBlock(exclude?: string[]): string {
  if (!exclude?.length) return '';
  return `
The student already answered the questions below on this topic. Write ALL NEW questions: do not repeat them, reword them, or test the exact same fact. Stay on the same topic and level, and cover other facts, examples, or ways of using it. If the topic is small, use new examples, numbers, or situations instead.
<already_asked>
${exclude.map((q) => `- ${q}`).join('\n')}
</already_asked>
`;
}

export async function generateQuiz(topic: string, grade: string, difficulty: string, lang: string, source?: string, ctx?: StudentContext, exclude?: string[]) {
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
${studentBlock(ctx)}${excludeBlock(exclude)}${sourceBlock(source)}
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
    temperature: exclude?.length ? 0.9 : 0.7,
    max_tokens: 2000,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('No content from OpenAI');
  return JSON.parse(content);
}

/** Bump when the guide prompt changes shape, so cached guides from the old prompt are not served */
export const GUIDE_VERSION = 2;

const TONES = ['honey', 'primary', 'sky', 'coral'];
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

function normalizeSections(v: unknown, offset = 0) {
  if (!Array.isArray(v)) return [];
  return v
    .filter((s) => s && typeof s === 'object' && str(s.title) && str(s.body))
    .map((s, i) => ({
      title: str(s.title),
      body: str(s.body),
      key: str(s.key),
      ...(str(s.example) ? { example: str(s.example) } : {}),
      tone: TONES.includes(s.tone) ? s.tone : TONES[(i + offset) % TONES.length],
    }));
}

const strList = (v: unknown, max: number) => (Array.isArray(v) ? v.map(str).filter(Boolean).slice(0, max) : []);

/** Length and depth of each section, by grade */
function sectionRules(): string {
  return `- Kindergarten–2nd grade: each "body" is 3–4 short sentences, simple words, relatable analogies (animals, food, toys)
- 3rd–5th grade: each "body" is 5–7 sentences in 2 short paragraphs; introduce subject terms with a quick definition
- 6th grade and above: each "body" is 6–9 sentences in 2–3 paragraphs; include comparisons, cause/effect, and real-world applications
- Separate paragraphs inside "body" with a blank line
- "example": a concrete example for that section, 1–4 sentences: a worked problem with its steps for math, an everyday situation or simple experiment for science, sample sentences for language, a real place or event for social studies
- "key": one memorable sentence — the #1 takeaway of that section`;
}

export async function generateGuide(topic: string, grade: string, lang: string, source?: string, ctx?: StudentContext) {
  const openai = getClient();
  const gradeDesc = gradeContext(grade);

  const prompt = `Create a complete study guide about "${topic}" for a student at: ${gradeDesc}

${languageRule(lang)}

It should read like a full lesson the student can learn from on their own, not a short summary: start with the basics, build up step by step, and end with how the idea is used in real life.

Rules:
- Every sentence must match the reading level and vocabulary of that grade
- Kindergarten–2nd grade: 5 sections. 3rd grade and above: 6 sections
${sectionRules()}
- Order the sections from foundation to application and never repeat the same idea in two sections
- "vocab": 3–6 important words used in the guide, each with a short grade-level definition
- "recap": 3–5 short sentences with the most important points to remember
- "related": 3 short ideas (2–6 words) closely connected to the topic that the guide does NOT cover yet, for the student to explore next${source ? '. Keep them inside the class material.' : ''}
${studentBlock(ctx)}${sourceBlock(source)}
Return ONLY valid JSON in this exact format:
{
  "intro": "A 2–3 sentence friendly introduction at the grade level",
  "sections": [
    {
      "title": "Section title",
      "body": "Explanation appropriate for the grade level",
      "example": "A concrete example",
      "tone": "honey",
      "key": "One key takeaway sentence"
    }
  ],
  "vocab": [{ "term": "word", "def": "short definition" }],
  "recap": ["Point to remember"],
  "fact": "A fun, surprising fact about the topic written at the grade level",
  "related": ["Idea to explore next"]
}
Use tone values: honey, primary, sky, coral (rotate them).
Keep language simple and engaging for the grade level.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 4500,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('No content from OpenAI');
  const parsed = JSON.parse(content);
  const sections = normalizeSections(parsed.sections);
  if (sections.length === 0) throw new Error('Guide has no sections');
  return {
    intro: str(parsed.intro),
    sections,
    vocab: Array.isArray(parsed.vocab)
      ? parsed.vocab.filter((x: { term?: unknown; def?: unknown }) => str(x?.term) && str(x?.def)).slice(0, 8).map((x: { term: string; def: string }) => ({ term: str(x.term), def: str(x.def) }))
      : [],
    recap: strList(parsed.recap, 6),
    fact: str(parsed.fact),
    related: strList(parsed.related, 4),
    v: GUIDE_VERSION,
  };
}

/** Extra guide sections on request: one about a related idea the kid picked, or two that go further on the topic */
export async function generateGuideMore(topic: string, grade: string, lang: string, opts: { focus?: string; covered: string[]; source?: string; ctx?: StudentContext }) {
  const openai = getClient();
  const gradeDesc = gradeContext(grade);
  const { focus, covered, source, ctx } = opts;

  const task = focus
    ? `Write 1 new section that explains "${focus}" and how it connects to ${topic}.`
    : `Write 2 new sections that go a bit further on ${topic}: a new angle, a real-world use, or a common mistake and how to avoid it.`;

  const prompt = `A student at: ${gradeDesc} just read a study guide about "${topic}" and wants to learn more.
The guide already has these sections (do NOT repeat what they explain): ${covered.join('; ')}.

${task}

${languageRule(lang)}

Rules:
- Every sentence must match the reading level and vocabulary of that grade
${sectionRules()}
- "related": 3 new short ideas (2–6 words) connected to the topic, not covered above, for the student to explore next${source ? '. Keep them inside the class material.' : ''}
${studentBlock(ctx)}${sourceBlock(source)}
Return ONLY valid JSON in this exact format:
{
  "sections": [
    { "title": "Section title", "body": "Explanation", "example": "A concrete example", "tone": "sky", "key": "One key takeaway sentence" }
  ],
  "related": ["Idea to explore next"]
}
Use tone values: honey, primary, sky, coral.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.8,
    max_tokens: 2000,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('No content from OpenAI');
  const parsed = JSON.parse(content);
  const sections = normalizeSections(parsed.sections, covered.length).slice(0, focus ? 1 : 2);
  if (sections.length === 0) throw new Error('No new sections');
  const seen = new Set(covered.map((c) => c.toLowerCase()));
  return { sections, related: strList(parsed.related, 4).filter((r) => !seen.has(r.toLowerCase())) };
}

/** How many items of each worksheet section, by grade */
function worksheetMix(grade: string): string {
  const g = grade.toUpperCase() === 'K' ? 0 : parseInt(grade) || 3;
  if (g <= 1) return `- "mc": 3 items with 3 short choices each
- "tf": 3 items
- "fill": 3 items, WITH a word bank
- "match": 3 pairs (word ↔ simple picture-word or meaning)
- "open": 1 item that asks to draw or tell in one sentence (lines: 2)`;
  if (g <= 4) return `- "mc": 4 items with 4 choices each
- "tf": 4 items
- "fill": 4 items, WITH a word bank
- "match": 4 pairs
- "open": 2 items (lines: 3)`;
  return `- "mc": 4 items with 4 choices each
- "tf": 4 items
- "fill": 4 items${g <= 6 ? ', WITH a word bank' : ', with NO word bank (omit "bank")'}
- "match": 5 pairs
- "open": 2–3 items that ask the student to explain why/how, compare, or apply the idea (lines: 3–5)`;
}

export async function generateWorksheet(topic: string, grade: string, lang: string, source?: string, ctx?: StudentContext) {
  const openai = getClient();
  const gradeDesc = gradeContext(grade);

  const prompt = `Create a printable worksheet about "${topic}" for a student at: ${gradeDesc}

${languageRule(lang)}

The worksheet has one section of each type, with this many items:
${worksheetMix(grade)}

Section types:
- "mc" multiple choice: "q" question, "choices", "a" = 0-based index of the correct choice. Shuffle where the correct answer sits.
- "tf" true or false: "s" a statement (not a question), "a" true/false, and for false statements "fix" = the corrected true statement. Mix true and false (never all the same). False statements must be clearly false to someone who studied the topic, not trick wording.
- "fill" complete the sentence: "s" a sentence with exactly ONE blank written as "___", "a" = the word or short phrase (1–3 words) that goes in the blank. "bank" = all the answers plus 2 extra plausible words, when a word bank is asked for.
- "match": pairs in their correct order, "left" (term, question, or problem) and "right" (its meaning, answer, or example). Keep each side short (max ~8 words). Every right side must fit only one left side.
- "open" explain / short answer: "q" a question the student answers in their own words, "a" a short model answer for the parent's answer key, "lines" = writing lines to leave.

Rules:
- Vocabulary and complexity must match the grade level above
- Every item tests a different fact or skill from the topic; do not ask the same thing twice across sections
- Math topics: use numbers and problems in every section (e.g. fill "7 × 8 = ___", match problems to answers, open = a word problem asking to show the work and explain it)
- The bonus activity should be hands-on and grade-appropriate (draw, label, build, observe, write a few sentences)
${studentBlock(ctx)}${sourceBlock(source)}
Return ONLY valid JSON:
{
  "sections": [
    { "type": "mc", "items": [{ "q": "Question", "choices": ["A", "B", "C", "D"], "a": 0 }] },
    { "type": "tf", "items": [{ "s": "Statement", "a": false, "fix": "Corrected statement" }] },
    { "type": "fill", "bank": ["word"], "items": [{ "s": "Sentence with a ___ blank.", "a": "word" }] },
    { "type": "match", "items": [{ "left": "Term", "right": "Meaning" }] },
    { "type": "open", "items": [{ "q": "Explain…", "a": "Model answer", "lines": 3 }] }
  ],
  "bonus": "A fun, grade-appropriate bonus activity description"
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 3000,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('No content from OpenAI');
  const worksheet = normalizeWorksheet(JSON.parse(content));
  if (worksheet.sections.length < 2) throw new Error('Worksheet has too few sections');
  return worksheet;
}

/** Placement quiz: 9 questions spread across grades below / at / above the kid's grade, each tagged with a skill */
export async function generatePlacement(subject: string, focus: string | undefined, grade: string, lang: string) {
  const openai = getClient();
  const gradeDesc = gradeContext(grade);

  const prompt = `Create a 9-question multiple-choice PLACEMENT quiz for the subject "${subject}"${focus ? ` (parent's focus: "${focus}")` : ''}. The student is enrolled at: ${gradeDesc}

The goal is to find where the student really is in this subject, so spread the difficulty:
- 3 questions one grade level BELOW the student's grade (band -1)
- 3 questions AT the student's grade (band 0)
- 3 questions one grade level ABOVE the student's grade (band 1)
Order them from easiest to hardest. Cover different skills within the subject${focus ? ', leaning toward the parent focus' : ''}, and give each question a short skill name in "topic" (2-4 words, reused when two questions test the same skill).
${languageRule(lang)}

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "q": "Question text",
      "choices": ["A", "B", "C", "D"],
      "a": 0,
      "hint": "A short hint",
      "band": -1,
      "topic": "Short skill name"
    }
  ]
}
The "a" field is the 0-based index of the correct answer in choices. Shuffle the position of correct answers.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.6,
    max_tokens: 2500,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('No content from OpenAI');
  return JSON.parse(content);
}

/** Proposes the next learning goal for one subject, based on the kid's level and what they have already done */
export async function generateGoal(input: {
  subject: string; grade: string; level?: number; focus?: string;
  strong?: string[]; weak?: string[]; done?: string[]; lang: string;
}) {
  const openai = getClient();
  const gradeDesc = gradeContext(input.grade);

  const prompt = `Propose ONE learning goal for a student in the subject "${input.subject}". The student is enrolled at: ${gradeDesc}
${input.level != null ? `A placement quiz put them at roughly grade level ${input.level === 0 ? 'K' : input.level} in this subject.\n` : ''}${input.focus ? `The parent wants the focus to be: "${input.focus}"\n` : ''}${input.strong?.length ? `Strong at: ${input.strong.join(', ')}\n` : ''}${input.weak?.length ? `Needs practice in: ${input.weak.join(', ')}\n` : ''}${input.done?.length ? `Goals already completed (do NOT repeat, build on them): ${input.done.join('; ')}\n` : ''}
Pick the most useful next goal: start where the student really is (their level, not only their grade), address weak areas first, and keep it achievable in 1-4 weeks of short daily study.
${languageRule(input.lang)}

Rules:
- "title": a clear, motivating goal in one sentence, max 80 characters (e.g. "Add and subtract fractions with unlike denominators")
- "description": 1-2 plain sentences explaining what the student will be able to do
- "topics": 3-6 short, specific topic names (2-6 words each), ordered from foundation to goal. Each must work as the topic of a quiz on its own.
- "weeks": integer 1-4

Return ONLY valid JSON:
{ "title": "...", "description": "...", "topics": ["..."], "weeks": 2 }`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.6,
    max_tokens: 600,
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
