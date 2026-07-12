-- NEONSOX social connections + post history
-- Run in Supabase SQL editor after profiles/campaigns/studio_states exist.
-- Tokens are written only by the backend (service role). Frontend never reads secrets.

-- Connected accounts (OAuth or bot tokens stored server-side)
create table if not exists public.social_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text not null check (platform in ('x', 'telegram', 'reddit', 'bluesky', 'discord', 'tiktok', 'signal')),
  account_label text,
  external_account_id text,
  access_token_enc text,
  refresh_token_enc text,
  token_expires_at timestamptz,
  scopes text[] default '{}',
  status text not null default 'active' check (status in ('active', 'revoked', 'error')),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, platform, external_account_id)
);

create index if not exists social_connections_user_id_idx on public.social_connections (user_id);

-- Post attempts from Socials Tray
create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  connection_id uuid references public.social_connections (id) on delete set null,
  platform text not null,
  campaign_key text,
  tray_item_id text,
  generation_id text,
  post_type text not null check (post_type in ('link', 'media', 'text')),
  caption text,
  media_url text,
  status text not null default 'pending' check (status in ('pending', 'posted', 'failed')),
  external_post_id text,
  error text,
  created_at timestamptz not null default now(),
  posted_at timestamptz
);

create index if not exists social_posts_user_id_idx on public.social_posts (user_id);
create index if not exists social_posts_status_idx on public.social_posts (status);

alter table public.social_connections enable row level security;
alter table public.social_posts enable row level security;

-- Members can list their own connections (no token columns exposed to client)
create policy "Users read own social connections"
  on public.social_connections for select
  using (auth.uid() = user_id);

create policy "Users read own social posts"
  on public.social_posts for select
  using (auth.uid() = user_id);

-- Inserts/updates/deletes: service role only (backend). No client write policies.
