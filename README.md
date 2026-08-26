# quizkids

A cozy place for kids (K-12) to study: AI-generated quizzes, study guides, and
printable worksheets, bilingual EN/ES.

## Running locally

```bash
npm install
npm run dev
```

Environment variables (`.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
OPENAI_API_KEY=...
```

Without `OPENAI_API_KEY` the app still runs: quizzes and guides fall back to
built-in sample content, and study suggestions come from the local topic library.

## Supabase

Run the SQL files in order in the Supabase SQL editor:

1. `supabase/schema.sql`
2. `supabase/migrations/001_kid_assignments.sql`
3. `supabase/migrations/002_study_log_and_custom_topics.sql`

Migration 002 is what makes the study-time log complete (`seconds`, `subject`,
`topic`, `activity` on `study_sessions`) and adds `custom_topics` for topics a
parent types into the picker. Until it runs, sessions still save with
minute-level precision and custom topics stay on the device.

## How study time is tracked

The timer lives in the shared store (`src/lib/store.ts`), so it keeps running
while a kid moves between their home, a guide, a quiz, and the results screen,
and it survives a reload. Opening a study starts it automatically; finishing a
quiz (or tapping stop, switching profiles, or logging out) closes the session and
writes it to the log, which both the kid and the parent can review.
