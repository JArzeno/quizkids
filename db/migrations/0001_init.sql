-- QuizKids initial schema (Railway Postgres)
--
-- Ported from the previous Supabase schema. Two things changed in the port:
--   1. `auth.users` is gone. Accounts live in `users` below, and the app hashes
--      passwords itself (bcrypt) instead of delegating to Supabase Auth. The
--      old `profiles` table was a 1:1 sidecar on `auth.users`, so its columns
--      are folded into `users`.
--   2. Row Level Security is gone. Nothing talks to Postgres from the browser
--      any more, so ownership is enforced in the API route handlers instead of
--      by `auth.uid()` policies.

create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  name text,
  role text not null default 'parent',
  parent_prefs jsonb not null default '{}',
  parent_pin text not null default '1234',
  plan text not null default 'family',
  plan_cycle text not null default 'monthly',
  plan_since bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Email is matched case-insensitively at login, so index the lowered form.
create unique index if not exists users_email_lower_idx on users (lower(email));

create table if not exists kids (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references users(id) on delete cascade,
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
  created_at timestamptz not null default now()
);

create index if not exists kids_parent_id_idx on kids (parent_id);

create table if not exists generated_content (
  id uuid primary key default gen_random_uuid(),
  subject text,
  topic text,
  grade text,
  difficulty text,
  lang text default 'en',
  type text, -- 'quiz' | 'guide' | 'worksheet'
  content jsonb,
  created_at timestamptz not null default now()
);

-- The generate routes look content up by this exact tuple before calling OpenAI.
create index if not exists generated_content_lookup_idx
  on generated_content (type, topic, grade, lang, difficulty);

create table if not exists study_sessions (
  id uuid primary key default gen_random_uuid(),
  kid_id uuid not null references kids(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  minutes integer default 0
);

create index if not exists study_sessions_kid_started_idx
  on study_sessions (kid_id, started_at desc);

create table if not exists kid_assignments (
  id uuid primary key default gen_random_uuid(),
  kid_id uuid not null references kids(id) on delete cascade,
  content_id uuid references generated_content(id) on delete set null,
  subject text,
  topic text,
  grade text,
  type text, -- 'quiz' | 'guide' | 'pdf'
  status text not null default 'pending', -- 'pending' | 'completed'
  assigned_at timestamptz not null default now()
);

create index if not exists kid_assignments_kid_assigned_idx
  on kid_assignments (kid_id, assigned_at desc);

create table if not exists quiz_results (
  id uuid primary key default gen_random_uuid(),
  kid_id uuid not null references kids(id) on delete cascade,
  assignment_id uuid references kid_assignments(id) on delete set null,
  subject text,
  topic text,
  grade text,
  difficulty text,
  total integer,
  correct integer,
  stars integer default 0,
  lang text default 'en',
  created_at timestamptz not null default now()
);

create index if not exists quiz_results_kid_idx on quiz_results (kid_id);
create index if not exists quiz_results_assignment_idx on quiz_results (assignment_id);
