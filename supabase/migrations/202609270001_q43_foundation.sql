begin;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.visitors (
  visitor_id uuid primary key,
  linked_user_id uuid references auth.users(id) on delete set null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null references public.visitors(visitor_id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null check (
    event_name in (
      'home_view',
      'game_start',
      'first_attempt',
      'game_finish',
      'share_attempt',
      'retention_visit'
    )
  ),
  puzzle_id text,
  occurred_at timestamptz not null default now(),
  properties jsonb not null default '{}'::jsonb
);

create table public.game_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  visitor_id uuid references public.visitors(visitor_id) on delete set null,
  puzzle_id text not null,
  puzzle_revision integer not null check (puzzle_revision > 0),
  result text not null check (result in ('won', 'lost')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  mistakes_used integer not null default 0 check (mistakes_used >= 0),
  active_seconds integer not null default 0 check (active_seconds >= 0),
  played_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, puzzle_id, puzzle_revision)
);

create index analytics_events_occurred_at_idx
  on public.analytics_events (occurred_at desc);
create index analytics_events_name_occurred_at_idx
  on public.analytics_events (event_name, occurred_at desc);
create index analytics_events_visitor_idx
  on public.analytics_events (visitor_id, occurred_at desc);
create index analytics_events_user_idx
  on public.analytics_events (user_id, occurred_at desc)
  where user_id is not null;
create index game_results_user_played_at_idx
  on public.game_results (user_id, played_at desc);

alter table public.profiles enable row level security;
alter table public.visitors enable row level security;
alter table public.analytics_events enable row level security;
alter table public.game_results enable row level security;

revoke all on public.visitors from anon, authenticated;
revoke all on public.analytics_events from anon, authenticated;

revoke all on public.profiles from anon;
grant select, update on public.profiles to authenticated;

revoke all on public.game_results from anon;
grant select, insert, update, delete on public.game_results to authenticated;

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "game_results_select_own"
  on public.game_results
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "game_results_insert_own"
  on public.game_results
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "game_results_update_own"
  on public.game_results
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "game_results_delete_own"
  on public.game_results
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger game_results_set_updated_at
before update on public.game_results
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), '')
    )
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

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

  insert into public.visitors (visitor_id, first_seen_at, last_seen_at)
  values (p_visitor_id, p_occurred_at, p_occurred_at)
  on conflict (visitor_id)
  do update set last_seen_at = greatest(public.visitors.last_seen_at, excluded.last_seen_at);

  insert into public.analytics_events (
    visitor_id,
    event_name,
    puzzle_id,
    occurred_at,
    properties
  )
  values (
    p_visitor_id,
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
