-- ===========================================================================
-- Automated daily-set publishing.
--   publish_daily_set(target) — publish 5 verified questions for one date,
--     avoiding any question used within 60 days (either side). Never publishes a
--     short day; falls back to least-recently-used if the fresh pool runs thin.
--   bank_daily_sets() — ensure today..today+7 (UTC) are all published. Idempotent
--     and self-healing: a missed cron run is backfilled by the next one.
-- A pg_cron job runs bank_daily_sets() daily, keeping a rolling 7-day buffer.
-- ===========================================================================

create or replace function public.publish_daily_set(target date)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  ids text[];
begin
  if exists (select 1 from public.daily_sets where play_date = target) then
    return 0;  -- already published for this date
  end if;

  -- 5 verified questions not used within 60 days (either side) of target.
  select array_agg(id) into ids from (
    select q.id
    from public.questions q
    where q.verified
      and not exists (
        select 1 from public.daily_sets d
        where d.play_date between target - 60 and target + 60
          and q.id = any (d.question_ids)
      )
    order by random()
    limit 5
  ) s;

  -- Fallback: pool of fresh questions too small → least-recently-used verified.
  if ids is null or array_length(ids, 1) < 5 then
    select array_agg(id) into ids from (
      select q.id
      from public.questions q
      left join lateral (
        select max(d.play_date) as last_used
        from public.daily_sets d
        where q.id = any (d.question_ids)
      ) lu on true
      where q.verified
      order by lu.last_used asc nulls first, random()
      limit 5
    ) s;
  end if;

  if ids is null or array_length(ids, 1) < 5 then
    return 0;  -- never publish a short day
  end if;

  insert into public.daily_sets (play_date, question_ids)
  values (target, ids)
  on conflict (play_date) do nothing;

  return 5;
end;
$$;

create or replace function public.bank_daily_sets()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  base date := (now() at time zone 'utc')::date;
  i    integer;
begin
  for i in 0..7 loop
    perform public.publish_daily_set(base + i);
  end loop;
end;
$$;

-- Schedule: daily at 00:07 UTC, keep today..+7 filled. Idempotent re-schedule.
create extension if not exists pg_cron;

do $$ begin
  if exists (select 1 from cron.job where jobname = 'bank-daily-sets') then
    perform cron.unschedule('bank-daily-sets');
  end if;
  perform cron.schedule('bank-daily-sets', '7 0 * * *', 'select public.bank_daily_sets();');
end $$;
