import { NextResponse } from "next/server";

/**
 * Live Status API
 * 
 * GET  — Returns current status data
 * POST — Barry pushes updated status data
 * 
 * Uses global variable for persistence within the same Lambda instance,
 * plus falls back to a static snapshot for cold starts.
 */

const AUTH_TOKEN = process.env.MC_AUTH_TOKEN || "barry-update-2026";

// In-memory store (persists across warm invocations on same instance)
let statusData: any = null;

// Static fallback data embedded at build time
const STATIC_FALLBACK = {
  timestamp: "2026-03-16T12:09:00Z",
  summary: {
    totalProjects: 8,
    activeProjects: 3,
    blockedProjects: 1,
    staleProjects: 4,
    decisionsNeeded: 2,
    incompleteItems: 5,
  },
  projects: [
    {
      id: "battle-dinghy",
      name: "Battle Dinghy",
      status: "active",
      health: "degraded",
      description: "Multi-game X/Twitter bot — Battle Dinghy (5x5), Battle Chess (6x6), Sea Battle (10x10), Chess960, Connect4",
      lastActivity: "2026-03-14T18:00:00Z",
      deployment: "https://battledinghy-production-13ab.up.railway.app/",
      repo: "https://github.com/thejustinfagan/Battle_Dinghy",
      notes: "Stream listener running. Battle Dinghy works. Battle Chess deployed but untested live. Repo needs v2 cleanup.",
      blockers: ["X Simulator v2 APFS deadlocked", "Battle Chess needs live test", "In-memory DB loses games on redeploy"],
      priority: 1,
    },
    {
      id: "mission-control",
      name: "Mission Control",
      status: "active",
      health: "healthy",
      description: "Next.js dashboard for monitoring Barry activities, projects, tasks",
      lastActivity: "2026-03-16T12:09:00Z",
      deployment: "https://mission-control-rose-xi.vercel.app",
      repo: "https://github.com/thejustinfagan/mission-control",
      notes: "Deployed to Vercel. Push API for status updates.",
      blockers: [],
      priority: 2,
    },
    {
      id: "x-simulator-v2",
      name: "X Simulator v2",
      status: "blocked",
      health: "broken",
      description: "QA tool for visually verifying game bot threads before deploying to X",
      notes: "APFS deadlocked. Rebuild exists locally. Key part of Feature Automation Protocol.",
      blockers: ["APFS deadlock — needs Disk Utility Recovery Mode"],
      priority: 2,
    },
    {
      id: "fleet-intel",
      name: "Fleet Intel",
      status: "degraded",
      health: "degraded",
      description: "FMCSA carrier intelligence — facility analysis, batch enrichment",
      deployment: "https://fleetintel.net",
      repo: "https://github.com/thejustinfagan/fleet-intel",
      notes: "Railway deploy recovered. Batch runtime needs re-staging.",
      blockers: ["Batch runtime lost on reboot", "Health endpoint 404"],
      priority: 3,
    },
    {
      id: "polymarket-bot",
      name: "Polymarket Bot",
      status: "active",
      health: "healthy",
      description: "Whale tracker + daily intel digest for Polymarket",
      repo: "https://github.com/thejustinfagan/polymarket-bot",
      notes: "PR #1 open. 14 tests passing. Needs whale wallet addresses.",
      blockers: ["Need full whale wallet addresses"],
      priority: 4,
    },
    {
      id: "beast-mode",
      name: "Beast Mode",
      status: "paused",
      health: "healthy",
      description: "Infrastructure audit system — repo health, deploy monitoring",
      repo: "https://github.com/thejustinfagan/beast-mode",
      notes: "Cron disabled per Justin. Saved but not running.",
      blockers: [],
      priority: 8,
    },
    {
      id: "reseller-intel",
      name: "Reseller Intel",
      status: "stale",
      health: "degraded",
      description: "Auto reseller scraping and intelligence",
      repo: "https://github.com/thejustinfagan/reseller-intel",
      notes: "Scraper dead since March 8. Needs redeploy.",
      blockers: ["Needs redeploy"],
      priority: 6,
    },
    {
      id: "vin-intelligence",
      name: "VIN Intelligence",
      status: "stale",
      health: "healthy",
      description: "Vehicle identification number lookup and analysis",
      repo: "https://github.com/thejustinfagan/vin-intelligence",
      notes: "Smoke tests passing.",
      blockers: [],
      priority: 7,
    },
  ],
  incomplete: [
    "Battle Chess: verify game creation works on live X",
    "X Simulator v2: fix APFS deadlock or push rebuild to GitHub",
    "Feature Automation Protocol: document full pipeline",
    "Battle Dinghy v2: clean repo rewrite (69→~15 files)",
    "PostgreSQL migration: persistent DB on Railway",
  ],
  activities: [
    { time: "2026-03-16T12:09:00Z", type: "deploy", description: "Mission Control redeployed to Vercel", project: "mission-control", status: "success" },
    { time: "2026-03-16T11:13:00Z", type: "config", description: "Beast Mode cron disabled", project: "beast-mode", status: "success" },
    { time: "2026-03-14T18:00:00Z", type: "code", description: "Battle Chess board renderer — sprite pieces", project: "battle-dinghy", status: "success" },
    { time: "2026-03-14T01:00:00Z", type: "infra", description: "APFS repo recovery — 10/14 repos restored", project: "infrastructure", status: "success" },
    { time: "2026-03-13T11:40:00Z", type: "deploy", description: "Battle Dinghy deployed to Railway", project: "battle-dinghy", status: "success" },
    { time: "2026-03-13T01:28:00Z", type: "code", description: "Battle Chess game #1 on live X", project: "battle-dinghy", status: "success" },
  ],
  schedule: [
    { time: "08:00", name: "Morning Briefing", status: "active", frequency: "daily" },
    { time: "01:00", name: "Nightly Amazement Build", status: "active", frequency: "daily" },
    { time: "*/30 8-21", name: "Heartbeat Check", status: "active", frequency: "every 30 min" },
  ],
};

export async function GET() {
  const data = statusData || STATIC_FALLBACK;
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (token !== AUTH_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const previous = statusData || STATIC_FALLBACK;

    statusData = {
      ...previous,
      ...body,
      tasks: Array.isArray(body?.tasks) ? body.tasks : previous.tasks,
      schedule: Array.isArray(body?.schedule) ? body.schedule : previous.schedule,
      activities: Array.isArray(body?.activities) ? body.activities : previous.activities,
      timestamp: new Date().toISOString(),
      pushedBy: "barry",
    };

    return NextResponse.json({ success: true, timestamp: statusData.timestamp });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
