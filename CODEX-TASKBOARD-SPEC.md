# Codex Task: Build Task Board for Mission Control

## Goal
Add a real-time task board to Mission Control that tracks all active tasks, who they're assigned to (Justin or Barry), and their status.

## Live URL
https://mission-control-production-8b21.up.railway.app

## Current Architecture
- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Data in `src/data/projects.ts` (static file, updated by Barry)
- Deployed on Railway
- Components in `src/components/`
- Dark mode UI

## Task Board Requirements

### Data Model
Add to `src/data/tasks.ts`:
```typescript
export interface Task {
  id: string;
  title: string;
  description?: string;
  project: string; // project id (fleet-intel, battle-dinghy, etc.)
  assignee: "barry" | "justin" | "both";
  status: "todo" | "in-progress" | "blocked" | "done";
  priority: "critical" | "high" | "medium" | "low";
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  completedAt?: string;
  blockedReason?: string;
  tags?: string[]; // e.g. ["deploy", "bug", "feature"]
}
```

### Initial Tasks (populate from current INCOMPLETE.md)
Include ALL current active tasks. Here are the key ones:

**Fleet Intel:**
- [ ] Fix Reseller Intel client-side rendering error (barry, high)
- [ ] Deploy Territory Command Center to Railway (justin, medium) 
- [ ] Google Maps API key restriction (justin, medium)
- [ ] Route Planner drag behavior fix (barry, done - just deployed)
- [ ] Polk VIN data display in Fleet tab (barry, done - just deployed)
- [ ] Google Maps multi-stop routing (barry, done - just deployed)
- [ ] Export buttons visible on mobile (barry, done - just deployed)
- [ ] Full-screen expand for carrier detail (barry, done - just deployed)
- [ ] Merge feature/facility-scoreboard → main (barry, medium)
- [ ] Batch enrichment: 145/14,472 remaining (barry, low)

**Battle Dinghy:**
- [ ] Game state persistence mechanism (barry, medium)
- [ ] Turn-based game mechanics (barry, medium)

**DC Land Intel:**
- [ ] User verification of mobile experience (justin, high)
- [ ] Download remaining datasets (HIFLD, RTO queues, USDA) (barry, low)

**Polymarket:**
- [ ] Resolve open positions - 273 open (barry, low)

**Public Data:**
- [ ] Apply 3-question filter to top niche opportunities (barry, medium)

**AI Calibration:**
- [ ] Resume calibration: ChatGPT, Gemini, Claude (barry, low)

### UI Components

#### 1. Task Board Page (`src/app/tasks/page.tsx`)
- Kanban-style board with 4 columns: Todo | In Progress | Blocked | Done
- Each task card shows:
  - Title (bold)
  - Project name (colored badge matching project)
  - Assignee avatar/badge: 🤖 Barry | 👤 Justin | 👥 Both
  - Priority indicator: 🔴 Critical | 🟠 High | 🟡 Medium | ⚪ Low
  - Tags as small pills
  - Updated timestamp
- Cards are color-coded by project
- Done column shows completed tasks (collapsible, last 10)

#### 2. Filters
- Filter by assignee: All | Justin | Barry
- Filter by project: All | [each project]
- Filter by priority: All | Critical | High | Medium | Low
- Search box for task titles

#### 3. Task Summary Header
- Total tasks: X
- Justin's tasks: X (Y blocked)
- Barry's tasks: X (Y in progress)
- Completed today: X

#### 4. Navigation
- Add "Tasks" link to the navigation component (`src/components/navigation.tsx`)
- Should be the second item after Dashboard

### API Endpoints
- `GET /api/tasks` — returns all tasks (with optional filters: assignee, project, status)
- `POST /api/tasks` — create new task
- `PATCH /api/tasks/[id]` — update task status/fields

For now, tasks are stored in `src/data/tasks.ts` as a static array (Barry updates this file).
The API reads from this file. Future: migrate to a database.

### Styling
- Match existing dark mode theme
- Use glassmorphism cards like the rest of the dashboard
- Mobile responsive — cards stack vertically on mobile
- Smooth transitions when filtering

## Acceptance Criteria
- Task board page renders at /tasks
- All current tasks from INCOMPLETE.md are populated
- Filter by assignee works (Justin can see just his tasks)
- Filter by project works
- Priority sorting works
- Navigation includes Tasks link
- Mobile responsive
- `npm run build` passes
- Looks good on dark background

## Files to Create/Modify
- CREATE: `src/data/tasks.ts`
- CREATE: `src/app/tasks/page.tsx`
- CREATE: `src/components/task-board.tsx`
- MODIFY: `src/components/navigation.tsx` (add Tasks link)
- CREATE: `src/app/api/tasks/route.ts`
