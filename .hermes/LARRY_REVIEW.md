# Larry Independent Review — Mission Control GC-1

**Reviewed:** 2026-07-09 15:50:21 CDT  
**Branch:** `security/mission-control-truth-spine-v1`  
**Base:** `0eede9a69604246eb19ff6b95e9c172f6533236f`  
**Grok handoff HEAD:** `a80da7a7d2095d373620a69d07ded89c706360e9`  
**Final reviewed commit:** local branch `HEAD` after the review patch commit  
**Verdict:** `PATCHED_PASS_FOR_MERGE_REVIEW`  
**Deployment verdict:** `HUMAN_GATE_REQUIRED`

## Plain-English verdict

Grok's original completion claim was not sufficient to merge as-is. Its tests and build passed, but the implementation still contained the old fallback credential in two API routes and a script, treated every method on agent paths as Bearer-only (breaking human reads), left health probes pointed at a now-protected endpoint, and did not enforce future timestamps at every heartbeat write boundary.

Codex added regression tests and surgically patched those defects. Larry then found one additional stale fallback reference in `.env.example`, captured a failing regression test, removed the stale guidance, reran all verification, and exercised the running application over HTTP.

The reviewed code is suitable for a local merge decision. It has not been pushed, merged, configured, or deployed.

## Material fixes after Grok handoff

- Made agent authentication method-specific: only explicit agent `POST` push routes accept Bearer credentials.
- Kept pages and read APIs under human Basic authentication.
- Removed hard-coded/default agent credentials from API code, scripts, tests, and `.env.example`.
- Made all agent push scripts refuse to run without `MC_AUTH_TOKEN`.
- Added direct API route security tests.
- Rejected invalid/far-future heartbeat timestamps at route and storage boundaries.
- Corrected TTL expiry to use the clamped timestamp.
- Added narrow public `/api/health`; protected the richer `/health` page and `/api/status` data.
- Updated internal Mission Control probes to use `/api/health`.
- Added Basic challenge headers to human route-level 401 responses.
- Documented `MC_UI_USERNAME`, `MC_UI_PASSWORD`, `MC_AUTH_TOKEN`, and the intended `/data` SQLite path.

## TDD evidence

### Codex RED

- Five targeted files failed: 13 failed, 26 passed.
- Timestamp regression failed separately: 1 failed, 6 passed.
- Script fail-closed regression failed separately: 1 failed, 15 passed.

Details are preserved in `.hermes/CODEX_REVIEW.md`.

### Larry RED

```text
npm run test -- src/lib/truth/__tests__/access-control.test.ts

Result: exit 1
1 failed, 15 passed
Failure: .env.example still advertised the old fallback credential.
```

### Final GREEN

```text
npm run test
17 test files passed
111 tests passed
exit 0

npm run build
Next.js 14.2.35 compiled successfully
Type check passed
17 static pages generated
Middleware built
exit 0

git diff --check
exit 0

bash -n scripts/barry-feed-mc.sh scripts/push-heartbeat.sh \
  scripts/push-live-status.sh scripts/run-nightly-sweep.sh
exit 0
```

## Runtime HTTP security matrix

A local Next.js server was started with isolated test-only credentials and a temporary SQLite file. The following live requests passed:

| Probe | Expected | Actual |
|---|---:|---:|
| Public `/api/health` without credentials | 200 | 200 |
| Root without credentials | 401 + Basic challenge | 401 + challenge |
| Root with human Basic credentials | 200 | 200 |
| `/api/tasks` without credentials | 401 + Basic challenge | 401 + challenge |
| `/api/tasks` with human Basic credentials | 200 | 200 |
| `/api/tasks` with agent Bearer | 401 | 401 |
| `/api/activities` GET with human Basic | 200 | 200 |
| `/api/activities` GET with agent Bearer | 401 + Basic challenge | 401 + challenge |
| `/api/activities` POST with human Basic | 401 | 401 |
| `/api/status` without credentials | 401 + Basic challenge | 401 + challenge |
| Heartbeat with query-string token only | 401 | 401 |
| Heartbeat with legacy fallback credential | 401 | 401 |
| Heartbeat with valid Bearer but far-future timestamp | 400 | 400 |
| Memory push with legacy fallback credential | 401 | 401 |

The temporary server was stopped and the temporary database files were removed.

## Source and credential scan

- Exact old fallback literal in `.env.example`, `src`, `scripts`, and `protocols`: zero matches.
- Query-token handling remains only in a negative regression test; application code does not read query-string credentials.
- No production credentials were printed, committed, or used.

## Dependency audit

`npm audit --omit=dev --json` completed and reported:

- 2 production vulnerabilities: 1 high, 1 moderate.
- Direct affected production package: Next.js 14.2.35.
- Available audit fix is a semver-major upgrade.

Full `npm audit --json` reported:

- 17 total vulnerabilities: 1 critical, 10 high, 6 moderate.
- Direct development risk includes Vitest 2.1.9.

These are inherited baseline dependency risks and remain assigned to GC-2. They do not negate the GC-1 auth improvement, but they are material deployment risk.

## Persistence and migration verdict

- GC-1 does not change the SQLite schema, so it introduces no new schema migration risk.
- SQLite stores honor `MC_DB_PATH`; `.env.example` now documents `/data/mission-control.db` for a Railway volume.
- Production durability is **not proven** until Justin authorizes and verifies the volume, variable, backup, deploy, and restart test.
- Legacy `/api/memory` and `/api/project-update` still use files under `/tmp`; those legacy payloads remain ephemeral unless separately migrated or explicitly accepted as non-canonical. This must be resolved or accepted during the deployment gate.

## Residual risks / gates

1. **No production deployment yet.** Current production behavior is unchanged.
2. **No secret configuration or rotation yet.** `MC_UI_USERNAME`, `MC_UI_PASSWORD`, and `MC_AUTH_TOKEN` must be set under Justin's gate.
3. **No volume proof yet.** `MC_DB_PATH=/data/mission-control.db` and restart persistence must be verified.
4. **Legacy `/tmp` files remain.** Memory and project-update file persistence is not solved by `MC_DB_PATH` alone.
5. **Dependency vulnerabilities remain.** GC-2 should follow immediately; whether it precedes production rollout is a Justin risk decision.
6. **Basic Auth has no rate limiter.** Use a strong unique password over HTTPS; stronger identity-aware access can be a later hardening layer.
7. **Codex CLI cleanup:** Codex produced the review artifact and complete patch set but did not exit cleanly after finishing; Larry terminated the idle local process. This did not affect source verification.

## Recommendation

- **Code/merge:** eligible for a human merge decision after reviewing this local commit.
- **Push:** not performed; requires Justin's instruction.
- **Deploy:** do not deploy automatically. Complete Deployment Gate 1, explicitly decide how to handle legacy `/tmp` state, and acknowledge the Next.js audit risk.
