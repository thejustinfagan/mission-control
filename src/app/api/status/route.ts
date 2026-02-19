import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * Live Status API
 * 
 * GET  — Returns current status data
 * POST — Barry pushes updated status data (from workspace files)
 * 
 * Data stored in /tmp/mission-control-status.json on Railway
 * (persists across requests, cleared on redeploy)
 */

const STATUS_FILE = path.join("/tmp", "mission-control-status.json");
const AUTH_TOKEN = process.env.MC_AUTH_TOKEN || "barry-update-2026";

function readStatus(): any | null {
  try {
    const data = fs.readFileSync(STATUS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function writeStatus(data: any): boolean {
  try {
    fs.writeFileSync(STATUS_FILE, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error("Error writing status:", e);
    return false;
  }
}

export async function GET() {
  const data = readStatus();
  
  if (!data) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      summary: {
        totalProjects: 0,
        activeProjects: 0,
        blockedProjects: 0,
        staleProjects: 0,
        decisionsNeeded: 0,
        incompleteItems: 0,
      },
      projects: [],
      incomplete: [],
      todayLog: null,
      message: "No status data yet. Waiting for Barry to push an update."
    });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  // Simple auth
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  
  if (token !== AUTH_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const previous = readStatus() ?? {};

    const merged = {
      ...previous,
      ...body,
      tasks: Array.isArray(body?.tasks) ? body.tasks : previous.tasks,
      schedule: Array.isArray(body?.schedule) ? body.schedule : previous.schedule,
      activities: Array.isArray(body?.activities) ? body.activities : previous.activities,
    };

    // Add server timestamp
    merged.timestamp = new Date().toISOString();
    merged.pushedBy = "barry";

    if (writeStatus(merged)) {
      return NextResponse.json({ success: true, timestamp: merged.timestamp });
    } else {
      return NextResponse.json({ error: "Failed to store status" }, { status: 500 });
    }
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
