# Supabase backend

Source of record for the Ball Knowledge backend (project ref `zxfiteqxdnbwftqlduhv`).

The base schema (`profiles`, `questions`, `daily_sets`, `submissions`, the
`leaderboard` view, and the `handle_new_user` signup trigger) was created
directly in the dashboard before migration tracking, so it is **not** reproduced
here. What lives in this folder is everything added/changed afterward.

## migrations/
Applied in order (timestamped filenames match the deployed migration history):

- `20260628033428_create_answer_events.sql` — per-answer analytics table.
  One row per question answered, with a snapshot of the question's
  sport/difficulty/type at answer time so re-tuning a question never rewrites
  old history. RLS is **on with no policies** (server-only via the service
  role); grants are revoked from `anon`/`authenticated`.
- `20260628033448_create_question_stats_view.sql` — internal aggregate view
  (`times_shown`, `times_correct`, `accuracy`, `avg_time_ms` per question).
  `security_invoker = on` and grants revoked, so clients can't read it; query
  it from the dashboard / service role.

## functions/
Edge Functions (deploy with "Verify JWT" ON):

- `get-today` — returns today's quiz with every answer field stripped out.
- `submit` — grades answers server-side, writes the score to `submissions`,
  then captures one `answer_events` row per question (accepts an optional
  `timeMs` per answer). Scoring is flat: 10 points per correct answer.

### Answer payload contract (`submit`)
```jsonc
{
  "answers": [
    { "questionId": "q0001", "value": { "selectedIndex": 2 }, "timeMs": 4200 }
  ],
  "started_at": "2026-06-28T02:37:12.919Z"
}
```
`value` by question type: multiple_choice `{ selectedIndex }`, fill_in_blank
`{ text }`, matching `{ mapping }`. `timeMs` is optional.

Secrets (`SUPABASE_SERVICE_ROLE_KEY`, etc.) are injected by Supabase at runtime
and are never stored in this repo.
