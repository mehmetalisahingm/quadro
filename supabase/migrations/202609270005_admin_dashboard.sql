begin;

create or replace function public.admin_dashboard_snapshot(p_limit integer default 50)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  safe_limit integer := least(greatest(coalesce(p_limit, 50), 1), 100);
  result jsonb;
begin
  select jsonb_build_object(
    'totals', jsonb_build_object(
      'visitors', (select count(*) from public.visitors),
      'todayVisitors', (
        select count(distinct visitor_id)
        from public.analytics_events
        where occurred_at >= (date_trunc('day', now() at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul')
      ),
      'authenticatedUsers', (select count(*) from auth.users),
      'gameStarts', (select count(*) from public.analytics_events where event_name = 'game_start'),
      'gameFinishes', (select count(*) from public.analytics_events where event_name = 'game_finish'),
      'shares', (select count(*) from public.analytics_events where event_name = 'share_attempt'),
      'wins', (select count(*) from public.game_results where result = 'won'),
      'losses', (select count(*) from public.game_results where result = 'lost')
    ),
    'puzzles', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'puzzleId', puzzle_id,
          'starts', starts,
          'finishes', finishes,
          'anonymousOrUnlinkedFinishes', greatest(finishes - recorded_results, 0),
          'wins', wins,
          'losses', losses
        )
        order by puzzle_id
      )
      from (
        select
          ids.puzzle_id,
          coalesce((select count(*) from public.analytics_events e where e.puzzle_id = ids.puzzle_id and e.event_name = 'game_start'), 0) as starts,
          coalesce((select count(*) from public.analytics_events e where e.puzzle_id = ids.puzzle_id and e.event_name = 'game_finish'), 0) as finishes,
          coalesce((select count(*) from public.game_results r where r.puzzle_id = ids.puzzle_id), 0) as recorded_results,
          coalesce((select count(*) from public.game_results r where r.puzzle_id = ids.puzzle_id and r.result = 'won'), 0) as wins,
          coalesce((select count(*) from public.game_results r where r.puzzle_id = ids.puzzle_id and r.result = 'lost'), 0) as losses
        from (
          select distinct puzzle_id
          from (
            select puzzle_id from public.analytics_events where puzzle_id is not null
            union
            select puzzle_id from public.game_results
          ) puzzle_ids
        ) ids
      ) puzzle_counts
    ), '[]'::jsonb),
    'recentResults', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'userId', recent.user_id,
          'email', recent.email,
          'displayName', recent.display_name,
          'puzzleId', recent.puzzle_id,
          'revision', recent.puzzle_revision,
          'result', recent.result,
          'attemptCount', recent.attempt_count,
          'mistakesUsed', recent.mistakes_used,
          'activeSeconds', recent.active_seconds,
          'playedAt', recent.played_at
        )
        order by recent.played_at desc
      )
      from (
        select
          gr.user_id,
          u.email,
          p.display_name,
          gr.puzzle_id,
          gr.puzzle_revision,
          gr.result,
          gr.attempt_count,
          gr.mistakes_used,
          gr.active_seconds,
          gr.played_at
        from public.game_results gr
        join auth.users u on u.id = gr.user_id
        left join public.profiles p on p.user_id = gr.user_id
        order by gr.played_at desc
        limit safe_limit
      ) recent
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_dashboard_snapshot(integer) from public, anon, authenticated;
grant execute on function public.admin_dashboard_snapshot(integer) to service_role;

commit;
