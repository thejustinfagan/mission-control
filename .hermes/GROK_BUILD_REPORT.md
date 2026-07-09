# Grok Build Report — GC-1: Mission Control security lockdown

**Workorder:** W0 + GC-1  
**Executor:** Grok Build (grok-build-0.1 via xAI OAuth)  
**Date:** 2026-07-09  
**Repo/Worktree:** /Users/justinfagan/dev/mission-control-worktrees/truth-spine-v1  
**Branch:** security/mission-control-truth-spine-v1  

## Base / Head SHAs
- base_sha: 0eede9a69604246eb19ff6b95e9c172f6533236f (audited origin/main)
- head_sha: (to be set after commit)

## W0 Verification
- Isolated worktree created from origin/main
- npm ci: success (17 vulnerabilities noted for GC-2)
- npm test: 81 passed (baseline)
- npm build: success
- Worktree clean at creation
- Original dirty checkout untouched

## GC-1 Implementation

### Changes Made (targeted, security-only)
- Created src/middleware.ts (Basic Auth for human/UI, static bypass for _next/favicon/health)
- Created src/lib/truth/access-control.ts (strict agent Bearer, human Basic, route allowlist)
- Created src/lib/truth/timestamp-guard.ts
- Created targeted security tests (RED observed, then GREEN)
- Updated auth.ts (removed fallback + query support)
- Updated ttl.ts (future timestamps rejected / clamped)
- Updated heartbeat-store.ts (timestamp validation on record)
- Protected mutation routes:
  - /api/tasks (POST/PATCH) — now requires human Basic
  - /api/mission-control/actions (POST) — now requires human Basic
  - /api/agents/heartbeat (POST agent Bearer, GET human)
  - Other agent routes updated for strict verify where touched

### RED Tests Observed (before code changes)
- access-control.test.ts: module not found, tests could not load
- timestamp-guard.test.ts: module not found
- Captured before any production changes

### GREEN Results
- Targeted security tests: 17 passed
- Full suite: 98 passed (17 new security tests)
- npm build: success
- No literal fallback "barry-update-2026" in auth code

### Route / Auth Matrix (inspected all api routes)
- POST /api/tasks : Human Basic (protected)
- PATCH /api/tasks : Human Basic (protected)
- POST /api/mission-control/actions : Human Basic (protected)
- POST /api/agents/heartbeat : Strict Bearer only (allowlisted)
- GET /api/agents/heartbeat : Human Basic
- POST /api/activities : Strict Bearer (updated)
- POST /api/agents/feed, /registry : Strict Bearer
- POST /api/memory, /project-update, /status, /mission-control/sweep : Strict Bearer
- GET pages / APIs (non-static): Human Basic via middleware
- Public bypass: /_next/*, /favicon.ico, /health

All mutation routes now require authentication. Middleware + per-route verification.

### Test commands executed
- npm run test -- src/lib/truth/__tests__/access-control.test.ts
- npm run test -- src/lib/truth/__tests__/timestamp-guard.test.ts
- npm run test (full)
- npm run build

### Known limitations (per plan)
- Dependency audit (17 vulns) recorded for GC-2, not addressed in GC-1
- No Railway / deploy changes
- No original dirty checkout modified
- Human creds must be set in env for production (fail closed)

### ready_for_codex_review
true

### Commit message used
security: fail closed and protect Mission Control mutations

## Blockers
None for GC-1 scope.

## Next (per plan)
Stop before DEPLOYMENT GATE 1.
Justin approval required for production env, Railway volume, deploy.
