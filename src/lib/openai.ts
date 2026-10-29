import OpenAI from 'openai';
import { normalizeWorksheet } from '@/lib/worksheet';
import { normalizePractice } from '@/lib/practice';
import { languagePromptName } from '@/lib/languages';
import { gradeToNumber } from '@/lib/subjects';

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
  const label = languagePromptName(lang);
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
  /** What the subject remembers from earlier school tests (scores, grades, what was missed), newest first */
  memory?: string[];
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
    memory: Array.isArray(c.memory) ? c.memory.filter((i): i is string => typeof i === 'string').map((i) => i.slice(0, 400)).slice(0, 5) : undefined,
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
  if (ctx.memory?.length) {
    lines.push('- Earlier school tests in this subject (newest first). Give extra attention to what was hard or missed when it belongs to the topics asked for here, but never add topics because of them:');
    ctx.memory.forEach((m) => lines.push(`  - ${m}`));
  }
  return lines.length ? `\nAbout the student:\n${lines.join('\n')}\n` : '';
}

const MAX_SOURCE_CHARS = 12000;

/** Prompt block that grounds generation in material imported from the kid's actual class */
function sourceBlock(source?: string, topics?: string[]): string {
  if (!source) return '';
  // A test over several topics: only some of them may come with class material
  if (topics && topics.length > 1) {
    return `

IMPORTANT: Some of the topics come from the student's own class notes (below, each under a "###" heading with the topic name). For those topics, base everything ONLY on that material: use its examples, vocabulary, and methods, and do not introduce concepts it does not cover. For the other topics, teach the standard material for the grade.
<class_material>
${source.slice(0, MAX_SOURCE_CHARS)}
</class_material>
`;
  }
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

/** Several topics at once (a school test, a goal's final test): the quiz must spread across all of them */
function topicsBlock(topics: string[] | undefined, what: string): string {
  if (!topics || topics.length < 2) return '';
  return `
This ${what} covers ALL of these topics: ${topics.map((t) => `"${t}"`).join('; ')}. Spread it evenly so every topic is covered, and never write something that belongs to none of them.
`;
}

export async function generateQuiz(topic: string, grade: string, difficulty: string, lang: string, source?: string, ctx?: StudentContext, exclude?: string[], topics?: string[]) {
  const openai = getClient();
  const multi = !!topics && topics.length > 1;
  // A test over several topics gets more questions, about 3 per topic
  const cardCount = multi ? Math.min(15, Math.max(8, topics!.length * 3)) : difficulty === 'easy' ? 6 : 8;
  const diffLabel = difficulty === 'easy' ? 'simple and straightforward' : difficulty === 'hard' ? 'challenging with tricky distractors and nuanced distinctions' : 'moderately challenging';
  const gradeDesc = gradeContext(grade);

  const prompt = `Generate ${cardCount} multiple-choice flashcard questions about "${multi ? topics!.join('; ') : topic}" for a student at: ${gradeDesc}

Questions must be ${diffLabel} and exactly appropriate for that grade level — not too easy, not too hard.
${languageRule(lang)}

Rules:
- Vocabulary must match the grade level described above
- Kindergarten and 1st grade: use pictures-in-words ("the big yellow star"), very short questions
- 4th grade and above: include one or two questions that require applying knowledge, not just recalling it
- Hard difficulty: include distractors that are plausible but clearly wrong to someone who studied the topic
${topicsBlock(topics, 'quiz')}${studentBlock(ctx)}${excludeBlock(exclude)}${sourceBlock(source, topics)}
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
    max_tokens: multi ? Math.min(4500, 300 * cardCount) : 2000,
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

export async function generateGuide(topic: string, grade: string, lang: string, source?: string, ctx?: StudentContext, topics?: string[]) {
  const openai = getClient();
  const gradeDesc = gradeContext(grade);
  const multi = !!topics && topics.length > 1;

  const prompt = `Create a complete study guide ${multi ? `to prepare for a test on these topics: ${topics!.map((t) => `"${t}"`).join('; ')}` : `about "${topic}"`} for a student at: ${gradeDesc}
${multi ? `
Cover EVERY topic: give each topic its own section or two (about 2 sections per topic, 6–10 sections in total), in the order listed, and start each section title with the topic it belongs to. Focus on what is most likely to be asked in a test: key facts, rules, methods, and common mistakes. The "intro" says what the test covers and the "recap" lists the most important points across all topics.
` : ''}
${languageRule(lang)}

It should read like a full lesson the student can learn from on their own, not a short summary: start with the basics, build up step by step, and end with how the idea is used in real life.

Rules:
- Every sentence must match the reading level and vocabulary of that grade
${multi ? '' : '- Kindergarten–2nd grade: 5 sections. 3rd grade and above: 6 sections\n'}${sectionRules()}
- Order the sections from foundation to application and never repeat the same idea in two sections
- "vocab": 3–6 important words used in the guide, each with a short grade-level definition
- "recap": 3–5 short sentences with the most important points to remember
- "related": 3 short ideas (2–6 words) closely connected to the topic that the guide does NOT cover yet, for the student to explore next${source ? '. Keep them inside the class material.' : ''}
${studentBlock(ctx)}${sourceBlock(source, topics)}
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
    max_tokens: multi ? 9000 : 4500,
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

export async function generateWorksheet(topic: string, grade: string, lang: string, source?: string, ctx?: StudentContext, topics?: string[]) {
  const openai = getClient();
  const gradeDesc = gradeContext(grade);
  const multi = !!topics && topics.length > 1;

  const prompt = `Create a printable worksheet about "${multi ? topics!.join('; ') : topic}" for a student at: ${gradeDesc}
${topicsBlock(topics, 'worksheet')}
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
${studentBlock(ctx)}${sourceBlock(source, topics)}
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

/** How many questions of each type a practice test has, by grade */
function practiceMix(grade: string, multi: boolean): string {
  const g = grade.toUpperCase() === 'K' ? 0 : parseInt(grade) || 3;
  if (g <= 1) return `- "mc": ${multi ? 4 : 3} items with 3 short choices each
- "tf": 3 items
- "short": 2 items the student answers in one short sentence`;
  if (g <= 4) return `- "mc": ${multi ? 5 : 4} items with 4 choices each
- "tf": 3 items
- "fill": 3 items
- "short": 3 items answered in 1–3 sentences`;
  return `- "mc": ${multi ? 6 : 5} items with 4 choices each
- "tf": 4 items
- "fill": 3 items
- "short": ${multi ? 5 : 4} items that ask the student to explain why/how, compare, or apply an idea, answered in 2–4 sentences`;
}

/**
 * A practice test the kid fills in on screen: multiple choice, true/false, fill-in and written answers that the AI
 * grades afterwards. Each item says which topic it checks, so results can be broken down per topic.
 */
export async function generatePractice(topic: string, grade: string, lang: string, source?: string, ctx?: StudentContext, topics?: string[], exclude?: string[]) {
  const openai = getClient();
  const gradeDesc = gradeContext(grade);
  const multi = !!topics && topics.length > 1;
  const list = multi ? topics! : [topic];

  const prompt = `Write a practice test that gets a student ready for a school test on ${multi ? `these topics: ${list.map((t) => `"${t}"`).join('; ')}` : `"${topic}"`}. The student is at: ${gradeDesc}
It should feel like a real school test: check understanding of the most important ideas, the way a teacher would ask about them.

${languageRule(lang)}

Questions, by type:
${practiceMix(grade, multi)}

Question types:
- "mc" multiple choice: "q" question, "choices", "a" = 0-based index of the correct choice. Shuffle where the correct answer sits.
- "tf" true or false: "s" a statement (not a question), "a" true/false, and for false statements "fix" = the corrected true statement. Mix true and false. False statements must be clearly false to someone who studied, not trick wording.
- "fill" complete the sentence: "s" a sentence with exactly ONE blank written as "___", "a" = the word, number or short phrase (1–3 words) that goes in the blank. Only one answer must fit.
- "short" written answer: "q" a question the student answers in their own words (e.g. "What is a country?", "Explain why…", "Show how you solve…"), "a" = a complete model answer at the grade level, "points" = the 2–4 key ideas a complete answer must include (short phrases), used to grade the answer.

Rules:
- Vocabulary and complexity must match the grade level above
- Every question checks a different fact or skill; never ask the same thing twice
- Go from easier to harder inside each type
- Math topics: use numbers and problems in every type (e.g. fill "3/4 + 1/4 = ___", short = a word problem asking to show the work)
- "topic" on every item: ${multi ? 'the topic it checks, copied EXACTLY from the list above. Spread the questions evenly so every topic is checked by several questions, including at least one "short" question per topic when there are enough.' : `"${topic}"`}
${topicsBlock(topics, 'practice test')}${studentBlock(ctx)}${excludeBlock(exclude)}${sourceBlock(source, topics)}
Return ONLY valid JSON:
{
  "items": [
    { "type": "mc", "topic": "Topic", "q": "Question", "choices": ["A", "B", "C", "D"], "a": 0 },
    { "type": "tf", "topic": "Topic", "s": "Statement", "a": false, "fix": "Corrected statement" },
    { "type": "fill", "topic": "Topic", "s": "Sentence with a ___ blank.", "a": "word" },
    { "type": "short", "topic": "Topic", "q": "Question", "a": "Model answer", "points": ["Key idea"] }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: exclude?.length ? 0.9 : 0.7,
    max_tokens: multi ? 5000 : 3500,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('No content from OpenAI');
  const test = normalizePractice(JSON.parse(content), list);
  if (test.items.length < 5) throw new Error('Practice test has too few questions');
  return test;
}

export interface AnswerToGrade {
  kind: 'short' | 'fill';
  /** The question, or the sentence with its blank */
  q: string;
  /** Model answer, or the word that goes in the blank */
  expected: string;
  points?: string[];
  answer: string;
}

/** Grades written answers like a kind teacher: correct, partial (right idea, missing details) or wrong, with feedback */
export async function gradeAnswers(items: AnswerToGrade[], grade: string, lang: string, subject?: string) {
  const openai = getClient();
  const gradeDesc = gradeContext(grade);

  const prompt = `You are a kind, encouraging teacher checking a student's answers on a practice test${subject ? ` in ${subject}` : ''}. The student is at: ${gradeDesc}

For each answer decide the "verdict":
- "correct": it gets the idea right and is complete enough for the grade. Other words, short answers and spelling mistakes are fine when the meaning is right.
- "partial": on the right track but missing an important key idea, or too vague (e.g. "What is a country?" → "a piece of land" is partial: right start, but it leaves out that it has its own government, borders and people).
- "wrong": incorrect, off topic, or empty.
For "fill" items the answer must mean the same as the expected word: accept spelling mistakes a child would make, plurals and true synonyms; a different idea is wrong. Numbers must be equal in value.

"feedback": 1–2 short sentences talking to the student ("you"). Start with what is right, then say exactly what is missing or wrong. For correct answers give short praise, and one detail that would make it even better if there is one. Do not copy the whole model answer (it is shown separately).
"missing": the key ideas left out, as 0–3 short phrases (2–8 words); [] when correct.

${languageRule(lang)}

Answers to check:
${JSON.stringify(items.map((it, i) => ({ i, kind: it.kind, question: it.q, expected: it.expected, key_ideas: it.points?.length ? it.points : undefined, student_answer: it.answer })))}

Return ONLY valid JSON with one result per answer, in the same order:
{ "results": [ { "i": 0, "verdict": "partial", "feedback": "…", "missing": ["…"] } ] }`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_tokens: Math.min(4000, 300 + items.length * 180),
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('No content from OpenAI');
  const parsed = JSON.parse(content) as { results?: Array<{ i?: unknown; verdict?: unknown; feedback?: unknown; missing?: unknown }> };
  const out = Array.isArray(parsed.results) ? parsed.results : [];
  return items.map((_, i) => {
    const r = out.find((x) => x?.i === i) ?? out[i];
    const verdict = r?.verdict === 'correct' || r?.verdict === 'partial' || r?.verdict === 'wrong' ? r.verdict : null;
    if (!verdict) return null;
    return { verdict, feedback: str(r?.feedback), missing: strList(r?.missing, 3) };
  });
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

/**
 * Builds the next learning goal for one subject out of the topics and classes the parent added (school topics).
 * It only chooses, orders and names them: it never invents a topic.
 */
export async function generateGoal(input: {
  subject: string; grade: string; level?: number; focus?: string;
  /** The topics the goal may use: the ones the parent added to this subject */
  available: string[];
  strong?: string[]; weak?: string[]; done?: string[]; lang: string;
}) {
  const openai = getClient();
  const gradeDesc = gradeContext(input.grade);

  const prompt = `Build ONE learning goal for a student in the subject "${input.subject}" out of the topics their parent has added from school. The student is enrolled at: ${gradeDesc}
${input.level != null ? `A placement quiz put them at roughly grade level ${input.level === 0 ? 'K' : input.level} in this subject.\n` : ''}${input.focus ? `The parent wants the focus to be: "${input.focus}"\n` : ''}${input.strong?.length ? `Strong at: ${input.strong.join(', ')}\n` : ''}${input.weak?.length ? `Needs practice in: ${input.weak.join(', ')}\n` : ''}${input.done?.length ? `Goals already completed (build on them, do not repeat): ${input.done.join('; ')}\n` : ''}
Available topics (the ONLY topics you may use):
${input.available.map((t) => `- ${t}`).join('\n')}

Choose 2-6 of the available topics that belong together and can be learned in 1-4 weeks of short daily study. Put them in a sensible learning order, foundation first, and prefer topics that match the student's weak areas.
${languageRule(input.lang)}

Rules:
- "topics": the chosen topics, copied EXACTLY as written above. Never add, rename, translate or invent a topic.
- "title": a clear, motivating goal in one sentence that sums up the chosen topics, max 80 characters
- "description": 1-2 plain sentences explaining what the student will be able to do
- "weeks": integer 1-4

Return ONLY valid JSON:
{ "title": "...", "description": "...", "topics": ["..."], "weeks": 2 }`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.4,
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
  const langLabel = languagePromptName(lang);
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

/** Age band of a header illustration: the picture style changes as kids grow, and each band is cached separately */
export type ImageBand = 'young' | 'middle' | 'older';

export function imageBand(grade: string): ImageBand {
  const n = gradeToNumber(grade);
  return n <= 2 ? 'young' : n <= 5 ? 'middle' : 'older';
}

const IMAGE_STYLE: Record<ImageBand, string> = {
  young: 'Bright, cheerful cartoon illustration like a picture book for 5–8 year olds: simple rounded shapes, soft thick outlines, warm saturated colors, cute friendly characters or animal mascots with happy faces, a plain uncluttered background.',
  middle: 'Colorful, detailed storybook-style educational illustration for 8–11 year olds: semi-realistic proportions, clear readable shapes, rich but soft colors, a curious and inviting mood.',
  older: 'Realistic, high-quality educational illustration like a modern textbook or museum exhibit for middle and high school students: accurate details, natural colors and lighting, a clean calm composition.',
};

const IMAGE_SAFETY = 'The image is for children and must be gentle and safe: no violence, weapons, blood, injuries, illness, death, fear, horror or scary creatures; no nudity or revealing clothing; no real or famous people; no logos or brands. Absolutely no text, letters, numbers, labels or captions anywhere in the image.';

/**
 * Draws the header illustration of a study guide in the style of the kid's age band.
 * Three safety gates: the topic goes through OpenAI moderation, a planner turns it into a gentle concrete scene (or refuses),
 * and the image model's own moderation stays at its strictest. Returns null when the topic can't be shown safely to kids.
 */
export async function generateTopicImage(subject: string, topics: string[], grade: string): Promise<Buffer | null> {
  const openai = getClient();
  const topicText = topics.map((t) => `"${t}"`).join('; ');

  const mod = await openai.moderations.create({ model: 'omni-moderation-latest', input: `${subject}: ${topicText}` });
  if (mod.results.some((r) => r.flagged)) return null;

  const plan = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: `You plan the header illustration of a children's study guide.
Subject: ${subject}
Topic${topics.length > 1 ? 's' : ''}: ${topicText}
Student: ${gradeContext(grade)}

Describe ONE simple scene, in English, in 1–2 sentences, that shows what ${topics.length > 1 ? 'these topics are' : 'this topic is'} about so the student recognizes it at a glance.
Rules:
- Use concrete things: objects, animals, plants, places, landscapes, tools or a simple diagram. Show math ideas with everyday objects (e.g. pizza slices for fractions, groups of apples for multiplication), never written numbers or symbols
- Completely gentle and safe for children: no violence, weapons, blood, injuries, illness, death, sad or scary moments, no nudity
- For hard history or science topics (wars, disasters, diseases, the human body) show a calm, neutral side: a map, buildings, everyday objects of the time, a landscape, or a simple friendly diagram
- No real or famous people, and no text, letters or numbers in the scene
- If the topic cannot be shown in a way that is safe for children, set "ok" to false

Return ONLY valid JSON: { "ok": true, "scene": "..." }` }],
    response_format: { type: 'json_object' },
    temperature: 0.5,
    max_tokens: 200,
  });
  const content = plan.choices[0].message.content;
  if (!content) throw new Error('No content from OpenAI');
  const parsed = JSON.parse(content);
  const scene = str(parsed.scene);
  if (parsed.ok === false || !scene) return null;

  try {
    const image = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: `${scene}\n\nStyle: ${IMAGE_STYLE[imageBand(grade)]}\n\n${IMAGE_SAFETY}`,
      size: '1536x1024',
      quality: 'medium',
      output_format: 'webp',
      output_compression: 80,
      moderation: 'auto',
      n: 1,
    });
    const b64 = image.data?.[0]?.b64_json;
    if (!b64) throw new Error('No image from OpenAI');
    return Buffer.from(b64, 'base64');
  } catch (err) {
    // The image model refused the prompt on safety grounds: treat it like an unsafe topic
    if (err instanceof OpenAI.APIError && err.code === 'moderation_blocked') return null;
    throw err;
  }
}
