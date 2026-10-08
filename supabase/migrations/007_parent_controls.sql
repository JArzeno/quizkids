-- Migration: parent controls (pause a subject, manual items in today's plan)
-- Run this in your Supabase SQL editor

-- A paused subject is left out of the daily plan; its goal and queue are kept
alter table public.kid_subjects add column if not exists paused boolean not null default false;

-- Items a parent adds by hand belong to no goal
alter table public.kid_plan_items alter column goal_id drop not null;
