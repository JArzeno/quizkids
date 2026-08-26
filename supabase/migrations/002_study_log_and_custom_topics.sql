-- Migration: richer study-time log + saved custom topics
-- Run this in your Supabase SQL editor.

-- 1. Study time log ---------------------------------------------------------
-- Sessions now record seconds (so a 40-second study is not rounded away) plus
-- what was being studied, which is what the kid and parent review screens show.
alter table public.study_sessions
  add column if not exists seconds integer default 0,
  add column if not exists subject text,
  add column if not exists topic text,
  add column if not exists activity text; -- 'quiz' | 'guide' | 'pdf' | 'free'

-- Backfill seconds for rows written before this migration.
update public.study_sessions
  set seconds = coalesce(minutes, 0) * 60
  where coalesce(seconds, 0) = 0 and coalesce(minutes, 0) > 0;

create index if not exists study_sessions_kid_started_idx
  on public.study_sessions (kid_id, started_at desc);

-- 2. Custom topics ---------------------------------------------------------
-- Topics a parent types into the picker are saved per subject so they show up as
-- a topic card next time, for that subject only.
create table if not exists public.custom_topics (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.profiles(id) on delete cascade,
  subject text not null,
  topic text not null,
  created_at timestamptz default now(),
  unique (parent_id, subject, topic)
);

alter table public.custom_topics enable row level security;

drop policy if exists "custom_topics_select" on public.custom_topics;
create policy "custom_topics_select" on public.custom_topics
  for select using (parent_id = auth.uid());

drop policy if exists "custom_topics_insert" on public.custom_topics;
create policy "custom_topics_insert" on public.custom_topics
  for insert with check (parent_id = auth.uid());

drop policy if exists "custom_topics_delete" on public.custom_topics;
create policy "custom_topics_delete" on public.custom_topics
  for delete using (parent_id = auth.uid());
