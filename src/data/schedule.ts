// Schedule data — synced from live OpenClaw cron jobs
// Last updated: 2026-03-31 by Barry (Nightly Amazement Build)

export interface ScheduledJob {
  id: string;
  name: string;
  schedule: string;
  cronExpr: string;
  timezone: string;
  enabled: boolean;
  category: "briefing" | "polymarket" | "maintenance" | "build" | "research";
  description: string;
  lastRun?: string;
  lastStatus?: "ok" | "error";
  lastError?: string;
  nextRun?: string;
}

export const scheduledJobs: ScheduledJob[] = [
  {
    id: "amazement-build",
    name: "Nightly Amazement Build",
    schedule: "Daily at 1:00 AM CT",
    cronExpr: "0 1 * * *",
    timezone: "America/Chicago",
    enabled: true,
    category: "build",
    description: "Barry builds something amazing while Justin sleeps. Picks high-impact items from STATUS.md/INCOMPLETE.md, writes code, creates PRs.",
    lastStatus: "error",
    lastError: "Message delivery failed on last run",
  },
  {
    id: "morning-briefing",
    name: "Morning Briefing",
    schedule: "Daily at 5:00 AM CT",
    cronExpr: "0 5 * * *",
    timezone: "America/Chicago",
    enabled: true,
    category: "briefing",
    description: "Generates morning briefing for Justin: overnight accomplishments, project status, blockers, to-dos, and recommendations.",
    lastStatus: "ok",
  },
  {
    id: "polymarket-scanner",
    name: "Polymarket Scanner",
    schedule: "Every 30 minutes",
    cronExpr: "*/30 * * * *",
    timezone: "America/Chicago",
    enabled: true,
    category: "polymarket",
    description: "Scans Polymarket for opportunities. Runs scanner_cron.py with max 10 pages, reports markets fetched and top 3 opportunities.",
    lastStatus: "ok",
  },
  {
    id: "battle-dinghy-health",
    name: "Battle Dinghy Health Check",
    schedule: "Daily at 1:00 PM CT",
    cronExpr: "0 13 * * *",
    timezone: "America/Chicago",
    enabled: true,
    category: "maintenance",
    description: "Checks Battle Dinghy bot health on Railway: error logs, active game threads, stream listener status.",
    lastStatus: "error",
    lastError: "Job execution timed out",
  },
  {
    id: "mc-status-update",
    name: "Mission Control Status Update",
    schedule: "Daily at 5:00 PM CT",
    cronExpr: "0 17 * * *",
    timezone: "America/Chicago",
    enabled: true,
    category: "maintenance",
    description: "Pushes fresh project status JSON to Mission Control dashboard API.",
    lastStatus: "error",
    lastError: "Job execution timed out",
  },
  {
    id: "fleet-enrichment",
    name: "Fleet Intel Batch Enrichment",
    schedule: "Weekends at 2:00 AM CT",
    cronExpr: "0 2 * * 6,0",
    timezone: "America/Chicago",
    enabled: true,
    category: "maintenance",
    description: "Runs batch facility analysis on Fleet Intel FMCSA data. Rate-limited to 12 RPM / 750 RPD.",
    lastStatus: "ok",
  },
  {
    id: "game-library-qa",
    name: "Game Library QA Sweep",
    schedule: "Saturdays at 10:00 AM CT",
    cronExpr: "0 10 * * 6",
    timezone: "America/Chicago",
    enabled: true,
    category: "maintenance",
    description: "Comprehensive QA on all Battle Dinghy game types: battleship, chess, chess960. Generates test report.",
    lastStatus: "ok",
  },
  {
    id: "ai-whiteboard",
    name: "AI Whiteboard MVP Completion",
    schedule: "Fridays at 12:00 AM CT",
    cronExpr: "0 0 * * 5",
    timezone: "America/Chicago",
    enabled: true,
    category: "build",
    description: "Continues AI Whiteboard MVP: tldraw frontend, Claude API integration, deploy to Vercel/Railway.",
    lastStatus: "ok",
  },
];
