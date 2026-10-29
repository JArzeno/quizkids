-- Migration: exam mode (a full study kit per school test, practice test results and the grade the kid got)
-- Run this in your Supabase SQL editor

alter table public.kid_tests
  add column if not exists worksheet_content_id uuid references public.generated_content(id) on delete set null,
  add column if not exists practice_content_id uuid references public.generated_content(id) on delete set null,
  -- Latest practice test results: { attempts, last, best, at, byTopic: { topic: pct }, weak: [topic], missed: [what was missed] }
  add column if not exists practice_stats jsonb,
  add column if not exists result_grade text,      -- the grade the kid got at school, as written (e.g. "92", "B+", "8/10")
  add column if not exists result_pct integer,     -- the same grade as 0-100 when it can be read as one
  add column if not exists result_note text,       -- what was hard, or what the teacher said
  add column if not exists result_at timestamptz;
