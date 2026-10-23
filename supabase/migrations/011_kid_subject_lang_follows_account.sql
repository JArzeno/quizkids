-- Migration: a kid's subject follows the account language unless the parent sets one for it
-- Run this in your Supabase SQL editor
--
-- kid_subjects.lang used to default to 'en', so subjects added from a class import or the "add subject" button
-- were studied in English even on a Spanish account. Null now means "same as the account".

alter table public.kid_subjects alter column lang drop default;

-- There was no "same as account" choice before, so every stored language was a default, not a choice:
-- reset them all and let parents pick a different language per subject where they really want one
update public.kid_subjects set lang = null where lang is not null;
