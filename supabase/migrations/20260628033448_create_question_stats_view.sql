-- Internal analytics view: per-question aggregates over answer_events, joined to
-- the current questions row for sport/difficulty/type. Not exposed to clients.
create view public.question_stats
with (security_invoker = on) as
select
  q.id            as question_id,
  q.sport,
  q.difficulty,
  q.type,
  count(ae.id)                                          as times_shown,
  count(ae.id) filter (where ae.was_correct)           as times_correct,
  round(
    count(ae.id) filter (where ae.was_correct)::numeric
      / nullif(count(ae.id), 0),
    4
  )                                                     as accuracy,
  round(avg(ae.time_ms), 0)                             as avg_time_ms
from public.questions q
left join public.answer_events ae on ae.question_id = q.id
group by q.id, q.sport, q.difficulty, q.type;

-- Keep it internal: API roles cannot select it.
revoke all on public.question_stats from anon, authenticated;
