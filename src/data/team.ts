export type AgentState = "working" | "idle" | "error" | "scheduled";
export type AgentStatusIndicator = "active" | "on-demand" | "scheduled" | "error";
export type RoleGroup = "developers" | "writers" | "analysts" | "ops";
export type RoleAccent = "developer" | "writer" | "analyst" | "ops" | "security";

export interface AgentStatus {
  id: string;
  name: string;
  emoji: string;
  role: string;
  state: AgentState;
  currentActivity?: string;
  currentTask?: string;
  currentTaskStarted?: string;
  lastTask?: string;
  lastTaskCompleted?: string;
  lastTaskStatus?: "ok" | "error";
  model: string;
  sessionsToday: number;
  tasksCompletedToday: number;
}

export interface AgentActivity {
  label: string;
  timestamp: string;
}

export interface AgentStats {
  tasksCompleted: number;
  lastActive: string;
  successRate: number;
}

export interface AgentProfile extends AgentStatus {
  status: AgentStatusIndicator;
  roleGroup: RoleGroup;
  accent: RoleAccent;
  responsibilities: string[];
  recentActivity: AgentActivity[];
  stats: AgentStats;
}

const FEB_18 = "2026-02-18T18:30:00Z";
const FEB_18_LATE = "2026-02-18T22:45:00Z";
const FEB_19_EARLY = "2026-02-19T06:20:00Z";
const FEB_19_MORNING = "2026-02-19T09:10:00Z";
const FEB_19_MIDDAY = "2026-02-19T12:05:00Z";
const FEB_19_AFTERNOON = "2026-02-19T15:40:00Z";
const FEB_19_EVENING = "2026-02-19T18:15:00Z";

export const teamAgents: AgentProfile[] = [
  {
    id: "barry",
    name: "Barry",
    emoji: "🎖️",
    role: "Chief of Staff",
    model: "Claude Opus 4.6",
    status: "active",
    state: "working",
    currentActivity: "Coordinating Mission Control roadmap",
    roleGroup: "ops",
    accent: "ops",
    responsibilities: [
      "Project tracking",
      "Decision-making",
      "Code review",
      "Deployment oversight",
      "User communication",
      "Research coordination",
    ],
    recentActivity: [
      { label: "Cleared blocker on Fleet Intel merge", timestamp: FEB_19_MIDDAY },
      { label: "Reviewed deployment checklist", timestamp: FEB_19_MORNING },
      { label: "Prioritized agent run queue", timestamp: FEB_19_EARLY },
    ],
    stats: {
      tasksCompleted: 148,
      lastActive: FEB_19_AFTERNOON,
      successRate: 98.4,
    },
    currentTask: "Coordinating Mission Control roadmap",
    currentTaskStarted: FEB_19_MIDDAY,
    lastTask: "Approved task board deployment",
    lastTaskCompleted: FEB_19_MORNING,
    lastTaskStatus: "ok",
    sessionsToday: 7,
    tasksCompletedToday: 12,
  },
  {
    id: "codex",
    name: "Codex",
    emoji: "💻",
    role: "Senior Developer",
    model: "GPT-5.3 Codex",
    status: "active",
    state: "working",
    currentActivity: "Building Team structure UI",
    roleGroup: "developers",
    accent: "developer",
    responsibilities: [
      "Write code for new features",
      "Fix bugs and regressions",
      "Refactor modules",
      "Run tests and builds",
      "Ship production-ready UI",
    ],
    recentActivity: [
      { label: "Session tidy-crest shipped roster view", timestamp: FEB_19_MORNING },
      { label: "Session young-shoal cleared UI bugs", timestamp: FEB_18_LATE },
      { label: "Session grand-cove stabilized build", timestamp: FEB_18 },
    ],
    stats: {
      tasksCompleted: 96,
      lastActive: FEB_19_AFTERNOON,
      successRate: 97.1,
    },
    currentTask: "Building Team structure UI",
    currentTaskStarted: FEB_19_MORNING,
    lastTask: "Resolved styling regression",
    lastTaskCompleted: FEB_18_LATE,
    lastTaskStatus: "ok",
    sessionsToday: 4,
    tasksCompletedToday: 8,
  },
  {
    id: "scout",
    name: "Scout",
    emoji: "🔍",
    role: "Research Analyst",
    model: "Claude Sonnet",
    status: "scheduled",
    state: "scheduled",
    currentActivity: "Preparing regulatory scan",
    roleGroup: "analysts",
    accent: "analyst",
    responsibilities: [
      "FMCSA regulatory monitoring",
      "Truck parts market intel",
      "Solana and ORE updates",
      "Polymarket analysis",
      "Public data discovery",
    ],
    recentActivity: [
      { label: "Compiled Solana research brief", timestamp: FEB_19_EARLY },
      { label: "Captured market intel snapshot", timestamp: FEB_18_LATE },
      { label: "Updated FMCSA watchlist", timestamp: FEB_18 },
    ],
    stats: {
      tasksCompleted: 62,
      lastActive: FEB_19_EARLY,
      successRate: 95.6,
    },
    currentTask: "Preparing regulatory scan",
    currentTaskStarted: FEB_19_EVENING,
    lastTask: "Delivered competitive intel memo",
    lastTaskCompleted: FEB_18_LATE,
    lastTaskStatus: "ok",
    sessionsToday: 2,
    tasksCompletedToday: 3,
  },
  {
    id: "analyst",
    name: "Analyst",
    emoji: "📊",
    role: "Data and Strategy",
    model: "Claude Sonnet",
    status: "active",
    state: "working",
    currentActivity: "Generating Polymarket summary",
    roleGroup: "analysts",
    accent: "analyst",
    responsibilities: [
      "Polymarket daily reports",
      "Paper trading analysis",
      "Market opportunity scoring",
      "Fleet data analysis",
    ],
    recentActivity: [
      { label: "Scored market opportunities", timestamp: FEB_19_MIDDAY },
      { label: "Updated daily trading report", timestamp: FEB_19_MORNING },
      { label: "Validated fleet KPI model", timestamp: FEB_18_LATE },
    ],
    stats: {
      tasksCompleted: 78,
      lastActive: FEB_19_MIDDAY,
      successRate: 96.3,
    },
    currentTask: "Generating Polymarket summary",
    currentTaskStarted: FEB_19_MIDDAY,
    lastTask: "Published daily report",
    lastTaskCompleted: FEB_19_MORNING,
    lastTaskStatus: "ok",
    sessionsToday: 3,
    tasksCompletedToday: 5,
  },
  {
    id: "scribe",
    name: "Scribe",
    emoji: "✍️",
    role: "Technical Writer",
    model: "Claude Haiku",
    status: "on-demand",
    state: "idle",
    currentActivity: "Idle",
    roleGroup: "writers",
    accent: "writer",
    responsibilities: [
      "Product specs",
      "README files",
      "PR descriptions",
      "Morning briefings",
      "Status reports",
      "Email drafts",
    ],
    recentActivity: [
      { label: "Drafted weekly status memo", timestamp: FEB_18_LATE },
      { label: "Polished product spec", timestamp: FEB_18 },
      { label: "Prepared morning briefing", timestamp: FEB_18 },
    ],
    stats: {
      tasksCompleted: 54,
      lastActive: FEB_18_LATE,
      successRate: 99.2,
    },
    currentTask: "Idle",
    currentTaskStarted: FEB_18_LATE,
    lastTask: "Shipped briefing deck",
    lastTaskCompleted: FEB_18_LATE,
    lastTaskStatus: "ok",
    sessionsToday: 1,
    tasksCompletedToday: 2,
  },
  {
    id: "designer",
    name: "Designer",
    emoji: "🎨",
    role: "UI and UX",
    model: "Codex or Claude",
    status: "on-demand",
    state: "idle",
    currentActivity: "Idle",
    roleGroup: "developers",
    accent: "developer",
    responsibilities: [
      "Mobile-first layouts",
      "Component styling",
      "UX improvements",
      "Responsive design",
    ],
    recentActivity: [
      { label: "Reviewed responsive layout", timestamp: FEB_18_LATE },
      { label: "Designed new card variants", timestamp: FEB_18 },
      { label: "Resolved UI polish requests", timestamp: FEB_18 },
    ],
    stats: {
      tasksCompleted: 41,
      lastActive: FEB_18_LATE,
      successRate: 97.8,
    },
    currentTask: "Idle",
    currentTaskStarted: FEB_18_LATE,
    lastTask: "Delivered UI refactor notes",
    lastTaskCompleted: FEB_18_LATE,
    lastTaskStatus: "ok",
    sessionsToday: 1,
    tasksCompletedToday: 1,
  },
  {
    id: "devops",
    name: "DevOps",
    emoji: "🔧",
    role: "Infrastructure",
    model: "Barry or Codex",
    status: "scheduled",
    state: "scheduled",
    currentActivity: "Scheduled deploy window",
    roleGroup: "ops",
    accent: "ops",
    responsibilities: [
      "Railway deployments",
      "GitHub releases",
      "Database migrations",
      "Cloudflare tunnels",
      "Cron job management",
    ],
    recentActivity: [
      { label: "Rotated environment secrets", timestamp: FEB_19_EARLY },
      { label: "Prepared release checklist", timestamp: FEB_18_LATE },
      { label: "Monitored job queues", timestamp: FEB_18 },
    ],
    stats: {
      tasksCompleted: 66,
      lastActive: FEB_19_EARLY,
      successRate: 96.9,
    },
    currentTask: "Scheduled deploy window",
    currentTaskStarted: FEB_19_EVENING,
    lastTask: "Completed CI rollout",
    lastTaskCompleted: FEB_19_EARLY,
    lastTaskStatus: "ok",
    sessionsToday: 2,
    tasksCompletedToday: 3,
  },
  {
    id: "auditor",
    name: "Auditor",
    emoji: "🛡️",
    role: "Security and Quality",
    model: "Claude Opus",
    status: "error",
    state: "error",
    currentActivity: "Investigating failed dependency scan",
    roleGroup: "ops",
    accent: "security",
    responsibilities: [
      "PR reviews",
      "Skill audit protocol",
      "Dependency scanning",
      "API key checks",
      "Test verification",
    ],
    recentActivity: [
      { label: "Flagged dependency CVE", timestamp: FEB_19_EARLY },
      { label: "Completed test verification", timestamp: FEB_18_LATE },
      { label: "Audited new skill install", timestamp: FEB_18 },
    ],
    stats: {
      tasksCompleted: 59,
      lastActive: FEB_19_EARLY,
      successRate: 94.8,
    },
    currentTask: "Investigating failed dependency scan",
    currentTaskStarted: FEB_19_EARLY,
    lastTask: "Ran security review",
    lastTaskCompleted: FEB_18_LATE,
    lastTaskStatus: "error",
    sessionsToday: 2,
    tasksCompletedToday: 1,
  },
];
