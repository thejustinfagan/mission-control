# Codex Task: Build Digital Office Screen for Mission Control

## Goal
A visual "virtual office" where each agent is represented by an avatar sitting at their desk/computer. When an agent is actively working, they're shown at their workstation with activity indicators. Idle agents are shown away from desk or in a break area.

## UI Design

### Page: `src/app/office/page.tsx`

### Office Layout (Isometric/Top-down pixel art style using CSS/SVG)

Create a stylized office floor plan using pure CSS (no external assets needed). Think retro pixel-art office or clean minimal SVG workspace.

#### Room Layout
```
┌─────────────────────────────────────────────┐
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐       │
│  │Barry│  │Codex│  │Scout│  │Analyst       │
│  │ 🎖️  │  │ 💻  │  │ 🔍  │  │ 📊  │       │
│  │[desk]│  │[desk]│  │[desk]│  │[desk]│       │
│  └─────┘  └─────┘  └─────┘  └─────┘       │
│                                             │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐       │
│  │Scribe│  │Design│  │DevOps│  │Auditor     │
│  │ ✍️  │  │ 🎨  │  │ 🔧  │  │ 🛡️  │       │
│  │[desk]│  │[desk]│  │[desk]│  │[desk]│       │
│  └─────┘  └─────┘  └─────┘  └─────┘       │
│                                             │
│  ☕ Break Room          📋 War Room          │
└─────────────────────────────────────────────┘
```

#### Each Workstation Shows:
1. **Agent avatar** — Large emoji or CSS-drawn character (circle with emoji face)
2. **Desk with monitor** — CSS-drawn desk shape with a small "screen" rectangle
3. **Name plate** — Agent name below desk
4. **Status light** — Colored dot on desk corner:
   - 🟢 Green pulse = actively working right now
   - 🔵 Blue solid = on-demand, ready
   - 🟡 Yellow = scheduled task running soon
   - ⚫ Gray = idle/sleeping
   - 🔴 Red = last task errored
5. **Activity text** — Small text below name: "Building task board..." or "Idle" or "Waiting for next scan..."
6. **Monitor screen** — Tiny representation of what they're working on:
   - Code lines animation (for Codex/DevOps)
   - Document icon (for Scribe)
   - Chart icon (for Analyst)
   - Search icon (for Scout)
   - Palette icon (for Designer)
   - Shield icon (for Auditor)
   - Dashboard icon (for Barry)

#### Agent Position States:
- **Working:** Avatar is AT the desk, facing the monitor. Monitor shows activity animation (blinking cursor, scrolling lines).
- **Idle:** Avatar is slightly transparent/dimmed at desk. Monitor is dark/screensaver.
- **In Break Room:** If idle for extended period, avatar moves to break room area (fun touch).
- **Error:** Avatar has a ❗ bubble above head. Desk has red glow.

### Animations (CSS only, no JS animation libraries needed)
- Working agents: subtle typing animation (small dots appearing near keyboard area)
- Monitor screens: gentle pulse/glow when active
- Status lights: green ones pulse slowly
- Hover over agent: card pops up with full status details

### Hover/Click Detail Card
When you hover or tap an agent, show an overlay card:
- Agent name + role
- Current task (if working): task title + duration
- Last completed task + when
- Model being used
- Session count today
- Success/error rate

### Data Source: `src/data/team.ts` (same as team page)
Add a `currentActivity` field that gets updated:
```typescript
export interface AgentStatus {
  id: string;
  name: string;
  emoji: string;
  role: string;
  state: "working" | "idle" | "error" | "scheduled";
  currentTask?: string;
  currentTaskStarted?: string;
  lastTask?: string;
  lastTaskCompleted?: string;
  lastTaskStatus?: "ok" | "error";
  model: string;
  sessionsToday: number;
  tasksCompletedToday: number;
}
```

### API: `src/app/api/office/route.ts`
- `GET /api/office` — returns current status of all agents
- For now, returns static data from team.ts
- Future: will be updated in real-time by Barry via POST

### Real-time Feel
- Auto-refresh every 30 seconds (simple `setInterval` + fetch)
- Show "Last updated: X seconds ago" in footer

### Mobile Layout
- On mobile: 2x4 grid of desks (smaller)
- Or: scrollable horizontal office view
- Tap to see agent detail (no hover on mobile)

### Navigation
- Add "Office" link to navigation (after Team, or replace Team since Office IS the team view)
- Actually: keep both. Team = detailed roster. Office = visual status at a glance.

### Fun Touches (if time allows)
- Barry's desk is slightly larger (corner office vibes)
- Break room has a coffee cup emoji
- War Room for when multiple agents collaborate on same task
- Small clock on wall showing current time
- "X agents working" counter in the room

## Acceptance Criteria
- Office page renders at /office
- All 8 agents shown at workstations
- Visual distinction between working/idle/error states
- Hover/tap shows agent detail card
- CSS-only animations (no heavy libraries)
- Auto-refreshes status
- Mobile responsive
- `npm run build` passes
- Navigation includes Office link
- Looks genuinely cool — this is the showpiece screen
