begin;

alter table public.game_results
  add column day_key date,
  add column streak_eligible boolean not null default false;

update public.game_results
set day_key = played_at::date
where day_key is null;

alter table public.game_results
  alter column day_key set not null;

alter table public.game_results
  add constraint game_results_user_day_unique unique (user_id, day_key);

create index game_results_user_day_idx
  on public.game_results (user_id, day_key desc);

create or replace function public.record_analytics_event(
  p_visitor_id uuid,
  p_event_name text,
  p_puzzle_id text default null,
  p_properties jsonb default '{}'::jsonb,
  p_occurred_at timestamptz default now()
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id uuid;
  v_user_id uuid;
begin
  if p_event_name not in (
    'home_view',
    'game_start',
    'first_attempt',
    'game_finish',
    'share_attempt',
    'retention_visit'
  ) then
    raise exception 'unsupported analytics event';
  end if;

  insert into public.visitors as visitor (visitor_id, first_seen_at, last_seen_at)
  values (p_visitor_id, p_occurred_at, p_occurred_at)
  on conflict (visitor_id)
  do update set last_seen_at = greatest(visitor.last_seen_at, excluded.last_seen_at);

  select linked_user_id
  into v_user_id
  from public.visitors
  where visitor_id = p_visitor_id;

  insert into public.analytics_events (
    visitor_id,
    user_id,
    event_name,
    puzzle_id,
    occurred_at,
    properties
  )
  values (
    p_visitor_id,
    v_user_id,
    p_event_name,
    p_puzzle_id,
    p_occurred_at,
    coalesce(p_properties, '{}'::jsonb)
  )
  returning id into v_event_id;

  return v_event_id;
end;
$$;

revoke all on function public.record_analytics_event(uuid, text, text, jsonb, timestamptz)
  from public, anon, authenticated;
grant execute on function public.record_analytics_event(uuid, text, text, jsonb, timestamptz)
  to service_role;

commit;
