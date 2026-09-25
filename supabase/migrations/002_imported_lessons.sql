-- Migration: support content generated from imported class material (PDF / photos)
-- Run this in your Supabase SQL editor

-- Hash of the imported class notes the content was generated from (null = generic topic content)
alter table public.generated_content
  add column if not exists source_hash text;

create index if not exists generated_content_source_hash_idx
  on public.generated_content (source_hash)
  where source_hash is not null;
