-- Run this in Supabase SQL Editor. Then seed daily_puzzles for each play_date you need.

create table if not exists public.daily_puzzles (
  play_date date primary key,
  card_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists daily_puzzles_play_date_idx on public.daily_puzzles (play_date desc);

create table if not exists public.game_completions (
  id uuid primary key default gen_random_uuid(),
  play_date date not null references public.daily_puzzles (play_date) on delete restrict,
  guess_count int not null check (guess_count > 0 and guess_count <= 200),
  client_id text not null,
  completed_at timestamptz not null default now(),
  unique (play_date, client_id)
);

create or replace function public.get_guess_stats(p_play_date date)
returns table (avg_guesses numeric, completion_count bigint)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(round(avg(guess_count)::numeric, 2), 0) as avg_guesses,
    count(*)::bigint as completion_count
  from public.game_completions
  where play_date = p_play_date;
$$;

grant execute on function public.get_guess_stats(date) to anon, authenticated;

alter table public.daily_puzzles enable row level security;
alter table public.game_completions enable row level security;

drop policy if exists "read past and today puzzles" on public.daily_puzzles;
create policy "read past and today puzzles"
  on public.daily_puzzles for select
  to anon, authenticated
  using (play_date <= (current_timestamp at time zone 'utc')::date);

drop policy if exists "insert own completion" on public.game_completions;
create policy "insert own completion"
  on public.game_completions for insert
  to anon, authenticated
  with check (true);

-- Example seed (replace card_id with a real id from your CARDS list):
-- insert into public.daily_puzzles (play_date, card_id) values (current_date, 'your-card-id-here')
--   on conflict (play_date) do update set card_id = excluded.card_id;
