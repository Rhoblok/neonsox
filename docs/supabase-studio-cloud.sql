-- NEONSOX cloud studio: clips + full studio state (cross-device)
-- Run in Supabase Dashboard → SQL Editor (once per project).

create table if not exists public.studio_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  campaign_key text not null,
  state jsonb not null default '{}'::jsonb,
  socials_tray jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, campaign_key)
);

create index if not exists studio_states_user_idx on public.studio_states (user_id);

alter table public.studio_states enable row level security;

create policy "studio_states_select_own"
  on public.studio_states for select
  to authenticated
  using (auth.uid() = user_id);

create policy "studio_states_insert_own"
  on public.studio_states for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "studio_states_update_own"
  on public.studio_states for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'campaign-clips',
  'campaign-clips',
  true,
  104857600,
  array['video/mp4']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "campaign_clips_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'campaign-clips'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
