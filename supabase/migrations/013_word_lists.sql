-- Migration: word lists (words or sentences a kid practices spelling, e.g. for a dictation or a spelling olympiad)
-- Run this in your Supabase SQL editor

create table if not exists public.kid_word_lists (
  id uuid primary key default gen_random_uuid(),
  kid_id uuid not null references public.kids(id) on delete cascade,
  subject text not null,
  title text not null,
  words text[] not null default '{}',      -- one word or sentence each; "tuvo (Él tuvo suerte)" adds a sentence to hear it in
  test_date date,                          -- day of the dictation, if known
  lang text,                               -- language the words are read aloud in
  stats jsonb not null default '{}'::jsonb, -- per word: { ok, miss, last (right the last time), at }
  created_at timestamptz default now()
);

create index if not exists kid_word_lists_kid_subject on public.kid_word_lists (kid_id, subject, created_at desc);

alter table public.kid_word_lists enable row level security;

create policy "kid_word_lists_select" on public.kid_word_lists
  for select using (kid_id in (select id from public.kids where parent_id = auth.uid()));
create policy "kid_word_lists_insert" on public.kid_word_lists
  for insert with check (kid_id in (select id from public.kids where parent_id = auth.uid()));
create policy "kid_word_lists_update" on public.kid_word_lists
  for update using (kid_id in (select id from public.kids where parent_id = auth.uid()));
create policy "kid_word_lists_delete" on public.kid_word_lists
  for delete using (kid_id in (select id from public.kids where parent_id = auth.uid()));
