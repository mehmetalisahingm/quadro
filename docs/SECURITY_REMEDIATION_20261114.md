# Quadro security remediation — 2026-11-14

Utku's review of main e7a84fd identified S-01..S-20.

## Verified production changes
- Supabase project `okifturxrakyxlzuznzb`: unused `private.admin_claims` codes = **0**.
- `public.claim_admin(text)` execution was revoked from `PUBLIC`, `anon`, and `authenticated`. Rechecked: `authenticated` and `anon` can no longer execute it.
- Production `record_analytics_event` includes fail-closed Istanbul-day global 800, per-visitor 80 and 30-minute home-view limits; database migration history already lists `20261102180208_anonymous_progress_analytics_limits_dashboard`.
- Vercel `SUPABASE_SECRET_KEY` has been limited from production+preview to **production only**. Preview API functions requiring the secret will now return not-configured until a dedicated preview Supabase project and key are provisioned.

## Code changes in this PR
- Add missing production analytics migration source under its existing historical timestamp.
- Add a new reproducible admin-claim revoke migration.
- Best-effort per-instance throttles on analytics (visitor ID) and game results (hashed bearer); analytics Origin validation. These are **not** global abuse prevention.
- HSTS without subdomain preload; report-only CSP; hide X-Powered-By.
- Avoid displaying attacker-controlled callback error text.
- CI least-privilege token and no persisted checkout credentials; remove abandoned write-enabled tutorial workflow.
- Prepared /gizlilik content, but do not deploy an incomplete legal notice. S-06 remains a release blocker pending verified owner/contact, rights-request details and legal review.

## Remaining release checks (do not mark closed)
- [ ] S-03/S-05: Vercel Firewall project access failed with 404; reconnect Vercel integration and configure **distributed** rate limits. Check legitimate bursts to avoid blocking gameplay.
- [ ] S-04/S-07: PKCE + server-side httpOnly session migration needs an isolated compatibility-tested auth implementation; current client stores refresh tokens in localStorage and implicit callback still accepts tokens.
- [ ] S-06: publish the /gizlilik disclosure after verified data-controller identity, working contact address, exact processing legal basis, retention, international data transfer determination and rights-request channel are documented and legally reviewed.
- [x] S-10: pinned active workflow GitHub Actions to immutable commit SHAs resolved from the exact upstream tags and documented versions.
- [ ] S-12: verify HSTS at custom domain following release.
- [ ] S-13: add server-only boundaries after auditing imports and tests.
- [ ] S-14/S-15: if competitive rankings or prizes are introduced, move answer verification entirely server-side.
- [ ] S-16: review whether admin users should show full e-mail addresses; mask when not necessary.
- [ ] Supabase auth URL/redirect allowlist, OTP limits, secret rotation, backup/PITR, GitHub branch protection and Actions defaults still require separate panel checks.
- [ ] Run CI, production-preview acceptance, and verify no regressions before merging.
