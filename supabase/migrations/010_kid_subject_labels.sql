-- Migration: keep a custom subject's name and icon on the kid's subject row, so they still show after the parent deletes the subject in Settings
-- Run this in your Supabase SQL editor

alter table public.kid_subjects add column if not exists name text;   -- custom subjects only ('cus-…'); null for builtin subjects
alter table public.kid_subjects add column if not exists icon text;

-- Fill in the rows that already use a custom subject
update public.kid_subjects ks
set name = cs.name, icon = cs.icon
from public.kids k, public.custom_subjects cs
where k.id = ks.kid_id
  and cs.parent_id = k.parent_id
  and cs.id = ks.subject
  and ks.name is null;
