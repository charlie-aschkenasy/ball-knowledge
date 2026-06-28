-- ============================================================
-- Ball Knowledge — Phase 1 schema
-- HOW TO RUN: Supabase → SQL Editor → New query → paste all of this → Run.
-- Safe to read top to bottom; it creates tables, security rules, a
-- leaderboard view, and an auto-profile trigger.
-- ============================================================


-- 1. PROFILES -------------------------------------------------
-- One row per user, linked to Supabase Auth.
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Any signed-in user can read profiles (needed to show names on the board).
create policy "profiles readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

-- You can create/update only your OWN profile.
create policy "users manage their own profile"
  on public.profiles for all
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Player'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- 2. QUESTIONS ------------------------------------------------
-- The bank. Correct answers live here and must NEVER reach the client.
-- RLS is ON with NO policies, so anon/authenticated users get ZERO access.
-- Only Edge Functions (running with the service role) can read this table.
create table public.questions (
  id                 text primary key,
  type               text not null check (type in ('multiple_choice','fill_in_blank','matching')),
  sport              text not null,
  difficulty         int not null check (difficulty between 1 and 5),
  prompt             text not null,
  options            jsonb,            -- MC: array of option strings (shown to client)
  correct_index      int,              -- MC: index of correct option        [SECRET]
  acceptable_answers jsonb,            -- FIB: array of accepted strings      [SECRET]
  pairs              jsonb,            -- matching: [{left,right}] (right side [SECRET])
  verified           boolean not null default false,
  source_url         text,
  created_at         timestamptz not null default now()
);

alter table public.questions enable row level security;
-- (Intentionally no policies — the table is locked to clients.)


-- 3. DAILY SETS -----------------------------------------------
-- Which questions are "today." Also client-locked; served via Edge Function.
create table public.daily_sets (
  play_date    date primary key,
  question_ids text[] not null,
  published_at timestamptz not null default now()
);

alter table public.daily_sets enable row level security;
-- (No policies — clients reach today's set only through the Edge Function.)


-- 4. SUBMISSIONS ----------------------------------------------
-- One row per user per day. Written ONLY by the grading Edge Function
-- (service role), so the client can't fake a score.
create table public.submissions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  play_date     date not null,
  answers       jsonb not null,
  started_at    timestamptz not null,
  submitted_at  timestamptz not null default now(),
  correct_count int not null,
  score         int not null,
  unique (user_id, play_date)         -- enforces one play per day
);

alter table public.submissions enable row level security;

-- You can read your OWN submissions (for your recap / "played today?" check).
create policy "users read their own submissions"
  on public.submissions for select
  to authenticated
  using (auth.uid() = user_id);

-- NOTE: there is deliberately NO client insert/update policy.
-- All writes happen server-side in the grading function (service role),
-- which bypasses RLS. This is what stops fake scores.


-- 5. LEADERBOARD VIEW -----------------------------------------
-- Exposes scores + names ONLY — never answers. Safe for clients to read.
create view public.leaderboard as
  select
    s.play_date,
    s.user_id,
    p.display_name,
    s.correct_count,
    s.score,
    s.submitted_at
  from public.submissions s
  join public.profiles p on p.id = s.user_id;

-- Run the view with the owner's rights so it can show everyone's scores
-- (it only selects safe columns, so this leaks nothing sensitive).
alter view public.leaderboard set (security_invoker = off);
grant select on public.leaderboard to authenticated;


-- 6. ANSWER EVENTS (analytics) -------------------------------
-- One row per answered question. Powers future difficulty/points tuning.
-- Written only by the submit function (service role); read by you in SQL.
create table public.answer_events (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  question_id  text not null,
  play_date    date not null,
  submitted_at timestamptz not null default now(),
  was_correct  boolean not null,
  answer       jsonb,
  time_ms      int,
  sport        text not null,   -- snapshot at answer time
  difficulty   int not null,    -- snapshot at answer time
  q_type       text not null,
  unique (user_id, question_id, play_date)
);

alter table public.answer_events enable row level security;
create index answer_events_question_idx  on public.answer_events (question_id);
create index answer_events_play_date_idx on public.answer_events (play_date);

create view public.question_stats as
  select
    e.question_id,
    q.sport,
    q.difficulty,
    count(*)                                       as times_shown,
    count(*) filter (where e.was_correct)          as times_correct,
    round(avg((e.was_correct)::int)::numeric, 3)   as accuracy,
    round(avg(e.time_ms)::numeric, 0)              as avg_time_ms
  from public.answer_events e
  left join public.questions q on q.id = e.question_id
  group by e.question_id, q.sport, q.difficulty;
