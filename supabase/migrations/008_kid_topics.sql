-- Migration: topics (classes) a parent adds inside a kid's subject
-- Run this in your Supabase SQL editor

create table if not exists public.kid_topics (
  id uuid primary key default gen_random_uuid(),
  kid_id uuid not null references public.kids(id) on delete cascade,
  subject text not null,
  title text not null,
  notes text,                              -- class notes from an imported PDF / photos; grounds generated content
  source text not null default 'manual',   -- 'manual' | 'import' (room for classroom integrations later)
  created_at timestamptz default now()
);

-- One topic per name inside a kid's subject
create unique index if not exists kid_topics_unique
  on public.kid_topics (kid_id, subject, lower(title));

alter table public.kid_topics enable row level security;

create policy "kid_topics_select" on public.kid_topics
  for select using (kid_id in (select id from public.kids where parent_id = auth.uid()));
create policy "kid_topics_insert" on public.kid_topics
  for insert with check (kid_id in (select id from public.kids where parent_id = auth.uid()));
create policy "kid_topics_update" on public.kid_topics
  for update using (kid_id in (select id from public.kids where parent_id = auth.uid()));
create policy "kid_topics_delete" on public.kid_topics
  for delete using (kid_id in (select id from public.kids where parent_id = auth.uid()));
