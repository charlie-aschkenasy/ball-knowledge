-- ===========================================================================
-- question_proposals — staging area for user-submitted questions (UGC).
-- Flow: user submits prompt+sport → server moderates + (if enabled) generates
-- the answer + options + source via Claude → admin reviews, assigns difficulty,
-- and approves into the live `questions` bank (or rejects).
--
-- Users may only READ THEIR OWN proposals (to see status). All writes go through
-- the propose-question Edge Function / admin (service role) — never the client.
-- ===========================================================================
create table if not exists public.question_proposals (
  id            uuid primary key default gen_random_uuid(),
  submitted_by  uuid not null references public.profiles(id) on delete cascade,
  prompt        text not null,
  sport         text not null,
  status        text not null default 'pending'
                check (status in ('pending','generated','approved','rejected','failed')),
  type          text not null default 'multiple_choice',

  -- AI-generated (filled by the generate step; null until then):
  generated_options       jsonb,
  generated_correct_index integer,
  source_url              text,
  confidence              text,   -- model's confidence / verification note
  gen_error               text,   -- populated when status = 'failed'

  -- Admin review:
  difficulty           integer check (difficulty between 1 and 5),
  reviewed_by          uuid references public.profiles(id),
  reviewed_at          timestamptz,
  approved_question_id text references public.questions(id),
  rejection_reason     text,

  created_at timestamptz not null default now()
);

create index if not exists question_proposals_status_idx on public.question_proposals(status);
create index if not exists question_proposals_submitter_idx on public.question_proposals(submitted_by);

alter table public.question_proposals enable row level security;

-- Anonymous role gets nothing.
revoke all on public.question_proposals from anon;

-- Signed-in users may read ONLY their own proposals (to see status). No client
-- INSERT/UPDATE/DELETE policy → those are denied by RLS; the service role
-- (Edge Function / admin) bypasses RLS to write.
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public'
                 and tablename='question_proposals'
                 and policyname='users read their own proposals') then
    create policy "users read their own proposals"
      on public.question_proposals for select to authenticated
      using (auth.uid() = submitted_by);
  end if;
end $$;
