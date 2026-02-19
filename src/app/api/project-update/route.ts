import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function normalizeProjectName(name: string): string {
  // Convert kebab-case CLI names to display names
  const mapping: Record<string, string> = {
    "fleet-intel": "Fleet Intel",
    "mission-control": "Mission Control", 
    "reseller-intel": "Reseller Intel",
    "territory-command-center": "Territory Command Center",
    "battle-dinghy": "Battle Dinghy",
    "dc-land-intel": "DC Land Intel",
    "polymarket": "Polymarket",
    "public-data-research": "Public Data Research",
    "ai-calibration": "AI Calibration"
  };
  return mapping[name] || name;
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (token !== AUTH_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    if (body.action !== "update_project" || !body.project || !body.updates) {
      return NextResponse.json({ 
        error: "Invalid request. Expected: action=update_project, project, updates" 
      }, { status: 400 });
    }

    const currentData = readStatus();
    if (!currentData || !currentData.projects) {
      return NextResponse.json({ 
        error: "No current status data found. Run status push first." 
      }, { status: 500 });
    }

    // Find project and update it
    const projectDisplayName = normalizeProjectName(body.project);
    const projectIndex = currentData.projects.findIndex((p: any) => 
      p.name === projectDisplayName
    );

    if (projectIndex === -1) {
      return NextResponse.json({ 
        error: `Project '${projectDisplayName}' not found` 
      }, { status: 404 });
    }

    // Update project fields
    const project = currentData.projects[projectIndex];
    Object.keys(body.updates).forEach(key => {
      project[key] = body.updates[key];
    });

    // Update timestamp
    currentData.timestamp = new Date().toISOString();
    currentData.lastUpdate = {
      action: body.action,
      project: projectDisplayName,
      updatedBy: body.updatedBy || "barry-cli",
      timestamp: body.timestamp || currentData.timestamp
    };

    if (writeStatus(currentData)) {
      return NextResponse.json({
        success: true,
        project: projectDisplayName,
        updates: body.updates,
        timestamp: currentData.timestamp
      });
    } else {
      return NextResponse.json({ 
        error: "Failed to save status updates" 
      }, { status: 500 });
    }

  } catch (e) {
    console.error("Project update error:", e);
    return NextResponse.json({ 
      error: "Invalid JSON or server error" 
    }, { status: 400 });
  }
}