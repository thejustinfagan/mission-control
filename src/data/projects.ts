// Project data - synced from STATUS.md + workspace reality
// Last updated: 2026-03-31 by Barry (Nightly Amazement Build)

export interface ProjectFile {
  name: string;
  path: string;
  description?: string;
}

export interface ProjectAction {
  label: string;
  owner: "barry" | "justin";
  priority: "high" | "medium" | "low";
  completed?: boolean;
}

export interface ProjectMetric {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "flat";
}

export interface Project {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  stage: "production" | "testing" | "development" | "planning" | "research" | "archived";
  priority: number;
  status: string;
  lastWorked: string;
  liveUrl?: string;
  repoUrl?: string;
  localPath?: string;
  
  currentMilestone: string;
  progress?: number;
  nextActions: ProjectAction[];
  blockers: string[];
  needsDecision?: { question: string; options?: string[] };
  
  metrics?: ProjectMetric[];
  revenueStatus?: {
    current: number;
    potential: number;
    currency: string;
  };
  
  techStack?: string[];
  keyFiles?: ProjectFile[];
  
  recentUpdates?: string[];
  keyDecisions?: { date: string; decision: string }[];
}

export const projects: Project[] = [
  // ============ PRODUCTION ============
  {
    id: "fleet-intel",
    name: "Fleet Intel",
    emoji: "🚛",
    tagline: "FMCSA carrier intelligence with AI analysis & route planning",
    stage: "production",
    priority: 1,
    status: "Deployed on Railway — Free tool (no billing)",
    lastWorked: "2026-03-30",
    repoUrl: "https://github.com/thejustinfagan/fleet-intel",
    localPath: "~/dev/fleet-intel",

    currentMilestone: "Core features shipped — CRM, route planner, VIN upload, crash detail",
    progress: 90,
    nextActions: [
      { label: "Add persisted lead history (DB + auth)", owner: "barry", priority: "medium" },
      { label: "Add benchmarking dashboards for safety trends", owner: "barry", priority: "low" },
      { label: "Set up Google Maps API key for production", owner: "justin", priority: "medium" },
    ],
    blockers: [],

    metrics: [
      { label: "API Routes", value: 27, trend: "up" },
      { label: "Components", value: 16, trend: "up" },
      { label: "Features", value: "Search, CRM, Routes, VIN, Maps, Reports" },
    ],

    techStack: ["Next.js 14", "TypeScript", "Prisma", "PostgreSQL", "Tailwind", "Leaflet", "Railway"],
    keyFiles: [
      { name: "Workstation", path: "components/workstation.tsx", description: "Main UI" },
      { name: "Route Planner", path: "components/route-planner.tsx" },
      { name: "VIN Uploader", path: "components/vin-uploader-enhanced.tsx" },
    ],

    recentUpdates: [
      "2026-03-30: Removed Stripe billing — free product decision",
      "2026-03-30: Battle Dinghy i18n strategy created",
      "2026-03-24: Route planner drag fix + Polk VIN display shipped",
      "2026-03-24: Google Maps multi-stop routing added",
    ],
    keyDecisions: [
      { date: "2026-03-30", decision: "No subscription billing — Fleet Intel stays free" },
      { date: "2026-02-08", decision: "Cloudflare Tunnel → Railway for deployment" },
    ],
  },

  {
    id: "battle-dinghy",
    name: "Battle Dinghy",
    emoji: "⚔️",
    tagline: "Multi-game Twitter bot (Game Factory)",
    stage: "production",
    priority: 2,
    status: "Production — ThreadChess integration ready",
    lastWorked: "2026-03-30",
    liveUrl: "https://twitter.com/BattleDinghy",
    repoUrl: "https://github.com/thejustinfagan/Battle_Dinghy",
    localPath: "~/dev/Battle_Dinghy",

    currentMilestone: "i18n strategy planned, ThreadChess PR ready",
    progress: 85,
    nextActions: [
      { label: "Merge PR #3 (ThreadChess integration)", owner: "justin", priority: "high" },
      { label: "Implement i18n with JSON translation files", owner: "barry", priority: "medium" },
      { label: "Add Baseball Showdown as third game", owner: "barry", priority: "low" },
    ],
    blockers: [],

    metrics: [
      { label: "Games Supported", value: 2, trend: "flat" },
      { label: "Languages Planned", value: "EN, ES, FR, JA" },
    ],

    techStack: ["Python", "Tweepy", "Pillow", "Railway"],
    keyFiles: [
      { name: "i18n Strategy", path: "I18N_STRATEGY.md", description: "Multi-language support plan" },
      { name: "Main Polling", path: "main_polling.py" },
      { name: "Game Detector", path: "game_type_detector.py" },
    ],

    recentUpdates: [
      "2026-03-30: i18n strategy created (lightweight JSON-based)",
      "2026-02-09: ThreadChess integration complete",
    ],
    keyDecisions: [
      { date: "2026-03-30", decision: "Lightweight JSON i18n — no heavy frameworks or APIs" },
      { date: "2026-02-09", decision: "ThreadChess via Battle Dinghy (one bot, multiple games)" },
    ],
  },

  {
    id: "beast-mode",
    name: "Beast Mode Audit",
    emoji: "🦁",
    tagline: "Autonomous infrastructure health monitoring for multi-repo environments",
    stage: "production",
    priority: 2,
    status: "v0.16.0 — 55 test files, CI green",
    lastWorked: "2026-03-16",
    repoUrl: "https://github.com/thejustinfagan/beast-mode",
    localPath: "~/dev/beast-mode",

    currentMilestone: "Full CI pipeline, GitHub Actions, dashboard generation",
    progress: 95,
    nextActions: [
      { label: "Fix GitHub Actions minutes (billing or make public)", owner: "justin", priority: "high" },
      { label: "Add more deploy targets to monitoring", owner: "barry", priority: "low" },
    ],
    blockers: ["GitHub Actions free-tier minutes exhausted — CI runners don't allocate"],

    metrics: [
      { label: "Version", value: "v0.16.0" },
      { label: "Test Files", value: 55, trend: "up" },
      { label: "CLI Flags", value: "15+" },
      { label: "Output Formats", value: "oneline, multiline, json, env" },
    ],

    techStack: ["Bash", "Python", "Make", "GitHub Actions"],
    keyFiles: [
      { name: "Main Wrapper", path: "beast-mode-audit.sh" },
      { name: "Repo Audit", path: "repo-audit.sh" },
      { name: "Cron Health", path: "check-cron-health.sh" },
      { name: "Dashboard Gen", path: "generate-dashboard.sh" },
    ],

    recentUpdates: [
      "2026-03-16: CI runner fix attempted (ubuntu-latest), billing root cause identified",
      "2026-03-15: First green CI build, make test-fast, symlink fixes",
      "2026-03-14: Pushed to GitHub, first real release (v0.13.0)",
      "2026-03-13: Rebuilt from scratch after APFS data loss",
    ],
    keyDecisions: [
      { date: "2026-03-14", decision: "All project files in git repos (lesson from data loss)" },
      { date: "2026-03-13", decision: "Singleton lock + process guards after fork bomb incident" },
    ],
  },

  {
    id: "mission-control",
    name: "Mission Control",
    emoji: "🎛️",
    tagline: "Project dashboard, calendar, task board, and activity tracker",
    stage: "production",
    priority: 2,
    status: "Live on Railway — 8 pages",
    lastWorked: "2026-03-31",
    liveUrl: "https://mission-control-production-8b21.up.railway.app",
    repoUrl: "https://github.com/thejustinfagan/mission-control",
    localPath: "~/dev/mission-control",

    currentMilestone: "Projects page + data refresh (Nightly Build 2026-03-31)",
    progress: 80,
    nextActions: [
      { label: "Deploy projects page update", owner: "barry", priority: "high" },
      { label: "Wire live data push from Barry's heartbeat", owner: "barry", priority: "medium" },
      { label: "Add project detail/drill-down pages", owner: "barry", priority: "medium" },
    ],
    blockers: [],

    metrics: [
      { label: "Pages", value: 9, trend: "up" },
      { label: "Components", value: 8 },
      { label: "API Routes", value: "status, schedule, tasks" },
    ],

    techStack: ["Next.js 14", "TypeScript", "Tailwind", "Railway"],
    keyFiles: [
      { name: "Dashboard", path: "src/components/justin-dashboard.tsx" },
      { name: "Navigation", path: "src/components/navigation.tsx" },
      { name: "Projects Data", path: "src/data/projects.ts" },
      { name: "Tasks Data", path: "src/data/tasks.ts" },
    ],

    recentUpdates: [
      "2026-03-31: Projects page built + all data refreshed to current state",
      "2026-03-16: Beast Mode health dashboard added",
      "2026-03-16: Intel dashboard added",
    ],
  },

  {
    id: "x-simulator",
    name: "X Simulator",
    emoji: "🎮",
    tagline: "Real-time casino game simulation platform",
    stage: "development",
    priority: 3,
    status: "v3 in development",
    lastWorked: "2026-03-28",
    localPath: "~/projects/x-simulator-v3",

    currentMilestone: "v3 architecture — multi-app with shared packages",
    progress: 40,
    nextActions: [
      { label: "Continue v3 feature development", owner: "barry", priority: "medium" },
    ],
    blockers: [],

    techStack: ["Python", "SQLite"],
  },

  {
    id: "public-data",
    name: "License Reminders",
    emoji: "🔍",
    tagline: "Texas + Florida professional license renewal alerts",
    stage: "production",
    priority: 3,
    status: "Launch Ready — Both States",
    lastWorked: "2026-02-09",
    liveUrl: "https://thejustinfagan.github.io/texas-license-reminders/",

    currentMilestone: "Landing pages deployed, outreach templates ready",
    progress: 95,
    nextActions: [
      { label: "Set up Formspree for TX + FL landing pages", owner: "justin", priority: "high" },
      { label: "Send 3 CE provider emails (templates ready)", owner: "justin", priority: "high" },
      { label: "Send Florida public records request for emails", owner: "justin", priority: "medium" },
    ],
    blockers: [],

    metrics: [
      { label: "Texas Licenses", value: "110K" },
      { label: "Texas Expiring 60d", value: "12,806" },
      { label: "Florida Licenses", value: "325K" },
      { label: "Florida Expiring 60d", value: "58,425" },
    ],
    revenueStatus: { current: 0, potential: 425000, currency: "USD" },

    techStack: ["Python", "SQLite", "GitHub Pages"],
  },

  {
    id: "polymarket",
    name: "Polymarket Scanner",
    emoji: "📊",
    tagline: "Whale wallet tracking + paper trading",
    stage: "testing",
    priority: 4,
    status: "Paper Trading — Validation Phase",
    lastWorked: "2026-03-27",
    localPath: "~/dev/polymarket-dashboard",

    currentMilestone: "Paper trading + daily signals running via cron",
    progress: 35,
    nextActions: [
      { label: "Continue paper trading validation (4-6 weeks)", owner: "barry", priority: "medium" },
      { label: "Resolve 273 open positions", owner: "barry", priority: "low" },
    ],
    blockers: [],

    metrics: [
      { label: "Open Positions", value: 273 },
      { label: "Cron Jobs", value: "6 (daily signals, reports, whale alerts)" },
    ],

    techStack: ["Python", "SQLite"],
  },

  {
    id: "dc-land-intel",
    name: "DC Land Intel",
    emoji: "🏛️",
    tagline: "DC property and land intelligence platform",
    stage: "development",
    priority: 4,
    status: "Mobile experience needs verification",
    lastWorked: "2026-03-19",
    localPath: "~/dev/dc-land-intel",

    currentMilestone: "Core data loaded, mobile UX pending verification",
    progress: 50,
    nextActions: [
      { label: "Verify mobile experience", owner: "justin", priority: "high" },
      { label: "Download remaining datasets (HIFLD, RTO, USDA)", owner: "barry", priority: "low" },
    ],
    blockers: [],

    techStack: ["Next.js", "TypeScript", "Leaflet"],
  },
];

export function getProject(id: string): Project | undefined {
  return projects.find(p => p.id === id);
}

export function getJustinActions(): { project: Project; action: ProjectAction }[] {
  const actions: { project: Project; action: ProjectAction }[] = [];
  for (const project of projects) {
    for (const action of project.nextActions) {
      if (action.owner === "justin" && !action.completed) {
        actions.push({ project, action });
      }
    }
  }
  return actions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.action.priority] - priorityOrder[b.action.priority];
  });
}
