# North Star Audit — Mission Control

**Date:** 2026-07-08  
**Auditor:** Cursor Cloud Agent  
**Reference:** `protocols/mission_control_operating_principles.md`

## North Star (What Success Looks Like)

Mission Control succeeds when Justin can open it and **immediately** know:

| Question | Required capability |
|----------|---------------------|
| What is moving? | Auto-capture of agent work + verified progress signals |
| What is stuck? | Blockers with fresh evidence, not stale registry text |
| What needs Justin? | Escalation queue with actionable controls |
| What made progress without Justin? | Agent activity feed + proof cards |
| What can make money? | Monetization hypotheses tracked and ranked |
| What builds thought leadership? | Content/strategy lane visibility |
| What should be killed? | Kill/pause recommendations from nightly sweep |
| What did the agents learn? | Memory + sweep learnings surfaced |
| How is the OS improving? | Meta-critique of the operating system |

Plus the five automation pillars: **auto-capture, auto-sweep, auto-summarize, auto-escalate, auto-improve**.

## Current State vs. North Star

### What's built (strong foundation)

| Area | Status | Notes |
|------|--------|-------|
| Truth Cockpit v2 | ✅ Shipped | Evidence-backed snapshot, no fake green |
| Proof cards | ✅ Shipped | 9-slot proof model per project |
| Explain drawer | ✅ Shipped | Claims + evidence traceability |
| Justin queue + actions | ✅ Shipped | Clickable approve/reject/defer |
| HTTP reachability probes | ✅ Partial | MC self-probe wired; other projects not probed |
| Static project registry | ✅ Shipped | `src/data/projects.ts` — testimony, not proof |
| Secondary pages | ✅ Shipped | Tasks, calendar, team, memory, projects, intel |
| Test suite | ✅ 59 tests | Truth layer well covered |

### Critical gaps (why it still feels far from north star)

| Gap | Severity | Current reality |
|-----|----------|-----------------|
| **Manual data upkeep** | 🔴 Critical | `projects.ts`, `tasks.ts`, `team.ts` are hand-edited. Violates "agents update MC, not Justin." |
| **No agent heartbeat** | 🔴 Critical | Barry/Harry always show Unknown. No live agent lane. |
| **No auto-capture** | 🔴 Critical | Activity API exists but nothing pushes Barry's work into MC automatically |
| **No nightly sweep** | 🔴 Critical | No cron/agent reviews repos, stale items, strategy gaps |
| **No auto-summarize** | 🟠 High | Raw truth data, no executive daily view (until AI briefing) |
| **No Convex / real DB** | 🟠 High | SPEC.md calls for Convex; app uses static JSON + SQLite for decisions only |
| **Proof cards mostly empty** | 🟠 High | Branch, commit, tests, live verification slots unknown for all projects |
| **0 verified-healthy projects** | 🟠 High | By design — no browser-render or test-result evidence wired |
| **Global search** | 🟡 Medium | SPEC feature; search view uses hardcoded mock data |
| **Mobile steering** | 🟡 Medium | Responsive UI exists; drag/drop reprioritize not wired |
| **Monetization lane** | 🟡 Medium | Revenue fields in registry but not in Truth Cockpit |
| **Content/strategy lanes** | 🟡 Medium | Operating principles scope includes these; MC tracks code only |

### Architecture alignment

```
North Star                    Today                         Gap
─────────────────────────────────────────────────────────────────
Canonical records in Git      projects.ts (manual)          Needs agent push + git sync
Review surfaces (dashboard)   Truth Cockpit ✅              Good
Auto-maintained               Static files ❌               Biggest gap
Evidence-backed truth         Truth layer ✅                Good foundation
Agent updates MC              No ingestion pipeline ❌      Barry must POST /api/activities
Nightly sweep                 Not built ❌                  Needs scheduled agent + AI
Executive summary             Raw metrics only ❌           AI briefing (this PR) starts this
```

## Recommended Roadmap (priority order)

### Phase 1 — Close the loop (highest ROI)

1. **Barry heartbeat connector** — POST `/api/agents/heartbeat` every 30 min; wire `agent-heartbeat` evidence ✅ *shipped*
2. **Activity auto-capture** — Barry logs every action to `/api/activities`; surface in proof feed ✅ *shipped*
3. **GitHub connector** — Pull latest commit, branch, CI status per registered repo → fill proof card slots ✅ *shipped*
4. **NVIDIA AI executive briefing** — Daily auto-summarize snapshot against the 9 success questions ✅ *shipped*

### Phase 2 — Automation

5. **Nightly sweep cron** — Railway cron or Barry heartbeat triggers repo review + AI critique ✅ *shipped*
6. **SQLite persistence** — Heartbeats, activities, decisions, sweeps in one DB ✅ *shipped*
7. **Probe all live URLs** — Registry liveUrls + fleet-intel + MC /api/status ✅ *shipped*

### Phase 3 — Full operating system

8. **Browser-render proof** — HTML render probes with content markers ✅ *shipped*
9. **Mobile task steering** — Quick-add, drag/drop, tap-to-move status ✅ *shipped*
10. **Monetization + content lanes** — Strategic lanes panel on cockpit ✅ *shipped*

## AI Integration Opportunity

NVIDIA NIM (`integrate.api.nvidia.com`) can power:

- **Executive briefing** — Answers the 9 north-star questions from the live snapshot
- **Nightly sweep narrative** — Repo diffs + stale items → recommendations
- **Explain enhancement** — Plain-English "why is this unknown?" from claims/evidence
- **Kill/pause/defer suggestions** — Rank projects by evidence freshness + blockers

**Security:** Store `NVIDIA_API_KEY` in Railway env vars only. Never commit keys. Rotate any key shared in chat.

## Scorecard

| Pillar | Score | Notes |
|--------|-------|-------|
| Auto-capture | 6/10 | SQLite + activity API; Barry must POST |
| Auto-sweep | 7/10 | Nightly sweep API + AI critique panel |
| Auto-summarize | 7/10 | AI briefing + sweep |
| Auto-escalate | 6/10 | Justin queue works |
| Auto-improve | 5/10 | OS critique in nightly sweep |
| Truth/evidence | 9/10 | Render probes + heartbeat + GitHub + multi-URL |
| Mobile | 8/10 | Task board quick-add, drag/drop, tap-to-move |
| **Overall north-star proximity** | **~75%** | Full OS surface; Barry must feed + cron |

## Bottom Line

Mission Control has an excellent **truth doctrine** and **cockpit UI**, but it is still a **manual dashboard** wearing a **verification framework**. The north star requires the **agents to feed it** and **AI to summarize/steer** — not Justin editing TypeScript files.

This PR adds the first AI layer: an NVIDIA-powered executive briefing that reads the live snapshot and answers the operating-principles success questions. Next priority: wire Barry's heartbeat and activity push so the briefing has real signal instead of registry testimony.
