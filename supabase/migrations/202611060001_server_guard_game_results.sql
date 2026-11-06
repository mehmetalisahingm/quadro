-- Guard cloud game history against direct client overwrites.
-- Authenticated users retain SELECT on their own rows; all writes must pass
-- the verified Next.js /api/game-results endpoint using a server-only key.
begin;
revoke insert, update, delete on table public.game_results from authenticated;
drop policy if exists game_results_insert_own on public.game_results;
drop policy if exists game_results_update_own on public.game_results;
drop policy if exists game_results_delete_own on public.game_results;
alter table public.game_results
  add constraint game_results_valid_terminal_shape
  check (
    (result = 'won' and mistakes_used between 0 and 3 and attempt_count = 4 + mistakes_used)
    or
    (result = 'lost' and mistakes_used = 4 and attempt_count between 4 and 7)
  );
commit;
