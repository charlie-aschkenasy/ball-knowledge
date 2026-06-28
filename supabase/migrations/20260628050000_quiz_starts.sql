-- ===========================================================================
-- quiz_starts — server-anchored start time for the daily run. get-today inserts
-- (on first fetch) the server timestamp; submit enforces the time window against
-- it. Re-fetching never resets the clock (insert ... on conflict do nothing).
--
-- Locked exactly like answer_events: RLS on, NO policies, grants revoked. Only
-- the service role (Edge Functions) reads/writes it.
-- ===========================================================================
create table if not exists public.quiz_starts (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  play_date  date not null,
  started_at timestamptz not null default now(),
  primary key (user_id, play_date)
);

alter table public.quiz_starts enable row level security;
revoke all on public.quiz_starts from anon, authenticated;
