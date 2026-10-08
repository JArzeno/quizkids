-- QuizKids Supabase Schema
-- Run in Supabase SQL editor

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  role text default 'parent',
  parent_prefs jsonb default '{}',
  parent_pin text default '1234',
  plan text default 'family',
  plan_cycle text default 'monthly',
  plan_since bigint,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.kids (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  grade text not null default 'K',
  avatar text default 'sprout',
  color text default '#3F7A4F',
  code text unique,
  goal_min integer default 30,
  streak integer default 0,
  stars integer default 0,
  minutes_total integer default 0,
  weekly_pct integer default 0,
  last_subject text,
  signature text,
  created_at timestamptz default now()
);

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  kid_id uuid references public.kids(id) on delete cascade,
  started_at timestamptz default now(),
  ended_at timestamptz,
  minutes integer default 0
);

create table if not exists public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  kid_id uuid references public.kids(id) on delete cascade,
  subject text,
  topic text,
  grade text,
  difficulty text,
  total integer,
  correct integer,
  stars integer default 0,
  lang text default 'en',
  created_at timestamptz default now()
);

create table if not exists public.generated_content (
  id uuid primary key default gen_random_uuid(),
  subject text,
  topic text,
  grade text,
  difficulty text,
  lang text default 'en',
  type text, -- 'quiz' | 'guide' | 'worksheet'
  content jsonb,
  created_at timestamptz default now()
);

-- RLS policies
alter table public.profiles enable row level security;
alter table public.kids enable row level security;
alter table public.study_sessions enable row level security;
alter table public.quiz_results enable row level security;
alter table public.generated_content enable row level security;

-- Profiles: users can read/write their own
create policy "profiles_own" on public.profiles
  using (auth.uid() = id) with check (auth.uid() = id);

-- Kids: parents can manage their kids
create policy "kids_parent" on public.kids
  using (parent_id = auth.uid()) with check (parent_id = auth.uid());

-- Sessions: parents can manage via kids
create policy "sessions_parent" on public.study_sessions
  using (kid_id in (select id from public.kids where parent_id = auth.uid()));

-- Quiz results: parents can manage via kids
create policy "results_parent" on public.quiz_results
  using (kid_id in (select id from public.kids where parent_id = auth.uid()));

-- Generated content: readable by all authenticated users (cached)
create policy "content_read" on public.generated_content
  for select using (auth.role() = 'authenticated');
create policy "content_write" on public.generated_content
  for insert using (auth.role() = 'authenticated');

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, new.raw_user_meta_data->>'name', new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Subjects per kid + placement results (see migrations/003_kid_subjects.sql)
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

-- Goals per kid and subject (see migrations/004_kid_goals.sql)
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

-- Daily plan items (see migrations/005_kid_plan_items.sql)
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

-- Adaptive plan (see migrations/006_adaptive_plan.sql): kid_plan_items.position is numeric, kid_plan_items.review boolean, kid_subjects.level_updated_at timestamptz

-- Parent controls (see migrations/007_parent_controls.sql): kid_subjects.paused boolean, kid_plan_items.goal_id nullable (manual items)

-- Topics (classes) per kid and subject (see migrations/008_kid_topics.sql)
create table if not exists public.kid_topics (
  id uuid primary key default gen_random_uuid(),
  kid_id uuid not null references public.kids(id) on delete cascade,
  subject text not null,
  title text not null,
  notes text,                              -- class notes from an imported PDF / photos; grounds generated content
  source text not null default 'manual',   -- 'manual' | 'import' (room for classroom integrations later)
  created_at timestamptz default now()
);

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

-- Custom subjects per parent account (see migrations/009_custom_subjects.sql)
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

-- Custom subject labels (see migrations/010_kid_subject_labels.sql): kid_subjects.name text, kid_subjects.icon text (custom subjects only; kept after the parent deletes the subject)
