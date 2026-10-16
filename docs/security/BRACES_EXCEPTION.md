# Temporary dependency-security exception: `braces@3.0.3`

- Advisory: GHSA-vfj7-8cjw-p6xm (CVE-2026-93687), **high**.
- Origin: `eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces`.
- As of October 12, 2026, upstream has **no patched `braces` release**. `npm audit fix --force` would propose a Next ESLint downgrade incompatible with our current Next 16 setup.
- Scope: development-only ESLint tooling. The production npm dependency audit is separately required to have **zero** moderate-or-worse findings.
- The five package identities in the transitive chain are explicitly validated against the lockfile. Only the exact root advisory is allowlisted, not other GHSA IDs or other package names. New advisories fail the CI gate.
- Exception expires at the start of **2026-11-12 (UTC)**, including for CI. The check will fail then if the finding is not fixed.
- Owner action: review/accept the residual *development-tool* risk before merging this PR; keep user-controlled/untrusted glob patterns out of ESLint runs.
- Follow-up: remove this exception when upstream patches `braces`, or replace the ESLint dependency chain with a compatible version that no longer imports it. Refresh the lockfile and rerun audits and browser regressions.

## Implementation

The CI uses `npm run audit:ci`, which runs unit tests of the exception and then performs **two live npm audits**:

1. `npm audit --omit=dev --json --audit-level=moderate`: any production finding fails.
2. `npm audit --json --audit-level=moderate`: any unexpected advisory/chain, expired exception or non-dev-only copy fails.

Do not label the result '0 vulnerabilities' while this exception exists. `sharp@0.35.5` and `source-map-js@1.2.2` are patched rather than allowlisted.
