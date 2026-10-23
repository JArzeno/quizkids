-- Migration: header illustrations for study guides, shared by every kid (one per age band + subject + topic)
-- Run this in your Supabase SQL editor

create table if not exists public.topic_images (
  key text primary key,                   -- hash of age band + subject + topic(s)
  band text not null,                     -- 'young' (K–2) | 'middle' (3–5) | 'older' (6+)
  subject text not null,
  topic text not null,                    -- the topic, or the test's topics joined with '; '
  status text not null default 'pending', -- 'pending' (being drawn) | 'ready' | 'blocked' (not safe to show kids, never retried)
  path text,                              -- object path in the topic-images bucket once ready
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Only the server (service role) reads and writes this cache: RLS on with no policies means no browser access
alter table public.topic_images enable row level security;

-- Public bucket: the images hold no personal data, and kids load them straight from their public URL
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('topic-images', 'topic-images', true, 5242880, array['image/webp'])
on conflict (id) do nothing;
