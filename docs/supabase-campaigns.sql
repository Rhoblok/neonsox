-- NEONSOX Supabase setup: one active campaign setup per user (markets + brief frame)
-- Run in Supabase Dashboard → SQL Editor (once per project).

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  setup jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index if not exists campaigns_user_id_idx on public.campaigns (user_id);

alter table public.campaigns enable row level security;

create policy "campaigns_select_own"
  on public.campaigns for select
  to authenticated
  using (auth.uid() = user_id);

create policy "campaigns_insert_own"
  on public.campaigns for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "campaigns_update_own"
  on public.campaigns for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Optional: keep updated_at fresh on change
create or replace function public.set_campaigns_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists campaigns_updated_at on public.campaigns;
create trigger campaigns_updated_at
  before update on public.campaigns
  for each row execute function public.set_campaigns_updated_at();
