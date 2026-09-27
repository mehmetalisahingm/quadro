begin;

create table if not exists private.admin_claims (
  code_hash text primary key,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

revoke all on private.admin_claims from public, anon, authenticated;

create or replace function public.claim_admin(p_code text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code_hash text;
begin
  if (select auth.uid()) is null or p_code is null or char_length(p_code) > 128 then
    return false;
  end if;

  v_code_hash := encode(extensions.digest(p_code, 'sha256'), 'hex');

  update private.admin_claims
     set used_at = now()
   where code_hash = v_code_hash
     and used_at is null;

  if not found then
    return false;
  end if;

  insert into private.admin_users (user_id)
  values ((select auth.uid()))
  on conflict (user_id) do nothing;

  return true;
end;
$$;

revoke all on function public.claim_admin(text) from public, anon;
grant execute on function public.claim_admin(text) to authenticated;

commit;
