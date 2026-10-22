-- Migration: custom subjects saved on the parent's account, so they show the same on every device
-- Run this in your Supabase SQL editor

create table if not exists public.custom_subjects (
  parent_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,                        -- 'cus-…', the value kid_subjects.subject (and other subject columns) hold
  name text not null,
  icon text not null default '📚',
  color text not null default '#3F7A4F',
  created_at timestamptz default now(),
  primary key (parent_id, id)
);

alter table public.custom_subjects enable row level security;

create policy "custom_subjects_select" on public.custom_subjects
  for select using (parent_id = auth.uid());
create policy "custom_subjects_insert" on public.custom_subjects
  for insert with check (parent_id = auth.uid());
create policy "custom_subjects_update" on public.custom_subjects
  for update using (parent_id = auth.uid());
create policy "custom_subjects_delete" on public.custom_subjects
  for delete using (parent_id = auth.uid());
