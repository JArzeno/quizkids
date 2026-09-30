-- Migration: goals per kid and subject
-- Run this in your Supabase SQL editor

create table if not exists public.kid_goals (
  id uuid primary key default gen_random_uuid(),
  kid_id uuid not null references public.kids(id) on delete cascade,
  subject text not null,
  title text not null,
  description text,
  topics jsonb not null default '[]',    -- ordered list of topic names the goal covers
  weeks integer,                         -- suggested timeline
  target_date date,                      -- set when the goal is approved
  status text not null default 'proposed', -- 'proposed' | 'active' | 'completed'
  created_at timestamptz default now(),
  approved_at timestamptz,
  completed_at timestamptz
);

-- At most one active and one proposed goal per kid and subject
create unique index if not exists kid_goals_one_active
  on public.kid_goals (kid_id, subject) where status = 'active';
create unique index if not exists kid_goals_one_proposed
  on public.kid_goals (kid_id, subject) where status = 'proposed';

alter table public.kid_goals enable row level security;

create policy "kid_goals_select" on public.kid_goals
  for select using (kid_id in (select id from public.kids where parent_id = auth.uid()));
create policy "kid_goals_insert" on public.kid_goals
  for insert with check (kid_id in (select id from public.kids where parent_id = auth.uid()));
create policy "kid_goals_update" on public.kid_goals
  for update using (kid_id in (select id from public.kids where parent_id = auth.uid()));
create policy "kid_goals_delete" on public.kid_goals
  for delete using (kid_id in (select id from public.kids where parent_id = auth.uid()));
