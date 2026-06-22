import { NextResponse } from "next/server";
import { insertActivity, isDbConfigured } from "@/lib/db";

// Project-update push (used by Barry's CLI). Auth-gated. A pushed update is
// recorded durably (Postgres) as an activity / testimony so it appears in the
// Mission Control proof feed. It is deliberately NOT used to fake-green a project
// card: the cockpit only marks a project verified-healthy from a live probe or
// render, never from a self-reported status string.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AUTH_TOKEN = process.env.MC_AUTH_TOKEN || "barry-update-2026";

function normalizeProjectName(name: string): string {
  const mapping: Record<string, string> = {
    "fleet-intel": "Fleet Intel",
    "mission-control": "Mission Control",
    "reseller-intel": "Reseller Intel",
    "territory-command-center": "Territory Command Center",
    "battle-dinghy": "Battle Dinghy",
    "dc-land-intel": "DC Land Intel",
    "polymarket": "Polymarket",
    "public-data-research": "Public Data Research",
    "ai-calibration": "AI Calibration",
  };
  return mapping[name] || name;
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (token !== AUTH_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.action !== "update_project" || !body.project || !body.updates) {
    return NextResponse.json(
      { error: "Invalid request. Expected: action=update_project, project, updates" },
      { status: 400 }
    );
  }

  if (!isDbConfigured()) {
    return NextResponse.json(
      {
        error:
          "Mission Control database is not configured (DATABASE_URL unset). Update was NOT stored.",
      },
      { status: 503 }
    );
  }

  const projectDisplayName = normalizeProjectName(body.project);
  const updates = body.updates as Record<string, unknown>;
  const summary = Object.entries(updates)
    .map(([k, v]) => `${k}=${typeof v === "string" ? v : JSON.stringify(v)}`)
    .join(", ");

  try {
    const created = await insertActivity({
      actionType: "project_update",
      description: `${projectDisplayName}: ${summary || "status updated"}`,
      project: projectDisplayName,
      status: typeof updates.status === "string" ? updates.status : "info",
      actor: body.updatedBy || "barry-cli",
      raw: { action: body.action, project: projectDisplayName, updates },
    });
    return NextResponse.json({
      success: true,
      recorded: "activity",
      project: projectDisplayName,
      updates,
      id: created.id,
      timestamp: created.ts,
      note: "Recorded as testimony in the proof feed. Project health on the cockpit still requires a live probe/render.",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to save update", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
