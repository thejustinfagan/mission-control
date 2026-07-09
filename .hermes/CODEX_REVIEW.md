# Codex Review — GC-1 Mission Control Security Lockdown

**Verdict:** PATCHED_PASS
**Date:** 2026-07-09
**Reviewer:** Codex
**Worktree:** `/Users/justinfagan/dev/mission-control-worktrees/truth-spine-v1`
**Branch:** `security/mission-control-truth-spine-v1`
**Base:** `0eede9a69604246eb19ff6b95e9c172f6533236f`
**Committed HEAD before Codex patches:** `a80da7a7d2095d373620a69d07ded89c706360e9`

## Scope Reviewed

- Plan sections reviewed: W0 and GOLD CHUNK 1 only.
- Read `.hermes/GROK_BUILD_REPORT.md`.
- Inspected `origin/main...HEAD` and current uncommitted worktree diff.
- Reviewed every API mutation route under `src/app/api`.
- Reviewed access-control affected read behavior, health/probe behavior, timestamp handling, scripts, and fallback/query-token exposure.
- Did not deploy, push, commit, alter Railway, cron, Hermes, OpenClaw, Barry, or Harry configuration.

## Findings Patched

1. **Method-specific auth was wrong for agent allowlist paths.**
   - Grok middleware treated any method on `/api/activities`, `/api/status`, `/api/memory`, `/api/agents/heartbeat`, etc. as agent Bearer-only.
   - This broke human Basic read routes and allowed Bearer auth to read allowlisted GET endpoints.
   - Patched `requireAuth` to require Bearer only for POSTs to the explicit agent-push allowlist; all other pages/read APIs require human Basic.

2. **Hard-coded fallback credentials remained in current source/scripts.**
   - `/api/memory` and `/api/project-update` still used `process.env.MC_AUTH_TOKEN || "barry-update-2026"`.
   - `scripts/push-live-status.sh` still defaulted to the old fallback token.
   - Patched routes to use strict shared Bearer auth and patched scripts to require `MC_AUTH_TOKEN`.

3. **Agent push scripts did not fail closed when `MC_AUTH_TOKEN` was absent.**
   - `push-heartbeat.sh`, `barry-feed-mc.sh`, and `run-nightly-sweep.sh` silently omitted the auth header.
   - Patched all agent push scripts to exit before curl when `MC_AUTH_TOKEN` is missing.

4. **Heartbeat timestamps were not enforced at the write boundary.**
   - The route ignored caller-supplied `observedAt`; the store accepted far-future timestamps.
   - Patched `/api/agents/heartbeat` to reject invalid/far-future `observedAt` with 400.
   - Patched `recordHeartbeat` to validate and clamp slightly-future timestamps before writing.

5. **TTL freshness expiry was computed from the future timestamp before clamping.**
   - Slightly future timestamps had `ageSeconds` clamped to zero but still extended `expiresAt`.
   - Patched `computeFreshness` to compute expiry after timestamp clamping.

6. **Health/probe behavior exposed the wrong surface.**
   - `/health` was publicly bypassed even though it is a UI page.
   - Mission Control self-probes targeted protected `/api/status`.
   - Added narrow public `/api/health`, protected `/health`, forwarded Basic auth from the Health page to `/api/status`, and moved HTTP/render probes to `/api/health`.

7. **Human route-level 401s lacked a Basic challenge.**
   - Route-level guards for human routes returned 401 without `WWW-Authenticate`.
   - Added `humanUnauthorizedResponse` and used it for task, Justin action, and heartbeat read guards.

8. **Grok report was stale.**
   - Updated `.hermes/GROK_BUILD_REPORT.md` for current committed head, Codex post-review test counts, audit rerun limitation, and superseded final status.

## Route/Auth Matrix Verified

- Public without credentials:
  - `/_next/*`
  - `/favicon.ico`
  - `/api/health`

- Human Basic via middleware:
  - All pages, including `/health`
  - All read APIs except `/api/health`
  - GET on agent allowlist paths such as `/api/activities` and `/api/agents/heartbeat`

- Human Basic route-level guards:
  - GET/POST/PATCH `/api/tasks`
  - POST `/api/mission-control/actions`
  - GET `/api/agents/heartbeat`

- Strict agent Bearer route-level guards:
  - POST `/api/agents/heartbeat`
  - POST `/api/agents/feed`
  - POST `/api/agents/registry`
  - POST `/api/activities`
  - POST `/api/status`
  - POST `/api/project-update`
  - POST `/api/memory`
  - POST `/api/mission-control/sweep`

## RED Evidence

```text
Command:
npm run test -- src/lib/truth/__tests__/access-control.test.ts src/lib/truth/__tests__/api-route-security.test.ts src/lib/truth/__tests__/heartbeat-store.test.ts src/lib/truth/__tests__/http-connector.test.ts src/lib/truth/__tests__/render-connector.test.ts

Result:
exit 1
5 failed test files
13 failed, 26 passed
Failures covered method-specific auth, public health path, fallback credential scan, route fallback acceptance, invalid heartbeat observedAt acceptance, missing /api/health, and protected probe targets.
```

```text
Command:
npm run test -- src/lib/truth/__tests__/timestamp-guard.test.ts

Result:
exit 1
1 failed, 6 passed
Failure: slightly future timestamp expiry was computed as 2026-07-09T14:05:59.000Z instead of clamped 2026-07-09T14:01:00.000Z.
```

```text
Command:
npm run test -- src/lib/truth/__tests__/access-control.test.ts

Result:
exit 1
1 failed, 15 passed
Failure: agent push scripts did not fail closed before curl when MC_AUTH_TOKEN was missing.
```

## GREEN Evidence

```text
Command:
npm run test -- src/lib/truth/__tests__/access-control.test.ts src/lib/truth/__tests__/api-route-security.test.ts src/lib/truth/__tests__/timestamp-guard.test.ts src/lib/truth/__tests__/heartbeat-store.test.ts src/lib/truth/__tests__/http-connector.test.ts src/lib/truth/__tests__/render-connector.test.ts

Result:
exit 0
6 passed test files
46 passed tests
```

```text
Command:
npm run test

Result:
exit 0
17 passed test files
111 passed tests
```

```text
Command:
npm run build

Result:
exit 0
Next.js 14.2.35 compiled successfully, type-check passed, generated 17 static pages, middleware built.
```

```text
Command:
git diff --check

Result:
exit 0
no whitespace errors
```

```text
Command:
rg -n "barry-update-2026|MC_AUTH_TOKEN:-\$[A-Z_]*TOKEN|searchParams\.get\(\s*['\"]token|[?&]token=" src scripts protocols SPEC.md CODEX-*.md -g '!node_modules' -g '!\\.next' -g '!src/**/*.test.ts'

Result:
exit 1
no matches
```

```text
Command:
npm audit --omit=dev --json

Result:
exit 1
Audit could not reach npm registry from this environment:
getaddrinfo ENOTFOUND registry.npmjs.org
```

## Files Patched by Codex

- `.hermes/GROK_BUILD_REPORT.md`
- `scripts/barry-feed-mc.sh`
- `scripts/push-heartbeat.sh`
- `scripts/push-live-status.sh`
- `scripts/run-nightly-sweep.sh`
- `src/app/api/agents/heartbeat/route.ts`
- `src/app/api/health/route.ts`
- `src/app/api/memory/route.ts`
- `src/app/api/mission-control/actions/route.ts`
- `src/app/api/mission-control/sweep/route.ts`
- `src/app/api/project-update/route.ts`
- `src/app/api/tasks/route.ts`
- `src/app/health/page.tsx`
- `src/lib/truth/__tests__/access-control.test.ts`
- `src/lib/truth/__tests__/api-route-security.test.ts`
- `src/lib/truth/__tests__/heartbeat-store.test.ts`
- `src/lib/truth/__tests__/http-connector.test.ts`
- `src/lib/truth/__tests__/render-connector.test.ts`
- `src/lib/truth/__tests__/timestamp-guard.test.ts`
- `src/lib/truth/access-control.ts`
- `src/lib/truth/auth.ts`
- `src/lib/truth/connectors/http.ts`
- `src/lib/truth/connectors/render.ts`
- `src/lib/truth/heartbeat-store.ts`
- `src/lib/truth/ttl.ts`
- `src/middleware.ts`

## Residual Risks

- Dependency audit status could not be refreshed because the registry was unreachable from this environment. Treat dependency audit as still owned by GC-2.
- No production/Railway verification was performed by design.
- Read API Basic auth is primarily enforced by middleware. Route-level Basic guards were added only where GC-1 already had human mutation/read boundary code or where direct route defects were found.
- Existing static/data fallback concepts unrelated to auth remain in the app and were not changed.

## Recommended Next Action

Larry should independently inspect the uncommitted Codex patch set, rerun verification in an environment with npm registry access if audit evidence is required, then commit the reviewed GC-1 patch set before any deployment gate.
