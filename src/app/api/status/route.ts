import { NextResponse } from "next/server";
import { verifyAgentAuth } from "@/lib/truth/auth";
import { readAgentStatusSnapshot, saveAgentStatusSnapshot } from "@/lib/truth/registry-store";
import { appendActivity } from "@/lib/truth/activity-store";

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
      deployment: "https://web-production-2c48a.up.railway.app",
      repo: "https://github.com/thejustinfagan/mission-control",
      notes: "Deployed to Railway. Push API for status updates.",
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
  ] as unknown[],
  activities: [
    { time: "2026-03-16T12:09:00Z", type: "deploy", description: "Mission Control redeployed to Railway", project: "mission-control", status: "success" },
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

interface IncompleteRow {
  project: string;
  completed: boolean;
  task: string;
}

/**
 * Normalize the `incomplete` field into object rows. The legacy static fallback
 * stores incomplete items as bare strings; older shapes mixed strings and
 * objects. Downstream consumers expect { project, completed, task }. Bare
 * strings are attributed to "Legacy STATUS.md" so their non-live origin is
 * explicit and never rendered as a blank/undefined row.
 */
function normalizeIncomplete(incomplete: unknown): IncompleteRow[] {
  if (!Array.isArray(incomplete)) return [];
  return incomplete
    .map((item): IncompleteRow | null => {
      if (typeof item === "string") {
        const task = item.trim();
        if (!task) return null;
        return { project: "Legacy STATUS.md", completed: false, task };
      }
      if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;
        const task = typeof obj.task === "string" ? obj.task.trim() : "";
        if (!task) return null;
        return {
          project: typeof obj.project === "string" && obj.project.trim() ? obj.project : "Legacy STATUS.md",
          completed: obj.completed === true,
          task,
        };
      }
      return null;
    })
    .filter((row): row is IncompleteRow => row !== null);
}

/** Normalize the whole payload so the legacy shape is never broken/incomplete. */
function normalizeStatus(data: Record<string, unknown>, servingFallback: boolean) {
  const normalized: Record<string, unknown> = {
    ...data,
    incomplete: normalizeIncomplete(data.incomplete),
  };
  if (servingFallback) {
    normalized.sourceWarning =
      "Serving static fallback snapshot from 2026-03-16. This is stale and NOT live evidence. See /api/mission-control for the evidence-backed truth snapshot.";
    normalized.isFallback = true;
  }
  return normalized;
}

export async function GET() {
  const stored = readAgentStatusSnapshot();
  const servingFallback = !stored;
  const data = (stored || STATIC_FALLBACK) as Record<string, unknown>;
  return NextResponse.json(normalizeStatus(data, servingFallback));
}

export async function POST(request: Request) {
  if (!verifyAgentAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const previous = readAgentStatusSnapshot() || STATIC_FALLBACK;

    const merged = {
      ...previous,
      ...body,
      tasks: Array.isArray(body?.tasks) ? body.tasks : (previous as { tasks?: unknown }).tasks,
      schedule: Array.isArray(body?.schedule) ? body.schedule : (previous as { schedule?: unknown }).schedule,
      activities: Array.isArray(body?.activities) ? body.activities : (previous as { activities?: unknown }).activities,
      timestamp: new Date().toISOString(),
      pushedBy: "barry",
    };

    saveAgentStatusSnapshot(merged);

    // Ingest pushed activities into SQLite proof feed
    if (Array.isArray(body?.activities)) {
      for (const act of body.activities.slice(0, 20)) {
        if (!act?.description || !act?.project) continue;
        await appendActivity({
          actionType: act.type || act.actionType || "work",
          description: act.description,
          project: act.project,
          status: act.status === "failed" ? "failed" : "success",
          agentId: "barry",
          timestamp: act.time || act.timestamp,
        }).catch(() => undefined);
      }
    }

    return NextResponse.json({ success: true, timestamp: merged.timestamp });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
