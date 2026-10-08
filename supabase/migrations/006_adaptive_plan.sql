-- Migration: adaptive study plan (review items inserted mid-queue, skipped items, level tracking)
-- Run this in your Supabase SQL editor

-- Review items are inserted between existing ones, so positions become fractional
alter table public.kid_plan_items alter column position type numeric(10,2);
alter table public.kid_plan_items add column if not exists review boolean not null default false;
-- status now also accepts 'skipped' (topic already mastered); it is a plain text column, no constraint to change

-- When the estimated level of a subject was last adjusted from quiz results
alter table public.kid_subjects add column if not exists level_updated_at timestamptz;
