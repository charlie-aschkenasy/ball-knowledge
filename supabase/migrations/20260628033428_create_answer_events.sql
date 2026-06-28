-- One row per question answered. Server (service role) writes; owner reads.
-- snapshot_* columns freeze the question's sport/difficulty/type at answer time
-- so later re-tuning of a question does not rewrite historical analytics.
create table public.answer_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id text not null,
  play_date date not null,
  submitted_at timestamptz not null default now(),
  was_correct boolean not null,
  answer jsonb,            -- what the player picked (value object); null if no answer
  time_ms integer,         -- ms spent on the question; nullable
  -- snapshot at answer time:
  sport text,
  difficulty integer,
  type text,
  constraint answer_events_user_question_date_key
    unique (user_id, question_id, play_date)
);

create index answer_events_question_id_idx on public.answer_events (question_id);
create index answer_events_play_date_idx on public.answer_events (play_date);

-- Lock down: RLS on, and intentionally NO policies. Clients (anon/authenticated)
-- can neither read nor write. The Edge Function uses the service role, which
-- bypasses RLS. The owner reads via the dashboard / service role.
alter table public.answer_events enable row level security;

-- Defense in depth: ensure the API roles have no table privileges either.
revoke all on public.answer_events from anon, authenticated;
