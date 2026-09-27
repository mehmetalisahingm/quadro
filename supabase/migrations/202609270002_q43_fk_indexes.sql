create index if not exists visitors_linked_user_id_idx
  on public.visitors (linked_user_id)
  where linked_user_id is not null;

create index if not exists game_results_visitor_id_idx
  on public.game_results (visitor_id)
  where visitor_id is not null;
