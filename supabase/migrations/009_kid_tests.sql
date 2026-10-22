-- Migration: test prep (a quiz + study guide covering topics picked for a school test)
-- Run this in your Supabase SQL editor

create table if not exists public.kid_tests (
  id uuid primary key default gen_random_uuid(),
  kid_id uuid not null references public.kids(id) on delete cascade,
  subject text not null,
  title text not null,                     -- also the topic name its quiz results are saved under
  topics text[] not null default '{}',     -- titles of the kid_topics the test covers
  test_date date,                          -- when the school test is, if known
  guide_content_id uuid references public.generated_content(id) on delete set null,
  quiz_content_id uuid references public.generated_content(id) on delete set null,
  lang text,
  created_at timestamptz default now()
);

create index if not exists kid_tests_kid_subject on public.kid_tests (kid_id, subject, created_at desc);

alter table public.kid_tests enable row level security;

create policy "kid_tests_select" on public.kid_tests
  for select using (kid_id in (select id from public.kids where parent_id = auth.uid()));
create policy "kid_tests_insert" on public.kid_tests
  for insert with check (kid_id in (select id from public.kids where parent_id = auth.uid()));
create policy "kid_tests_update" on public.kid_tests
  for update using (kid_id in (select id from public.kids where parent_id = auth.uid()));
create policy "kid_tests_delete" on public.kid_tests
  for delete using (kid_id in (select id from public.kids where parent_id = auth.uid()));
