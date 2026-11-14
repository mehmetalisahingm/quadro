begin;
-- The production database already had zero unused claim codes on 2026-11-14.
-- Disable this legacy public RPC on every new environment, rather than relying
-- on a one-off SQL editor change.
revoke all on function public.claim_admin(text) from public, anon, authenticated;
comment on function public.claim_admin(text) is 'Legacy admin claim RPC disabled for public clients; provision admins through audited database administration only.';
commit;
