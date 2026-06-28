# Ball Knowledge — Project Memory

Daily sports trivia game ("BeReal for sports knowledge"). One shared daily question
set for everyone, server-authoritative, building toward iOS/Android. Web app today
(Vite + React + TypeScript) on a Supabase backend.

## Stack
- Frontend: Vite + React 18 + TypeScript (strict), Zustand, plain CSS tokens.
  Later: React Native + Expo for native.
- Backend: Supabase — Postgres + Auth + RLS + Edge Functions (Deno/TypeScript).
- Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (anon key is public by design;
  security is RLS, not key secrecy).

## Commands
- `npm run dev` — local dev server
- `npm run build` — typecheck + production build. **This is the verification gate:
  run it after any change; it must pass clean before committing.**
- `npm run preview` — serve the built app
- No separate lint/test scripts yet; `npm run build` runs strict `tsc`.

## Critical invariants — YOU MUST NOT violate these without explicit approval
- **Correct answers NEVER reach the client.** The `questions` table is RLS-locked;
  only Edge Functions (service role) read it. `get-today` strips all answer fields;
  `submit` grades server-side and reveals answers only AFTER submission.
- **Grading and scoring are server-side only.** Clients can't write `submissions`
  (no insert policy); the `submit` function writes them. This stops fake scores.
- **Server time is the clock** (UTC date). Never trust the device clock for day or
  drop-window logic.
- **No bots in production.** Bots are a local design aid only — never seed them into
  Supabase or show simulated players to real users. New users may open to an empty
  board; design good empty states instead of faking it.
- **Question data shapes:** `sport` is free-text (Basketball, Football, Fighting,
  Golf, Hockey, Baseball, Soccer); `difficulty` is an integer 1–5. Do NOT assume the
  old NBA/NFL enum or easy/medium/hard buckets.
- **Every answer is logged** to `answer_events` (one row per question) for difficulty/
  points tuning. Keep that intact.

## Where things live (read on demand — don't auto-load these)
- Roadmap + plan: `docs/ball-knowledge-production-plan.md`
- Progress tracker — current status + next step (UPDATE as steps finish):
  `docs/progress-tracker.md`
- Edge functions in git (deployed copies live in Supabase): `supabase/functions/get-today/index.ts`,
  `supabase/functions/submit/index.ts`
- DB migrations (authoritative schema history): `supabase/migrations/*.sql`
  (`base_schema`, `create_answer_events`, `create_question_stats_view`,
  `daily_set_publishing`, `quiz_starts`). `docs/supabase-schema.sql` is a STALE base
  snapshot — prefer the migrations and the live DB.

## Supabase access (via MCP)
- The Supabase MCP is connected. Inspect the LIVE schema, RLS policies, and functions
  through it — that is the source of truth over any local SQL file.
- Treat it as READ-ONLY. Do NOT run destructive or schema-changing operations against
  production (drop/alter tables, delete rows, edit RLS) without approval. Prefer a dev
  branch for any write or DDL.

## How to work here
- Non-trivial change → use **plan mode**, show the plan, wait for approval. A
  one-sentence diff → just do it.
- **Stop and ask** before touching: auth, RLS, the questions/answer path, the grading
  function, or any write/DDL on the live DB. These are security-critical.
- After a task: run `npm run build`, show the output as evidence, commit one small
  focused change, and update `docs/progress-tracker.md`.
- Styling/UX work must NOT change game logic, scoring, or the data contracts above.
- Stay scoped to the task; don't refactor unrelated code or add unasked-for abstraction.
- TypeScript strict — no `any`; follow the existing repo/store/domain split.
