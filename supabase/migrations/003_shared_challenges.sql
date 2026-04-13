-- Japanote: public short-link storage for friend challenge payloads.
-- Links store only a short code in the URL; the full payload stays in this table.

create table if not exists public.shared_challenges (
  code text primary key,
  kind text not null,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null default timezone('utc', now()) + interval '30 days'
);

create index if not exists shared_challenges_expires_at_idx
on public.shared_challenges (expires_at);

alter table public.shared_challenges enable row level security;

create policy "shared_challenges_select_active"
on public.shared_challenges
for select
to anon, authenticated
using (expires_at > timezone('utc', now()));

create policy "shared_challenges_insert_public"
on public.shared_challenges
for insert
to anon, authenticated
with check (
  char_length(code) between 6 and 32
  and jsonb_typeof(payload) = 'object'
  and expires_at > timezone('utc', now())
  and expires_at <= timezone('utc', now()) + interval '90 days'
);
