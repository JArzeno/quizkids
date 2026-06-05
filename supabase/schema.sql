-- QuizKids Supabase Schema
-- Run in Supabase SQL editor

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  role text default 'parent',
  parent_prefs jsonb default '{}',
  parent_pin text default '1234',
  plan text default 'free',
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
