-- NEONSOX Creator Music Library — terms ack + contribution review queue
-- Run in Supabase Dashboard → SQL Editor (once per project).

-- Profile: umbrella Creator Music Terms acceptance
alter table public.profiles
  add column if not exists creator_music_terms_accepted_at timestamptz;

-- Per-track contributions (upload → fingerprint → admin review → catalog)
create table if not exists public.creator_music_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  url text not null,
  filename text,
  credit_name text,
  license_grant text not null default 'neonsox_creator_music_v1',
  license_accepted_at timestamptz not null default now(),
  fingerprint_status text not null default 'pending'
    check (fingerprint_status in ('pending', 'clear', 'match', 'error', 'skipped')),
  fingerprint_detail jsonb,
  review_status text not null default 'pending'
    check (review_status in ('pending', 'approved', 'rejected')),
  review_notes text,
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists creator_music_contributions_user_idx
  on public.creator_music_contributions (user_id, created_at desc);

create index if not exists creator_music_contributions_review_idx
  on public.creator_music_contributions (review_status, created_at desc);

alter table public.creator_music_contributions enable row level security;

-- Contributors can read their own submissions (writes go through service-role API).
drop policy if exists "creator_music_select_own" on public.creator_music_contributions;
create policy "creator_music_select_own"
  on public.creator_music_contributions for select
  to authenticated
  using (auth.uid() = user_id);

-- Approved catalog is public to authenticated members (Editing Bay library).
drop policy if exists "creator_music_select_approved" on public.creator_music_contributions;
create policy "creator_music_select_approved"
  on public.creator_music_contributions for select
  to authenticated
  using (review_status = 'approved' and fingerprint_status = 'clear');
