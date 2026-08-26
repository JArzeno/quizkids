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

export async function generateQuiz(topic: string, grade: string, difficulty: string, lang: string) {
  const openai = getClient();
  const langLabel = lang === 'es' ? 'Spanish' : 'English';
  const cardCount = difficulty === 'easy' ? 6 : 8;
  const diffLabel = difficulty === 'easy' ? 'simple and straightforward' : difficulty === 'hard' ? 'challenging with tricky distractors and nuanced distinctions' : 'moderately challenging';
  const gradeDesc = gradeContext(grade);

  const prompt = `Generate ${cardCount} multiple-choice flashcard questions about "${topic}" for a student at: ${gradeDesc}

Questions must be ${diffLabel} and exactly appropriate for that grade level — not too easy, not too hard.
Language: ${langLabel}.

Rules:
- Vocabulary must match the grade level described above
- Kindergarten and 1st grade: use pictures-in-words ("the big yellow star"), very short questions
- 4th grade and above: include one or two questions that require applying knowledge, not just recalling it
- Hard difficulty: include distractors that are plausible but clearly wrong to someone who studied the topic

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

export async function generateGuide(topic: string, grade: string, lang: string) {
  const openai = getClient();
  const langLabel = lang === 'es' ? 'Spanish' : 'English';
  const gradeDesc = gradeContext(grade);

  const prompt = `Create an educational study guide about "${topic}" for a student at: ${gradeDesc}

Language: ${langLabel}.

Rules:
- Every sentence must match the reading level and vocabulary of that grade
- Kindergarten–2nd grade: use 1–2 sentence sections, simple words, relatable analogies (animals, food, toys)
- 3rd–5th grade: 2–3 sentences per section, introduce subject terms with a quick definition
- 6th grade and above: 3–4 sentences, include comparisons, cause/effect, and real-world applications
- The "key" field is one memorable sentence — the #1 takeaway

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

export async function generateWorksheet(topic: string, grade: string, lang: string) {
  const openai = getClient();
  const langLabel = lang === 'es' ? 'Spanish' : 'English';
  const gradeDesc = gradeContext(grade);

  const prompt = `Create 6 printable worksheet questions about "${topic}" for a student at: ${gradeDesc}

Language: ${langLabel}.

Rules:
- Questions must match vocabulary and complexity for that grade level
- Mix question types when appropriate for the grade (multiple choice, fill-in-the-blank, short answer)
- The bonus activity should be hands-on and grade-appropriate (draw, label, write a sentence, etc.)

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

/**
 * "Learn more" — a deeper pass on a topic the kid is already reading about.
 * Returns extra sections, each of which may carry worked examples, vocabulary,
 * and a small dataset the UI renders as a graph example.
 */
export async function generateLearnMore(topic: string, grade: string, lang: string, focus?: string) {
  const openai = getClient();
  const langLabel = lang === 'es' ? 'Spanish' : 'English';
  const gradeDesc = gradeContext(grade);
  const focusLine = focus
    ? `Go deeper specifically on this part of the topic: "${focus}".`
    : 'Go deeper on the whole topic, past what a first study guide would cover.';

  const prompt = `A student just read a study guide about "${topic}" and tapped "Learn more". ${focusLine}

Student level: ${gradeDesc}
Language: ${langLabel}.

Rules:
- Add NEW information — do not repeat the basics a first guide already covered
- 2 or 3 extra sections, each 3–5 sentences at the grade's reading level
- Each section gets 2–3 concrete examples the student can picture
- Define any new term in kid-friendly words
- Exactly ONE of the sections must include a "chart" with 3–6 real, roughly accurate
  data points about the topic, so the student can read a graph about what they studied.
  Use whole numbers, keep every value in the same unit, and label the unit.
  Pick "bar" for comparisons between things and "line" for change over time.

Return ONLY valid JSON in this exact format:
{
  "extras": [
    {
      "title": "Section title",
      "body": "Deeper explanation at the grade level",
      "examples": ["Example one", "Example two"],
      "vocab": [{ "term": "word", "meaning": "kid-friendly definition" }],
      "chart": {
        "title": "What the graph shows",
        "caption": "One sentence on how to read it",
        "unit": "days",
        "kind": "bar",
        "points": [{ "label": "Item", "value": 12 }]
      }
    }
  ]
}
Only one section has "chart"; the others omit the field entirely.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 2200,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('No content from OpenAI');
  return JSON.parse(content);
}

/** Suggestions for what a kid could study next, based on grade and what they've done. */
export async function generateSuggestions(opts: {
  grade: string;
  lang: string;
  recentTopics?: string[];
  subjects?: Array<{ id: string; label: string }>;
  limit?: number;
}) {
  const openai = getClient();
  const { grade, lang, recentTopics = [], subjects = [], limit = 6 } = opts;
  const langLabel = lang === 'es' ? 'Spanish' : 'English';
  const gradeDesc = gradeContext(grade);
  const subjectList = subjects.length
    ? subjects.map((s) => `"${s.id}" (${s.label})`).join(', ')
    : '"sci" (Science), "math" (Math), "lang" (Language Arts), "soc" (Social Studies), "art" (Art)';
  const doneLine = recentTopics.length
    ? `They have already studied: ${recentTopics.slice(0, 12).map((t) => `"${t}"`).join(', ')}. Do not suggest those again, but you may suggest a natural next step after one of them.`
    : 'They have not studied anything yet, so start with welcoming, foundational topics.';

  const prompt = `Suggest ${limit} topics a student could study next.

Student level: ${gradeDesc}
Language for all text you return: ${langLabel}.
${doneLine}

Choose the "subject" for each suggestion from exactly this list of ids: ${subjectList}.
Spread the suggestions across at least three different subjects.
Each "reason" is one short, encouraging sentence (max 12 words) written TO the student.
Each "topic" is a school-appropriate topic name of 2–5 words, not a question.

Return ONLY valid JSON:
{
  "suggestions": [
    { "subject": "sci", "topic": "Topic name", "reason": "Why this is a good next step" }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.8,
    max_tokens: 900,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('No content from OpenAI');
  return JSON.parse(content);
}
