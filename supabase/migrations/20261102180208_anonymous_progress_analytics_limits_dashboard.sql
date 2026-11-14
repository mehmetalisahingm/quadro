begin;
-- Keep all existing records; only extend the event type and add bounded collection.
alter table public.analytics_events drop constraint if exists analytics_events_event_name_check;
alter table public.analytics_events
  add constraint analytics_events_event_name_check
  check (event_name in ('home_view','game_start','game_progress','first_attempt','game_finish','share_attempt','retention_visit'));

create or replace function public.record_analytics_event(
  p_client_event_id text,
  p_visitor_id uuid,
  p_event_name text,
  p_puzzle_id text default null,
  p_properties jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_event_id uuid;
  v_now timestamptz := now();
  v_today timestamptz := date_trunc('day', now() at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul';
begin
  if p_client_event_id is null or char_length(p_client_event_id) not between 1 and 128 then
    raise exception 'invalid analytics event id';
  end if;
  if p_event_name not in ('home_view','game_start','game_progress','first_attempt','game_finish','share_attempt','retention_visit') then
    raise exception 'unsupported analytics event';
  end if;
  if p_puzzle_id is not null and char_length(p_puzzle_id) > 64 then
    raise exception 'invalid puzzle id';
  end if;
  if pg_column_size(coalesce(p_properties, '{}'::jsonb)) > 4096 then
    raise exception 'analytics properties too large';
  end if;

  -- Global advisory lock ensures simultaneous requests do not bypass the free-tier event cap.
  perform pg_catalog.pg_advisory_xact_lock(41027, 1);

  select e.id into v_event_id
  from public.analytics_events e
  where e.visitor_id = p_visitor_id and e.client_event_id = p_client_event_id;
  if v_event_id is not null then
    return v_event_id;
  end if;

  -- Deliberate fail-closed limits: stop collecting data, never affect the game itself.
  if (select count(*) from public.analytics_events e where e.occurred_at >= v_today) >= 800
     or (select count(*) from public.analytics_events e where e.visitor_id=p_visitor_id and e.occurred_at >= v_today) >= 80 then
    return null;
  end if;

  -- Avoid repeated page hit storms from the same browser, even if local dedupe is lost.
  if p_event_name='home_view' and exists (
    select 1 from public.analytics_events e
    where e.visitor_id=p_visitor_id and e.event_name='home_view'
      and e.occurred_at >= v_now - interval '30 minutes'
  ) then
    return null;
  end if;

  insert into public.visitors as visitor (visitor_id, first_seen_at, last_seen_at)
    values (p_visitor_id, v_now, v_now)
    on conflict (visitor_id)
    do update set last_seen_at = greatest(visitor.last_seen_at, excluded.last_seen_at);

  insert into public.analytics_events (client_event_id, visitor_id, event_name, puzzle_id, properties)
    values (p_client_event_id, p_visitor_id, p_event_name, p_puzzle_id, coalesce(p_properties,'{}'::jsonb))
    on conflict (visitor_id, client_event_id) do nothing
    returning id into v_event_id;
  return v_event_id;
end;
$$;

revoke all on function public.record_analytics_event(text,uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.record_analytics_event(text,uuid,text,text,jsonb) to service_role;

create or replace function public.admin_analytics_overview(p_limit integer default 50)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
with recent as (
  select distinct on (e.visitor_id,e.puzzle_id)
    e.visitor_id, e.puzzle_id, e.event_name, e.properties, e.occurred_at
  from public.analytics_events e
  where e.puzzle_id is not null
    and e.event_name in ('game_start','first_attempt','game_progress','game_finish')
    and e.occurred_at >= now() - interval '30 days'
  order by e.visitor_id, e.puzzle_id, e.occurred_at desc
),
recent_ordered as (
  select
    substring(r.visitor_id::text from 1 for 8) as browser,
    r.puzzle_id,
    case when r.event_name='game_finish' then
      case when r.properties->>'status'='won' then 'Kazandı' else 'Kaybetti' end
    when r.event_name='game_start' then 'Başladı'
    when r.event_name='game_progress' then 'Devam ediyor'
    else 'İlk deneme' end as stage,
    case when r.event_name='game_finish' and r.properties->>'status'='won' then 4
      else coalesce(
        (r.properties->>'solvedGroups')::int,
        (select (p.properties->>'solvedGroups')::int from public.analytics_events p
          where p.visitor_id=r.visitor_id and p.puzzle_id=r.puzzle_id and p.event_name='game_progress'
          order by p.occurred_at desc limit 1),
        0
      )
    end as solved_groups,
    coalesce((r.properties->>'attemptCount')::int, case when r.event_name='first_attempt' then 1 else 0 end) as attempt_count,
    r.occurred_at as last_seen_at
  from recent r order by r.occurred_at desc limit least(greatest(coalesce(p_limit,50),1),100)
)
select jsonb_build_object(
  'uniquePlayers',(select count(distinct visitor_id) from public.analytics_events where event_name='game_start'),
  'last7DayVisitors',(select count(distinct visitor_id) from public.analytics_events where occurred_at >= now()-interval '7 days'),
  'eventsToday',(select count(*) from public.analytics_events where occurred_at >= (date_trunc('day',now() at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul')),
  'daily',coalesce((
    select jsonb_agg(jsonb_build_object(
      'day', d.day, 'visitors',d.visitors,'starts',d.starts,'finishes',d.finishes
    ) order by d.day desc)
    from (
      select (e.occurred_at at time zone 'Europe/Istanbul')::date::text as day,
        count(distinct e.visitor_id) as visitors,
        count(*) filter (where e.event_name='game_start') as starts,
        count(*) filter (where e.event_name='game_finish') as finishes
      from public.analytics_events e where e.occurred_at>=now()-interval '14 days'
      group by 1
    ) d
  ),'[]'::jsonb),
  'recentBrowsers',coalesce((
    select jsonb_agg(jsonb_build_object(
      'browser',r.browser,'puzzleId',r.puzzle_id,'stage',r.stage,
      'solvedGroups',r.solved_groups,'attemptCount',r.attempt_count,'lastSeenAt',r.last_seen_at
    ) order by r.last_seen_at desc) from recent_ordered r
  ),'[]'::jsonb)
);
$$;
revoke all on function public.admin_analytics_overview(integer) from public,anon,authenticated;
grant execute on function public.admin_analytics_overview(integer) to service_role;
commit;
