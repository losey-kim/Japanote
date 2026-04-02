-- Japanote: per-user study state for Supabase sync (see README Supabase section).
-- Run in Supabase SQL Editor or via CLI after linking the project.

create table if not exists public.user_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  study_state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.user_state enable row level security;

create policy "user_state_select_own"
on public.user_state
for select
to authenticated
using (auth.uid() is not null and auth.uid() = user_id);

create policy "user_state_insert_own"
on public.user_state
for insert
to authenticated
with check (auth.uid() is not null and auth.uid() = user_id);

create policy "user_state_update_own"
on public.user_state
for update
to authenticated
using (auth.uid() is not null and auth.uid() = user_id)
with check (auth.uid() is not null and auth.uid() = user_id);
