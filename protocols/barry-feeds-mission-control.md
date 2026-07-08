# Barry Feeds Mission Control

## Core rule

**If Barry does work, Barry feeds Mission Control. If Barry cannot feed Mission Control, the work is not complete.**

## One command after every action

```bash
export MC_AUTH_TOKEN=<your-railway-secret>
export MC_URL=https://web-production-2c48a.up.railway.app

./scripts/barry-feed-mc.sh \
  --task "What you just did" \
  --project fleet-intel \
  --type code
```

This single call:
1. Records a **heartbeat** (agent lane → Online)
2. Logs an **activity** (proof feed + change slot)
3. Optionally updates **registry** fields (status, lastWorked, blockers)

## Heartbeat cron (every 30 min, 8am–9pm)

```bash
./scripts/barry-feed-mc.sh --heartbeat-only --task "Heartbeat check"
```

Or use `scripts/push-heartbeat.sh` for heartbeat-only.

## Registry update after project work

```bash
./scripts/barry-feed-mc.sh \
  --task "Route planner drag fix shipped" \
  --project fleet-intel \
  --type deploy \
  --registry-status "Route planner fix live on Railway" \
  --registry-last-worked 2026-07-08
```

## Nightly (3am CT)

```bash
./scripts/run-nightly-sweep.sh --force
./scripts/push-live-status.sh   # optional git scan + status snapshot
```

## API reference

| Endpoint | Purpose |
|----------|---------|
| `POST /api/agents/feed` | **Primary** — heartbeat + activity + registry in one call |
| `POST /api/agents/heartbeat` | Heartbeat only |
| `POST /api/activities` | Activity only |
| `POST /api/agents/registry` | Single project registry push |
| `POST /api/mission-control/sweep` | Nightly canonical sweep (cron) |

All POSTs use `Authorization: Bearer $MC_AUTH_TOKEN` when the token is set on Railway.

## What changes in the cockpit

- **Agent lanes** — Online when heartbeat is fresh (< 30 min)
- **Proof feed** — Activities appear as evidence
- **Proof cards** — "What changed" slot fills from activities
- **Registry** — Agent-pushed status/blockers override stale `projects.ts` testimony
- **Briefing + sweep** — AI reads live snapshot, not just static files

## JSON feed payload (for OpenClaw / custom scripts)

```json
{
  "agentId": "barry",
  "heartbeat": { "ok": true, "currentTask": "Nightly Amazement Build" },
  "activity": {
    "actionType": "code",
    "description": "Added render probe connector",
    "project": "mission-control",
    "status": "success"
  },
  "registry": [{
    "projectId": "mission-control",
    "claimedStatus": "Phase 3 shipped — Barry feed loop live",
    "lastWorked": "2026-07-08",
    "blockers": []
  }]
}
```

POST to `/api/agents/feed`.
