-- ===========================================================================
-- Baseline: the schema that was originally created in the Supabase dashboard
-- (before migration tracking existed). Reproduced verbatim from prod so that
-- fresh databases (e.g. preview branches) can rebuild the full schema, and the
-- later migrations (answer_events, question_stats) have their dependencies.
--
-- IDEMPOTENT BY DESIGN: every statement is a no-op against the existing prod
-- database (create-if-not-exists, guarded policies/trigger, create-or-replace),
-- so recording this baseline in prod's migration history changes nothing there.
-- On a fresh branch it builds everything for real.
-- ===========================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles — one row per auth user (created by the on_auth_user_created trigger)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at   timestamptz not null default now()
);
alter table public.profiles enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles'
                 and policyname='profiles readable by authenticated users') then
    create policy "profiles readable by authenticated users"
      on public.profiles for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles'
                 and policyname='users manage their own profile') then
    create policy "users manage their own profile"
      on public.profiles for all to authenticated
      using (auth.uid() = id) with check (auth.uid() = id);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- questions — the bank. RLS on with NO policies: only the service role (Edge
-- Functions) ever reads it, so correct answers never reach a client.
-- ---------------------------------------------------------------------------
create table if not exists public.questions (
  id                 text primary key,
  type               text not null check (type = any (array['multiple_choice','fill_in_blank','matching'])),
  sport              text not null,
  difficulty         integer not null check (difficulty >= 1 and difficulty <= 5),
  prompt             text not null,
  options            jsonb,
  correct_index      integer,
  acceptable_answers jsonb,
  pairs              jsonb,
  verified           boolean not null default false,
  source_url         text,
  created_at         timestamptz not null default now()
);
alter table public.questions enable row level security;

-- ---------------------------------------------------------------------------
-- daily_sets — which question ids are "today". RLS on, no policies.
-- ---------------------------------------------------------------------------
create table if not exists public.daily_sets (
  play_date    date primary key,
  question_ids text[] not null,
  published_at timestamptz not null default now()
);
alter table public.daily_sets enable row level security;

-- ---------------------------------------------------------------------------
-- submissions — one row per user per day (the leaderboard source). Clients may
-- read their own (SELECT policy); only the service role writes (no write policy).
-- ---------------------------------------------------------------------------
create table if not exists public.submissions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  play_date     date not null,
  answers       jsonb not null,
  started_at    timestamptz not null,
  submitted_at  timestamptz not null default now(),
  correct_count integer not null,
  score         integer not null,
  unique (user_id, play_date)
);
alter table public.submissions enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='submissions'
                 and policyname='users read their own submissions') then
    create policy "users read their own submissions"
      on public.submissions for select to authenticated using (auth.uid() = user_id);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- leaderboard — public view the client reads (display_name + score per day).
-- ---------------------------------------------------------------------------
create or replace view public.leaderboard as
  select s.play_date, s.user_id, p.display_name, s.correct_count, s.score, s.submitted_at
  from public.submissions s
  join public.profiles p on p.id = s.user_id;

-- ---------------------------------------------------------------------------
-- Auth → profile bridge: create a profile row whenever an auth user is created.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Player'));
  return new;
end;
$$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname='on_auth_user_created' and not tgisinternal) then
    create trigger on_auth_user_created
      after insert on auth.users for each row execute function public.handle_new_user();
  end if;
end $$;
