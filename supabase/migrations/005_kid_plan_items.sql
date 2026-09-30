-- Migration: daily study plan items (a queue per active goal, handed out weekday by weekday)
-- Run this in your Supabase SQL editor

create table if not exists public.kid_plan_items (
  id uuid primary key default gen_random_uuid(),
  kid_id uuid not null references public.kids(id) on delete cascade,
  goal_id uuid not null references public.kid_goals(id) on delete cascade,
  subject text not null,
  topic text not null,                     -- goal topic (or the goal title for the final test)
  type text not null,                      -- 'guide' | 'quiz' | 'pdf' | 'test'
  position integer not null,               -- order inside the goal's queue
  minutes integer not null default 8,      -- estimated study time
  plan_date date,                          -- weekday it was handed out for; null = still queued
  content_id uuid references public.generated_content(id) on delete set null,
  status text not null default 'pending',  -- 'pending' | 'completed'
  completed_at timestamptz,
  created_at timestamptz default now(),
  unique (goal_id, position)
);

create index if not exists kid_plan_items_kid_date on public.kid_plan_items (kid_id, plan_date);

alter table public.kid_plan_items enable row level security;

create policy "plan_items_select" on public.kid_plan_items
  for select using (kid_id in (select id from public.kids where parent_id = auth.uid()));
create policy "plan_items_insert" on public.kid_plan_items
  for insert with check (kid_id in (select id from public.kids where parent_id = auth.uid()));
create policy "plan_items_update" on public.kid_plan_items
  for update using (kid_id in (select id from public.kids where parent_id = auth.uid()));
create policy "plan_items_delete" on public.kid_plan_items
  for delete using (kid_id in (select id from public.kids where parent_id = auth.uid()));
