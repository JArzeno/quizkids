-- Migration: subjects per kid + placement (diagnostic) results
-- Run this in your Supabase SQL editor

create table if not exists public.kid_subjects (
  id uuid primary key default gen_random_uuid(),
  kid_id uuid not null references public.kids(id) on delete cascade,
  subject text not null,                 -- 'sci' | 'math' | 'lang' | 'soc' | 'art' | 'fr' | 'cus-…'
  lang text default 'en',                -- language this subject is studied in: 'en' | 'es' | 'fr'
  focus text,                            -- optional parent note, e.g. "fractions and decimals"
  level integer,                         -- estimated grade level for this subject (0 = K), null until placed
  strong_topics jsonb default '[]',
  weak_topics jsonb default '[]',
  placement_accuracy integer,            -- overall % on the placement quiz
  placed_at timestamptz,                 -- null = placement not taken yet
  created_at timestamptz default now(),
  unique (kid_id, subject)
);

alter table public.kid_subjects enable row level security;

create policy "kid_subjects_select" on public.kid_subjects
  for select using (kid_id in (select id from public.kids where parent_id = auth.uid()));
create policy "kid_subjects_insert" on public.kid_subjects
  for insert with check (kid_id in (select id from public.kids where parent_id = auth.uid()));
create policy "kid_subjects_update" on public.kid_subjects
  for update using (kid_id in (select id from public.kids where parent_id = auth.uid()));
create policy "kid_subjects_delete" on public.kid_subjects
  for delete using (kid_id in (select id from public.kids where parent_id = auth.uid()));
