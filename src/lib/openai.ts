import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateQuiz(topic: string, grade: string, difficulty: string, lang: string) {
  const langLabel = lang === 'es' ? 'Spanish' : 'English';
  const cardCount = difficulty === 'easy' ? 6 : 8;
  const diffLabel = difficulty === 'easy' ? 'simple' : difficulty === 'hard' ? 'challenging with tricky variations' : 'moderately challenging';

  const prompt = `Generate ${cardCount} multiple-choice flashcard questions about "${topic}" for a grade ${grade} student.
Questions should be ${diffLabel}.
Language: ${langLabel}.
Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "q": "Question text",
      "choices": ["A", "B", "C", "D"],
      "a": 0,
      "hint": "A helpful hint about the answer"
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
  const langLabel = lang === 'es' ? 'Spanish' : 'English';

  const prompt = `Create an educational study guide about "${topic}" for a grade ${grade} student.
Language: ${langLabel}.
Return ONLY valid JSON in this exact format:
{
  "intro": "A 1-2 sentence friendly introduction",
  "sections": [
    {
      "title": "Section title",
      "body": "2-3 sentence explanation appropriate for the grade",
      "tone": "honey",
      "key": "One key takeaway sentence"
    }
  ],
  "fact": "A fun, surprising fact about the topic"
}
Include 3-4 sections. Use tone values: honey, primary, sky, coral.
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
  const langLabel = lang === 'es' ? 'Spanish' : 'English';

  const prompt = `Create 6 worksheet questions about "${topic}" for a grade ${grade} student.
Language: ${langLabel}.
Return ONLY valid JSON:
{
  "questions": [
    {
      "q": "Question text",
      "choices": ["A", "B", "C", "D"],
      "a": 0,
      "hint": "A hint"
    }
  ],
  "bonus": "A fun bonus activity description (draw something or write something)"
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
