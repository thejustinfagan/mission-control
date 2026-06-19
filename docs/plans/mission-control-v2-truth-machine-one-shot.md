# Mission Control v2 Truth Machine Implementation Plan

> **For Hermes / Claude / Codex:** This is a one-shot build plan. Do not improvise a prettier dashboard. Build an evidence-backed truth machine. Every visible operational claim must have source, timestamp, freshness/TTL, confidence, and explainable proof. If a claim cannot be verified, render `Unknown`, `Unverified`, or `Stale` — never fake green.

**Goal:** Replace the current stale/static Mission Control dashboard with a mobile-first live ops cockpit that tells Justin what needs him, what is broken, what agents are doing, and why the system believes each claim.

**Architecture:** Add a typed truth domain inside the existing Next.js app: evidence → claims → derived mission-control snapshot. First ship a local deterministic truth engine with typed seed/connectors so the UI becomes correct immediately, then wire real probes incrementally. The UI consumes only `/api/mission-control`, not raw `STATUS.md`-style shapes.

**Tech Stack:** Existing repo `/Users/justinfagan/dev/mission-control`, Next.js 14 App Router, TypeScript strict mode, Tailwind, Node runtime API routes, existing `better-sqlite3` dependency available but do **not** require DB persistence in Slice 1 unless trivial. Prefer pure TypeScript modules + deterministic tests first.

---

## 0. Current Repo Reality

Repo: `/Users/justinfagan/dev/mission-control`

Branch at planning time: `feature/activity-feed-auto-sync`

Git status at planning time:

```text
M src/app/layout.tsx
?? public/mc-logo.jpg
```

Do **not** overwrite those without inspecting. They look like user/agent work already in progress.

Relevant files observed:

- `src/app/page.tsx`
  - Server component calls `GET` from `src/app/api/status/route.ts` directly to avoid Railway self-fetch hairpin.
  - Renders `<JustinDashboard liveData={liveData} />`.
- `src/app/api/status/route.ts`
  - Uses process memory `statusData` plus embedded `STATIC_FALLBACK` from March.
  - POST accepts `MC_AUTH_TOKEN || "barry-update-2026"` and merges pushed data.
  - Static fallback `incomplete` is an array of strings, while UI expects objects.
  - Contains stale claims: March timestamp, Vercel URL, `Barry Online`, stale Battle Dinghy / X Simulator descriptions.
- `src/components/justin-dashboard.tsx`
  - Client component. Current homepage.
  - Shows `Live from STATUS.md`, `Barry Online`, metrics, tabs: Actions / Projects / Incomplete / Today.
  - `LiveProject` interface expects fields not present in static fallback (`emoji`, `nextAction`, `daysSinceTouch`, etc.).
  - `IncompleteItem` expects `{ project, completed, task }` but fallback returns strings, causing `undefined` heading + empty checkbox rows.
- `src/data/projects.ts`
  - Rich but stale project registry. Has project actions, blockers, URLs, local paths.
  - Better than `/api/status` fallback, but still not proof-backed.
- `src/app/api/tasks/route.ts`, `src/app/api/activities/route.ts`
  - Use `/tmp/mission-control-status.json` if present; else static data.
- `src/app/api/railway/deploy/route.ts`
  - Stub. Do not show it as proof of real Railway action.
- `package.json`
  - No test script currently.
  - Dependencies include `better-sqlite3`, Next 14, React 18, Tailwind.

Live URL observed in user session:

```text
https://web-production-2c48a.up.railway.app
```

Likely Railway URL in stale project data:

```text
https://mission-control-production-8b21.up.railway.app
```

Do not assume which is canonical. Verify with Railway CLI or browser before reporting live success.

---

## 1. Product Doctrine — Non-Negotiable

Mission Control v2 is not a project dashboard. It is a **truth machine + agent ops cockpit**.

### Hard Rules

1. **No claim without evidence.**
   - Any status, count, badge, health label, blocker, or action shown above the fold must trace to evidence.

2. **Unknown beats fake green.**
   - If Barry is not probed, show `Unknown` or `No heartbeat source configured`, not `Barry Online`.

3. **Agent reports are testimony, not proof.**
   - An agent may report `done`, but Mission Control must render `Reported done — unverified` until probes/artifacts confirm.

4. **Stale evidence expires.**
   - Every evidence row has TTL. When expired, the derived claim becomes `stale` or `unknown`.

5. **Deploy green != product working.**
   - Railway/GitHub green proves deploy/CI only. Product working requires live URL/API/browser/screenshot checks.

6. **UI proof requires visual proof.**
   - For UI work, HTTP 200 is insufficient. Need rendered page, expected text visible, no console errors, and screenshot.

7. **Every number has a visible definition.**
   - If the UI shows `3 Active`, it must have an `Explain` affordance defining active and showing source/freshness.

8. **Justin interacts only with decisions, approvals, unblock requests, and proof.**
   - Hide raw JSON/log spam under Explain/Debug.

---

## 2. MVP Outcome

After Slice 1, the homepage `/` should immediately show a new `Now` cockpit:

1. **Global command status**
   - Example: `Needs Justin` / `1 action • 2 incidents • 3 agents unknown • verified just now`

2. **Justin Queue**
   - Cards for decisions/approvals/unblocks.
   - If empty: `No Justin actions. Agents can continue.`

3. **Incidents / Drift**
   - Examples automatically generated from evidence/rules:
     - `Mission Control status source stale`
     - `Barry health unverified`
     - `Legacy /api/status fallback shape mismatch`

4. **Agent Lanes**
   - Barry, Harry, Bruce/Hermes, Larry, Randy.
   - Status must be `unknown` unless there is fresh evidence.
   - Each has last proof / current task / blocker / explain.

5. **Project Cards**
   - Secondary, not first.
   - Show current objective, state, owner, proof count, next action.

6. **Proof Feed**
   - Latest evidence rows with source/time/confidence.

7. **Explain drawer/modal**
   - Every card/status has an Explain button.
   - Shows source, timestamp, TTL, confidence, rule, evidence IDs, raw artifact links.

---

## 3. Data Contracts

Create `src/lib/truth/types.ts`.

Use these exact types or close equivalents.

```ts
export type TruthStatus =
  | "verified"
  | "reported"
  | "unverified"
  | "stale"
  | "unknown"
  | "failed";

export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type Confidence = "high" | "medium" | "low" | "unknown";

export type EvidenceSourceType =
  | "http_probe"
  | "github"
  | "railway"
  | "local_process"
  | "local_file"
  | "hermes_cron"
  | "hermes_session"
  | "agent_report"
  | "static_registry"
  | "browser_check"
  | "manual_note";

export interface Evidence {
  id: string;
  sourceType: EvidenceSourceType;
  sourceName: string;
  subjectType: "agent" | "project" | "system" | "run" | "action" | "ui";
  subjectId: string;
  capturedAt: string;
  ttlSeconds: number;
  status: TruthStatus;
  confidence: Confidence;
  summary: string;
  details?: string;
  artifactUrl?: string;
  rawRef?: string;
  metadata?: Record<string, unknown>;
}

export interface Claim {
  id: string;
  subjectType: Evidence["subjectType"];
  subjectId: string;
  title: string;
  status: TruthStatus;
  severity: Severity;
  confidence: Confidence;
  summary: string;
  lastVerifiedAt?: string;
  expiresAt?: string;
  evidenceIds: string[];
  ruleId: string;
  recommendedAction?: string;
}

export interface AgentCard {
  id: "barry" | "harry" | "bruce" | "larry" | "randy" | "hermes" | string;
  name: string;
  role: string;
  status: "working" | "idle" | "blocked" | "stale" | "offline" | "unknown";
  confidence: Confidence;
  currentTask?: string;
  lastHeartbeatAt?: string;
  lastProof?: string;
  blocker?: string;
  claimIds: string[];
  evidenceIds: string[];
}

export interface ProjectCard {
  id: string;
  name: string;
  emoji?: string;
  status: "active" | "blocked" | "degraded" | "stale" | "paused" | "unknown";
  priority: number;
  objective: string;
  ownerAgent?: string;
  localPath?: string;
  repoUrl?: string;
  liveUrl?: string;
  nextAction?: string;
  blocker?: string;
  lastVerifiedAt?: string;
  proofCount: number;
  claimIds: string[];
  evidenceIds: string[];
}

export interface JustinAction {
  id: string;
  type: "approve" | "decide" | "review" | "unblock" | "provide_input" | "confirm_destructive";
  title: string;
  projectId?: string;
  agentId?: string;
  urgency: Severity;
  whyJustin: string;
  recommendation?: string;
  risk?: string;
  options: string[];
  claimIds: string[];
  evidenceIds: string[];
}

export interface Incident {
  id: string;
  severity: Severity;
  title: string;
  affected: string;
  symptom: string;
  suspectedCause?: string;
  status: "open" | "monitoring" | "resolved";
  firstSeenAt: string;
  lastSeenAt: string;
  recommendedAction?: string;
  claimIds: string[];
  evidenceIds: string[];
}

export interface ProofFeedItem {
  id: string;
  capturedAt: string;
  label: string;
  source: string;
  status: TruthStatus;
  confidence: Confidence;
  artifactUrl?: string;
  subjectLabel: string;
}

export interface MissionControlSnapshot {
  generatedAt: string;
  globalStatus: "all_clear" | "needs_justin" | "agent_blocked" | "production_broken" | "data_stale" | "unknown";
  headline: string;
  summary: {
    justinActions: number;
    openIncidents: number;
    agentsWorking: number;
    agentsUnknown: number;
    staleClaims: number;
    verifiedProofs: number;
  };
  freshness: {
    label: string;
    worstStatus: "fresh" | "stale" | "unknown";
    generatedAt: string;
  };
  justinQueue: JustinAction[];
  agents: AgentCard[];
  projects: ProjectCard[];
  incidents: Incident[];
  proofFeed: ProofFeedItem[];
  claims: Claim[];
  evidence: Evidence[];
}
```

---

## 4. Truth Rules

Create `src/lib/truth/rules.ts`.

Rules must be pure functions and testable.

### Rule IDs

- `rule.agent.no_fresh_heartbeat`
- `rule.agent.fresh_heartbeat`
- `rule.project.static_registry_unverified`
- `rule.project.has_blocker`
- `rule.system.status_api_stale`
- `rule.system.legacy_shape_mismatch`
- `rule.ui.blank_or_failed_render`
- `rule.global.needs_justin`
- `rule.global.production_broken`
- `rule.global.data_stale`

### TTL Defaults

Create constants in `src/lib/truth/ttl.ts`:

```ts
export const TTL = {
  agentHeartbeat: 5 * 60,
  httpProbe: 5 * 60,
  railwayDeploy: 60 * 60,
  githubStatus: 30 * 60,
  localFile: 24 * 60 * 60,
  staticRegistry: 12 * 60 * 60,
  agentReport: 30 * 60,
  browserCheck: 60 * 60,
  manualNote: 7 * 24 * 60 * 60,
} as const;
```

### Freshness helper

Create `src/lib/truth/time.ts`:

```ts
export function isFresh(capturedAt: string, ttlSeconds: number, now = new Date()): boolean {
  const captured = new Date(capturedAt).getTime();
  if (Number.isNaN(captured)) return false;
  return now.getTime() - captured <= ttlSeconds * 1000;
}

export function expiresAt(capturedAt: string, ttlSeconds: number): string {
  return new Date(new Date(capturedAt).getTime() + ttlSeconds * 1000).toISOString();
}

export function relativeAge(capturedAt: string, now = new Date()): string {
  const ms = Math.max(0, now.getTime() - new Date(capturedAt).getTime());
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}
```

### Derived truth behavior

Implement:

- Agent with no heartbeat evidence → `unknown`, claim `Agent health unverified`, confidence `unknown`.
- Agent with fresh heartbeat evidence `verified` → `idle` or `working` if metadata says task.
- Project from static registry only → not `healthy`; render `unknown` or `active/unverified` with `static_registry` proof.
- Project with blocker text → incident or warning claim.
- `/api/status` static fallback timestamp older than TTL → incident `Mission Control status source stale`.
- Fallback incomplete shape mismatch → incident `Legacy status payload shape mismatch`.
- Any `JustinAction` count should come from `justinQueue`, not ad-hoc nextAction fields.

---

## 5. Source Registry

Create `src/lib/truth/registry.ts`.

This replaces raw ad-hoc mapping in the homepage.

Seed projects from `src/data/projects.ts`, but normalize them into `ProjectCard` and mark as static registry evidence only.

Seed agents explicitly:

```ts
export const AGENTS = [
  { id: "barry", name: "Barry", role: "OpenClaw/Grok builder on port 18789; code/build agent" },
  { id: "harry", name: "Harry", role: "Gemma4 enrichment/scraping on port 18790; not coder" },
  { id: "bruce", name: "Bruce", role: "Hermes Grok bot; tools-first verification" },
  { id: "larry", name: "Larry", role: "Strategy / high-level thinking" },
  { id: "randy", name: "Randy", role: "Bruce-like bot Justin made" },
  { id: "hermes", name: "Hermes", role: "This local assistant/session runner" },
] as const;
```

Important: do not put secret URLs/tokens in registry.

Project registry must include at least:

- `mission-control`
  - localPath: `/Users/justinfagan/dev/mission-control`
  - repoUrl: `https://github.com/thejustinfagan/mission-control`
  - objective: `Truth Machine v2 rebuild`
- `threadplay-simulator`
  - localPath candidates: `/Users/justinfagan/dev/threadplay-simulator-bd-wire`, `/tmp/threadplay-bd-status-fix`
  - known production URL: `https://threadplay-simulator-production.up.railway.app`
- `battle-dinghy`
  - localPath: `/Users/justinfagan/dev/Battle_Dinghy`
  - exact naming: spell `Battle Dinghy`, `Battle_Dinghy`, `Battle_Dinghy-Sim`, `@battle_dinghy`; avoid ambiguous `BD`.
- `fleet-intel`
  - localPath candidates from existing data.
- `reseller-intel`
  - localPath if known later.

Use current `src/data/projects.ts` as a compatibility source, but do not trust its status as live proof.

---

## 6. Evidence Connectors — Slice 1 vs Slice 2

### Slice 1: deterministic in-app connectors

Create `src/lib/truth/connectors/static.ts`:

- Converts `src/data/projects.ts` to static evidence rows.
- CapturedAt should be file/project `lastWorked` if available, but mark confidence `low` and `sourceType: static_registry`.
- Also create evidence that current legacy `/api/status` fallback is stale if embedded timestamp is old.

Create `src/lib/truth/connectors/local.ts`:

Server-side only.

- Check local repo path existence only when running locally; on Railway, local macOS paths will not exist, so emit `unknown` evidence not failure.
- Use `fs.existsSync` guarded with try/catch.
- Do not expose filesystem secrets.

Create `src/lib/truth/connectors/http.ts`:

- For known public URLs, fetch with timeout.
- Use no credentials.
- Store status code and short summary only.
- If fetch fails, evidence status `failed`.
- In Slice 1, limit to Mission Control live URL(s) if known and safe.

### Slice 2: real external probes

Do not block Slice 1 on these.

- GitHub connector via `gh` or GitHub API route.
- Railway connector via CLI/API. Must report key presence only, no secrets.
- Hermes cron/session connector reading safe output summaries.
- Browser screenshot probe for UI rendering.

---

## 7. API Routes

Create these routes:

### `GET /api/mission-control`

File: `src/app/api/mission-control/route.ts`

- Runtime: nodejs.
- Calls `buildMissionControlSnapshot()` from `src/lib/truth/snapshot.ts`.
- Returns `MissionControlSnapshot`.
- Set `Cache-Control: no-store`.

Expected response shape is exactly the type above.

### `GET /api/mission-control/explain/[id]`

File: `src/app/api/mission-control/explain/[id]/route.ts`

- Accepts claim ID, evidence ID, project ID, agent ID, incident ID, or action ID.
- For Slice 1, easiest: rebuild snapshot and search all arrays.
- Return:

```ts
{
  id: string;
  kind: "claim" | "evidence" | "project" | "agent" | "incident" | "action";
  title: string;
  status?: string;
  confidence?: string;
  ruleId?: string;
  freshness?: string;
  evidence: Evidence[];
  claims: Claim[];
  raw?: unknown;
}
```

### Keep `GET /api/status`

Do not delete yet. Other pages/scripts may use it.

But update it to:

- Add response field `sourceWarning` if returning static fallback.
- Normalize `incomplete` to objects so existing UI pages do not break.
- Remove or stop displaying `Barry Online` from this route.

Eventually deprecate with comment.

---

## 8. UI Components

Replace the homepage implementation.

### File changes

- Modify `src/app/page.tsx`
  - Stop importing `GET as getStatusResponse`.
  - Import `buildMissionControlSnapshot` directly OR fetch `/api/mission-control` via internal function. Prefer direct import server-side to avoid self-fetch.
  - Render new component: `<TruthCockpit snapshot={snapshot} />`.

- Create `src/components/truth/truth-cockpit.tsx`
- Create `src/components/truth/global-status-card.tsx`
- Create `src/components/truth/justin-queue.tsx`
- Create `src/components/truth/agent-lanes.tsx`
- Create `src/components/truth/incidents-panel.tsx`
- Create `src/components/truth/project-state-grid.tsx`
- Create `src/components/truth/proof-feed.tsx`
- Create `src/components/truth/explain-drawer.tsx`
- Create `src/components/truth/status-pill.tsx`

Keep `src/components/justin-dashboard.tsx` for reference or delete only after new home works. Safer: leave it unused during Slice 1.

### Homepage visual hierarchy

Mobile-first layout:

```text
MISSION CONTROL
Truth Machine • verified just now • source: /api/mission-control

[GLOBAL STATUS CARD]
Needs Justin
1 action • 2 incidents • 4 unknown agents

[JUSTIN QUEUE]
- Decision / review cards

[INCIDENTS]
- High/medium issues

[AGENTS]
- Barry / Harry / Bruce / Larry / Randy / Hermes compact cards

[PROOF FEED]
- Latest evidence rows

[PROJECTS]
- Compact project cards
```

### Global status colors

- `all_clear`: emerald
- `needs_justin`: amber
- `agent_blocked`: red/amber
- `production_broken`: red
- `data_stale`: purple/amber
- `unknown`: slate

### Explain UX

A simple client-side drawer is enough:

- Button label: `Explain`
- Opens panel from bottom on mobile / right side on desktop.
- Shows:
  - Status
  - Confidence
  - Source
  - Captured
  - TTL/expires
  - Rule used
  - Evidence summary
  - Artifact links

Do not overbuild server actions for Slice 1.

---

## 9. Tests / Verification

Add test infrastructure because current repo has no test script.

### Install dev dependency

Use Node's built-in test runner if possible to avoid dependency bloat, but TypeScript support is awkward. Recommended: add `vitest`.

Command:

```bash
npm install -D vitest
```

Update `package.json`:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest run",
  "test:watch": "vitest",
  "convex:dev": "convex dev"
}
```

Create tests:

- `src/lib/truth/__tests__/time.test.ts`
- `src/lib/truth/__tests__/rules.test.ts`
- `src/lib/truth/__tests__/snapshot.test.ts`

### Must-have tests

1. `isFresh` returns false after TTL.
2. Evidence with expired TTL creates stale claim.
3. Agent with no heartbeat becomes `unknown`, not `online`.
4. Static registry project does not become `verified healthy`.
5. Legacy incomplete string array normalizes to object array.
6. Snapshot has `globalStatus: needs_justin` when Justin queue non-empty.
7. Every visible project/agent/action/incident references evidence IDs.
8. Snapshot contains no `Barry Online` string unless verified evidence exists.
9. `buildMissionControlSnapshot()` returns serializable JSON.
10. If all evidence is stale/unknown, global status is not `all_clear`.

### Manual verification commands

Run locally:

```bash
npm run test
npm run build
npm run dev
```

Then verify:

```bash
curl -s http://localhost:3000/api/mission-control | python3 -m json.tool | head -80
curl -s http://localhost:3000/api/mission-control | grep -q 'Barry Online' && echo BAD || echo OK
```

Browser verification:

- Open `http://localhost:3000`
- Check above fold shows Truth Machine / Needs Justin or Unknown, not stale STATUS.md language.
- Click Explain on global status.
- Click Explain on Barry.
- Click Explain on one incident.
- Check browser console has no errors.
- Mobile viewport around 390px: top screen must show global status + at least first Justin Queue/Incident card without horizontal scrolling.

---

## 10. Bite-Sized Implementation Tasks

### Task 1: Create truth type definitions

**Objective:** Add typed domain model for evidence, claims, agents, projects, actions, incidents, and snapshots.

**Files:**
- Create: `src/lib/truth/types.ts`

**Steps:**
1. Create the file.
2. Paste/adapt types from Section 3.
3. Export everything.
4. Run `npm run build` after enough files exist, or `npx tsc --noEmit`.

**Done when:** TypeScript can import these types with no errors.

**Commit:** `feat: add mission control truth types`

---

### Task 2: Add time/TTL helpers with tests

**Objective:** Make freshness deterministic and testable.

**Files:**
- Create: `src/lib/truth/ttl.ts`
- Create: `src/lib/truth/time.ts`
- Modify: `package.json`
- Create: `src/lib/truth/__tests__/time.test.ts`

**Steps:**
1. Install vitest: `npm install -D vitest`.
2. Add scripts: `test`, `test:watch`.
3. Add TTL constants.
4. Add `isFresh`, `expiresAt`, `relativeAge`.
5. Write tests for fresh/stale boundaries.
6. Run `npm run test`.

**Done when:** time tests pass.

**Commit:** `test: add truth freshness helpers`

---

### Task 3: Build static registry connector

**Objective:** Convert current project registry and agent list into evidence rows without pretending they are live proof.

**Files:**
- Create: `src/lib/truth/registry.ts`
- Create: `src/lib/truth/connectors/static.ts`
- Test: `src/lib/truth/__tests__/static-connector.test.ts`

**Implementation requirements:**
- Import `projects` from `@/data/projects`.
- Convert each project to one `Evidence` row with `sourceType: "static_registry"`, `confidence: "low"`.
- Agent list uses memory-known roles but status remains unverified until heartbeat evidence exists.
- Do not include secrets.
- Avoid ambiguous `BD`; spell exact Battle Dinghy names in labels/descriptions.

**Done when:** tests prove static evidence exists and no project is marked verified from registry alone.

**Commit:** `feat: add static truth registry connector`

---

### Task 4: Implement core truth rules

**Objective:** Derive claims from evidence.

**Files:**
- Create: `src/lib/truth/rules.ts`
- Test: `src/lib/truth/__tests__/rules.test.ts`

**Implementation requirements:**
- Pure functions only.
- Export `deriveClaims(evidence, now)`.
- Add helper `evidenceBySubject` if useful.
- Implement at minimum:
  - no fresh heartbeat → unknown agent health claim
  - static registry project → unverified/static claim
  - blocker metadata → warning claim
  - stale evidence → stale claim

**Done when:** rule tests pass.

**Commit:** `feat: derive truth claims from evidence`

---

### Task 5: Implement snapshot builder

**Objective:** Produce the single normalized payload for the UI.

**Files:**
- Create: `src/lib/truth/snapshot.ts`
- Test: `src/lib/truth/__tests__/snapshot.test.ts`

**Implementation requirements:**
- Export `buildMissionControlSnapshot(now = new Date()): Promise<MissionControlSnapshot>` or sync if no async probes yet.
- Gather static evidence.
- Derive claims.
- Build agents, projects, incidents, Justin queue, proof feed.
- Include seeded Justin action for this rebuild if no live actions exist:
  - title: `Approve Mission Control v2 Truth Machine build direction`
  - type: `review` or `decide`
  - recommendation: `Build truth ledger + cockpit, not dashboard polish`
- Generate incidents for:
  - stale legacy status fallback
  - unverified Barry health
  - legacy incomplete shape mismatch if `/api/status` fallback remains string array
- Global status priority:
  1. critical/high incidents with production/system impact → `production_broken`
  2. Justin queue non-empty → `needs_justin`
  3. any agent blocked → `agent_blocked`
  4. stale data incidents → `data_stale`
  5. if no proof → `unknown`
  6. only if no actions/incidents/stale/unknown → `all_clear`

**Done when:** snapshot tests pass and every card references evidence.

**Commit:** `feat: build mission control truth snapshot`

---

### Task 6: Add `/api/mission-control`

**Objective:** Expose normalized truth API.

**Files:**
- Create: `src/app/api/mission-control/route.ts`

**Implementation requirements:**
- `export const dynamic = "force-dynamic";`
- `export const revalidate = 0;`
- Set no-store headers.
- Return snapshot JSON.
- Catch errors and return 500 with safe message.

**Verification:**

```bash
npm run build
npm run dev
curl -s http://localhost:3000/api/mission-control | python3 -m json.tool | head -80
```

**Commit:** `feat: expose mission control truth api`

---

### Task 7: Add explain endpoint

**Objective:** Make every claim inspectable.

**Files:**
- Create: `src/app/api/mission-control/explain/[id]/route.ts`
- Optional helper: `src/lib/truth/explain.ts`

**Implementation requirements:**
- Rebuild snapshot.
- Search claims/evidence/projects/agents/incidents/actions by ID.
- Return related claims/evidence.
- 404 if not found.

**Verification:**

```bash
curl -s http://localhost:3000/api/mission-control/explain/<known-id> | python3 -m json.tool
```

**Commit:** `feat: add truth explanation endpoint`

---

### Task 8: Normalize legacy `/api/status` enough to stop visible breakage

**Objective:** Preserve old route compatibility while preventing current UI/data shape bugs.

**Files:**
- Modify: `src/app/api/status/route.ts`

**Implementation requirements:**
- Add `normalizeIncomplete()` converting strings to:

```ts
{ project: "Legacy STATUS.md", completed: false, task: string }
```

- Add `sourceWarning` when static fallback is used:

```ts
sourceWarning: {
  kind: "static_fallback",
  message: "Static fallback is stale and must not be treated as live truth"
}
```

- Do not remove POST yet.
- Do not expose default auth token in UI.

**Test:** Add a test if easy, else verify API manually.

**Commit:** `fix: normalize legacy status fallback shape`

---

### Task 9: Build truth UI components

**Objective:** Create cockpit components without replacing homepage yet.

**Files:**
- Create: `src/components/truth/status-pill.tsx`
- Create: `src/components/truth/explain-drawer.tsx`
- Create: `src/components/truth/global-status-card.tsx`
- Create: `src/components/truth/justin-queue.tsx`
- Create: `src/components/truth/incidents-panel.tsx`
- Create: `src/components/truth/agent-lanes.tsx`
- Create: `src/components/truth/proof-feed.tsx`
- Create: `src/components/truth/project-state-grid.tsx`
- Create: `src/components/truth/truth-cockpit.tsx`

**Implementation requirements:**
- Use Tailwind existing dark palette.
- Mobile-first; no table above fold.
- Every card has Explain button.
- Do not show raw JSON unless drawer/debug section.
- Do not show `Barry Online` unless snapshot says verified.
- Empty states:
  - Justin queue empty: `No Justin actions. Agents can continue.`
  - Incidents empty: `No open incidents.`
  - Proof empty: `No fresh proof yet.`

**Commit:** `feat: add truth cockpit components`

---

### Task 10: Replace homepage with Truth Cockpit

**Objective:** Make `/` the new truth machine.

**Files:**
- Modify: `src/app/page.tsx`

**Implementation approach:**

```tsx
import { TruthCockpit } from "@/components/truth/truth-cockpit";
import { buildMissionControlSnapshot } from "@/lib/truth/snapshot";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const snapshot = await buildMissionControlSnapshot();
  return <TruthCockpit snapshot={snapshot} />;
}
```

**Done when:** Home no longer imports `api/status/route` or `JustinDashboard`.

**Commit:** `feat: replace homepage with truth cockpit`

---

### Task 11: Add real local health probes cautiously

**Objective:** Start moving from static truth to real evidence, without overpromising.

**Files:**
- Create: `src/lib/truth/connectors/http.ts`
- Create: `src/lib/truth/connectors/local.ts`
- Modify: `src/lib/truth/snapshot.ts`

**Implementation requirements:**
- HTTP probe public Mission Control URL(s) only if configured in env or registry.
- Use `AbortController` timeout 3s.
- If env `MISSION_CONTROL_LIVE_URL` exists, probe it.
- If not set, do not guess; emit `unknown/config missing` evidence.
- Local paths should be `unknown` on Railway, not failed.

**Environment variables:**

- `MISSION_CONTROL_LIVE_URL` optional.
- `ENABLE_LOCAL_PROBES=true` optional; default false on Railway.

**Commit:** `feat: add cautious truth probes`

---

### Task 12: Visual QA and build verification

**Objective:** Prove it works and is not another broken shell.

**Commands:**

```bash
npm run test
npm run build
npm run dev
```

Browser checks:

- Desktop `/`
- Mobile width ~390px `/`
- `/api/mission-control`
- one `/api/mission-control/explain/<id>`

Acceptance criteria:

- No `Live from STATUS.md` on homepage.
- No `Barry Online` unless verified evidence exists.
- No `undefined` headings.
- No blank checkbox rows.
- Global status visible above fold.
- Explain drawer works.
- API returns claims and evidence.
- Console has no JS errors.

**Commit:** `test: verify truth cockpit build`

---

## 11. Codex / Claude One-Shot Prompt

Copy/paste this into Codex or Claude Code from repo root `/Users/justinfagan/dev/mission-control`:

```text
You are in /Users/justinfagan/dev/mission-control. Build Mission Control v2 as an evidence-backed truth machine, not a prettier dashboard.

Read docs/plans/mission-control-v2-truth-machine-one-shot.md fully before editing.

Non-negotiables:
- Every visible operational claim must have source, timestamp, TTL/freshness, confidence, and evidence/proof.
- If a claim cannot be verified, show Unknown/Unverified/Stale. Never fake green.
- Do not display “Barry Online” unless fresh evidence proves Barry is online.
- Do not display “Live from STATUS.md” as a truth source on the homepage.
- Keep /api/status for compatibility, but normalize its broken incomplete fallback shape.
- Build the new homepage from /api/mission-control / buildMissionControlSnapshot, not raw STATUS.md.
- Do not touch secrets. Do not print tokens. Do not modify Barry/Harry OpenClaw configs.
- Avoid ambiguous “BD” shorthand in user-facing strings. Spell exact names like Battle Dinghy, Battle_Dinghy, Battle_Dinghy-Sim, @battle_dinghy.

Current repo reality:
- Branch may have existing dirty changes: inspect git status before editing.
- src/app/page.tsx currently renders JustinDashboard from /api/status.
- src/app/api/status/route.ts has stale static fallback from March and incomplete as string array.
- src/components/justin-dashboard.tsx has the current stale dashboard and shape mismatch bugs.
- src/data/projects.ts is useful as a static project registry but not live proof.
- No tests exist yet; add Vitest and truth-engine tests.

Implement in small commits if possible:
1. Add truth types in src/lib/truth/types.ts.
2. Add TTL/time helpers and Vitest tests.
3. Add static registry connector from src/data/projects.ts and explicit agent registry.
4. Add pure truth rules and tests.
5. Add buildMissionControlSnapshot() and tests.
6. Add GET /api/mission-control with no-store.
7. Add explain endpoint.
8. Normalize legacy /api/status fallback incomplete strings to objects and add sourceWarning.
9. Build truth cockpit components under src/components/truth/.
10. Replace homepage with TruthCockpit.
11. Add cautious HTTP/local probes only if safe/configured.
12. Run npm run test and npm run build.

UI acceptance:
- Mobile-first dark cockpit.
- Above fold: global status, Justin Queue, incidents/risks, agent lanes, proof feed.
- Every card/status has Explain.
- Empty states are explicit.
- No raw JSON by default.
- No tables above fold.
- Every number/metric is explainable.

API acceptance:
- GET /api/mission-control returns generatedAt, globalStatus, summary, freshness, justinQueue, agents, projects, incidents, proofFeed, claims, evidence.
- Every agent/project/action/incident references claimIds/evidenceIds.
- Explain endpoint returns related evidence/claims for a given ID.

Test acceptance:
- isFresh expires evidence by TTL.
- Agent with no heartbeat is unknown, not online.
- Static registry project is not verified healthy.
- Legacy incomplete string array normalizes to object rows.
- No snapshot/homepage strings contain “Barry Online” unless there is fresh verified evidence.
- Snapshot is serializable JSON.
- Global status is not all_clear when evidence is stale/unknown.

Verification before final response:
- git diff reviewed.
- npm run test passes.
- npm run build passes.
- Run local app and inspect /api/mission-control JSON.
- Browser-check homepage at desktop and ~390px mobile width; no console errors.
- Report exact files changed, tests run, and any remaining unverified connectors.
```

---

## 12. Deployment Plan After Local Green

Do not claim production success from local build.

1. Check Railway project linkage:

```bash
railway status --json
railway list --json
```

2. Identify canonical service/domain before deploy.

3. Deploy:

```bash
railway up --detach
```

4. Poll deployment/logs until online.

5. Verify live:

```bash
curl -s https://<canonical-domain>/api/mission-control | python3 -m json.tool | head -80
```

6. Browser-check canonical live `/`:

- desktop screenshot
- mobile screenshot
- console errors
- Explain drawer works

7. Final report to Justin:

- Working: yes/no
- URL alone on its own line
- Tests: exact commands
- Remaining unverified sources

---

## 13. Definition of Done

This project is not done when the UI looks nice.

It is done when:

- Homepage is a truth cockpit, not status dashboard.
- No fake green health labels exist.
- All major visible claims have evidence IDs.
- Stale/static data is visibly labeled stale/static/unverified.
- Justin Queue is primary above fold.
- Agents are unknown unless proven.
- Incidents/drift are visible.
- Explain works for statuses/cards.
- Tests protect truth rules.
- Local build passes.
- Live Railway deploy is verified in browser.

If any of those fail, do not report PASS.
