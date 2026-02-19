# Codex Task: Build Calendar View for Mission Control

## Goal
Add a calendar page showing all scheduled cron jobs and tasks. Justin needs visibility into everything Barry does automatically.

## Calendar Requirements

### Page: `src/app/calendar/page.tsx`

### Data Source: `src/data/schedule.ts`
```typescript
export interface ScheduledJob {
  id: string;
  name: string;
  schedule: string; // human-readable (e.g., "Every day at 6:00 AM")
  cronExpr: string; // raw cron expression
  timezone: string;
  enabled: boolean;
  category: "briefing" | "polymarket" | "maintenance" | "build" | "research";
  description: string;
  lastRun?: string; // ISO date
  lastStatus?: "ok" | "error";
  lastError?: string;
  nextRun?: string; // ISO date
}
```

### Pre-populated Jobs (from actual cron config):

| Time | Name | Category | Schedule |
|------|------|----------|----------|
| 12:00 AM | Fleet Intel Batch Enrichment | maintenance | Daily midnight |
| 1:00 AM | Nightly Amazement Build | build | Daily 1am |
| 3:00 AM | Nightly Strategic Review | research | Daily 3am |
| 4:00 AM | Project Tracker (Night) | maintenance | 11pm-5am hourly |
| 6:00 AM | Morning Briefing | briefing | Daily 6am |
| 6:00 AM | Polymarket Daily Signals | polymarket | Daily 6am |
| 6:00 AM | Polymarket Daily Report | polymarket | Daily 6am |
| 6:00 AM | Polymarket Cluster Arb Scan | polymarket | Daily 6am |
| 6:30 AM | Polymarket HTML Report | polymarket | Daily 6:30am |
| 7:00 AM | Whale Alert Scan | polymarket | 7am, 12pm, 5pm |
| 8:00 AM | Paper Trader Update | polymarket | 8am, 8pm |
| 8am-10pm | Project Tracker Update | maintenance | Hourly 8am-10pm |
| :15/:45 | Push Status to Mission Control | maintenance | Every 30 min |
| 8:00 PM | Daily Usage Snapshot | maintenance | Daily 8pm |
| 9:00 AM Sun | Polymarket Weekly Performance | polymarket | Sundays 9am |

### UI Design

#### Weekly Timeline View
- Show a 24-hour timeline for the current day (and toggle to week view)
- Each job is a colored block on the timeline at its scheduled time
- Color by category:
  - 🔵 briefing (blue)
  - 🟢 polymarket (green)  
  - 🟡 maintenance (yellow)
  - 🟣 build (purple)
  - 🔴 research (red)
- Jobs show status indicator: ✅ last run OK | ❌ last run error | ⏸️ disabled
- Click a job to see details (description, last run, last error, next run)

#### Daily Schedule List (below timeline)
- Chronological list of today's jobs
- Each shows: time, name, status badge, category pill
- Expandable to show description and last run details

#### Summary Bar
- Total jobs: X
- Enabled: X | Disabled: X
- Errors in last 24h: X
- Next upcoming: [job name] at [time]

### Navigation
- Add "Calendar" link to navigation (after Tasks)

### Acceptance Criteria
- Calendar page renders at /calendar
- All 15 cron jobs displayed with correct times
- Category colors applied
- Status indicators show last run result
- Error jobs highlighted (Amazement Build, Strategic Review, Polymarket Daily Report currently erroring)
- Mobile responsive
- `npm run build` passes
- Navigation includes Calendar link
