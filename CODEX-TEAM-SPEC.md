# Codex Task: Build Team Structure Screen for Mission Control

## Goal
Show Barry's agent team — the main agent plus all sub-agents that get spun up for specialized work. Organized by role with responsibilities and recent activity.

## Team Roster

### 🎖️ Barry — Chief of Staff
- **Role:** Orchestrator, project manager, quality reviewer
- **Model:** Claude Opus 4.6
- **Status:** Always on (main session)
- **Responsibilities:** Project tracking, decision-making, code review, deployment, user communication, research coordination
- **Tools:** All OpenClaw tools, Git, Railway, GitHub

### 💻 Codex — Senior Developer
- **Role:** Primary code writer, feature builder
- **Model:** GPT-5.3 Codex (via CLI subscription)
- **Status:** Spun up on demand
- **Responsibilities:** Write code (>15 lines), build features, fix bugs, refactor, run tests
- **Trigger:** Any coding task exceeding 15-line gate
- **Recent sessions:** tidy-crest, young-shoal, grand-cove, kind-forest, delta-comet

### 🔍 Scout — Research Analyst
- **Role:** Web research, competitive intelligence, data gathering
- **Model:** Claude Sonnet (isolated session)
- **Status:** Spun up for research tasks
- **Responsibilities:** FMCSA regulatory monitoring, truck parts market intel, Solana/ORE updates, Polymarket analysis, public data discovery
- **Trigger:** Heartbeat research cycles, ad-hoc research requests

### 📊 Analyst — Data & Strategy
- **Role:** Data analysis, report generation, strategy validation
- **Model:** Claude Sonnet (isolated session)
- **Status:** Spun up for analysis tasks
- **Responsibilities:** Polymarket daily reports, paper trading analysis, market opportunity scoring, fleet data analysis
- **Trigger:** Scheduled cron jobs, data analysis requests

### ✍️ Scribe — Technical Writer
- **Role:** Documentation, specs, reports, communications
- **Model:** Claude Haiku (isolated session)
- **Status:** Spun up for writing tasks
- **Responsibilities:** Product specs, README files, PR descriptions, morning briefings, status reports, email drafts
- **Trigger:** Documentation needs, report generation

### 🎨 Designer — UI/UX
- **Role:** Frontend design decisions, CSS, layout architecture
- **Model:** Codex or Claude (depending on task)
- **Status:** Spun up for UI work
- **Responsibilities:** Mobile-first layouts, component styling, UX improvements, responsive design
- **Trigger:** UI bugs, new feature UIs, mobile fixes

### 🔧 DevOps — Infrastructure
- **Role:** Deployment, CI/CD, database management, monitoring
- **Model:** Barry (inline) or Codex (complex infra)
- **Status:** Spun up for deploy/infra tasks
- **Responsibilities:** Railway deployments, GitHub Releases, DB migrations, Cloudflare tunnels, cron job management
- **Trigger:** Deployment needs, infrastructure issues

### 🛡️ Auditor — Security & Quality
- **Role:** Code review, security audit, skill vetting
- **Model:** Claude Opus (isolated session)
- **Status:** Spun up for review tasks
- **Responsibilities:** PR reviews, skill audit protocol, dependency scanning, API key checks, test verification
- **Trigger:** PR merges, new skill installs, security reviews

## UI Design

### Page: `src/app/team/page.tsx`

### Layout

#### Org Chart Header
- Barry at top (Chief of Staff) with avatar/emoji
- Lines connecting to sub-agents below
- Simple tree layout, not overly complex

#### Agent Cards (grid below org chart)
Each agent gets a card showing:
- **Avatar/Emoji** (large, top of card)
- **Name** (bold)
- **Role** (subtitle)
- **Model** (small badge)
- **Status indicator:** 🟢 Active | 🔵 On-demand | 🟡 Scheduled | 🔴 Error
- **Responsibilities** (bullet list, collapsible)
- **Recent Activity** (last 3 sessions/tasks, with timestamps)
- **Stats:** Tasks completed, last active, success rate

#### Team Summary Bar
- Total agents: 8
- Active now: X
- Tasks completed today: X
- Sessions spawned today: X

#### Filter/View Options
- View: Grid (default) | List
- Filter by role type: All | Developers | Writers | Analysts | Ops

### Data Source: `src/data/team.ts`
Static data file with the team roster above. Barry updates this file when team structure changes.

### Navigation
- Add "Team" link to navigation (after Memory)

### Styling
- Dark mode, glassmorphism cards
- Each agent card has a subtle color accent matching their role:
  - Developers: blue
  - Writers: green
  - Analysts: purple
  - Ops: orange
  - Security: red
- Mobile: cards stack in single column
- Org chart simplifies to a list on mobile

## Acceptance Criteria
- Team page renders at /team
- All 8 agents displayed with correct info
- Org chart shows hierarchy
- Agent cards show role, model, status, responsibilities
- Mobile responsive
- `npm run build` passes
- Navigation includes Team link
