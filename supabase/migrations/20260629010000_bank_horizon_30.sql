-- ===========================================================================
-- Extend the publishing buffer from 7 to 30 days so the bank always holds a
-- month ahead (Phase 2 gate: "≥30 days of sets banked"). With 341 verified
-- questions and the 60-day no-repeat rule, 31 days = 155 slots is comfortable.
-- bank_daily_sets stays idempotent and self-healing.
-- ===========================================================================
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
  for i in 0..30 loop
    perform public.publish_daily_set(base + i);
  end loop;
end;
$$;
