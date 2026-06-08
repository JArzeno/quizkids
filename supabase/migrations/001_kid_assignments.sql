-- Migration: Add kid_assignments table and fix RLS policies
-- Run this in your Supabase SQL editor

-- Add kid_assignments table
create table if not exists public.kid_assignments (
  id uuid primary key default gen_random_uuid(),
  kid_id uuid references public.kids(id) on delete cascade,
  content_id uuid references public.generated_content(id) on delete set null,
  subject text,
  topic text,
  grade text,
  type text, -- 'quiz' | 'guide' | 'pdf'
  status text default 'pending', -- 'pending' | 'completed'
  assigned_at timestamptz default now()
);

alter table public.kid_assignments enable row level security;

create policy "assignments_select" on public.kid_assignments
  for select using (kid_id in (select id from public.kids where parent_id = auth.uid()));
create policy "assignments_insert" on public.kid_assignments
  for insert with check (kid_id in (select id from public.kids where parent_id = auth.uid()));
create policy "assignments_update" on public.kid_assignments
  for update using (kid_id in (select id from public.kids where parent_id = auth.uid()));

-- Add assignment_id to quiz_results (optional backref)
alter table public.quiz_results
  add column if not exists assignment_id uuid;

-- Fix content_write RLS (was using `using` instead of `with check` for insert)
drop policy if exists "content_write" on public.generated_content;
create policy "content_write" on public.generated_content
  for insert with check (auth.role() = 'authenticated');

-- Fix sessions insert policy (drop first to avoid duplicate)
drop policy if exists "sessions_insert_parent" on public.study_sessions;
create policy "sessions_insert_parent" on public.study_sessions
  for insert with check (kid_id in (select id from public.kids where parent_id = auth.uid()));

-- Fix results insert policy (drop first to avoid duplicate)
drop policy if exists "results_insert_parent" on public.quiz_results;
create policy "results_insert_parent" on public.quiz_results
  for insert with check (kid_id in (select id from public.kids where parent_id = auth.uid()));
