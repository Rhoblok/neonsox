-- NEONSOX Supabase setup: profiles table + auto-create row on signup
-- Run in Supabase Dashboard → SQL Editor (once per project).

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text default 'member',
  has_membership boolean not null default false,
  has_campaign boolean not null default false,
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read their own profile (payment flags for Pricing / Member / Dashboard).
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- Service role (backend webhook) bypasses RLS — no insert/update policy needed for members.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Optional: backfill existing auth users missing a profile row
insert into public.profiles (id)
select id from auth.users
where id not in (select id from public.profiles)
on conflict (id) do nothing;
