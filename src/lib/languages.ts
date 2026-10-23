/**
 * Languages quizzes, guides and worksheets can be generated in. Add a language here and it is accepted by the
 * generation routes, written into the AI prompts and offered in the subject language pickers.
 */
export const CONTENT_LANGUAGES = {
  en: { prompt: 'English', label: 'English' },
  es: { prompt: 'Spanish', label: 'Español' },
  fr: { prompt: 'French', label: 'Français' },
} as const;

export type ContentLang = keyof typeof CONTENT_LANGUAGES;

export const CONTENT_LANG_CODES = Object.keys(CONTENT_LANGUAGES) as ContentLang[];

export function isContentLang(v: unknown): v is ContentLang {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(CONTENT_LANGUAGES, v);
}

/** A language sent by the client, or the fallback when it is missing or unknown */
export function contentLang(v: unknown, fallback: ContentLang = 'en'): ContentLang {
  return isContentLang(v) ? v : fallback;
}

/** English name of a language for AI prompts, e.g. 'es' → 'Spanish' */
export function languagePromptName(lang: string): string {
  return CONTENT_LANGUAGES[contentLang(lang)].prompt;
}
