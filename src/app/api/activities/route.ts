import { NextResponse } from "next/server";
import { getRecentActivities, insertActivity, isDbConfigured } from "@/lib/db";

// Activity feed, backed by the durable store (Postgres). Pushed updates land here
// and are read straight back — this is the same store the Mission Control snapshot
// reads, so anything pushed shows up on the dashboard. No /tmp, which Railway wipes.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Shape kept stable for existing clients (mc-push, dashboards).
interface ActivityResponse {
  id: string;
  timestamp: string;
  actionType: string;
  description: string;
  project: string;
  status: string;
}

export async function GET() {
  try {
    const rows = await getRecentActivities(100);
    const activities: ActivityResponse[] = rows.map((r) => ({
      id: r.id,
      timestamp: r.ts,
      actionType: r.actionType,
      description: r.description,
      project: r.project,
      status: r.status,
    }));
    return NextResponse.json(activities);
  } catch (err) {
    // Never fake an empty feed as success — surface the failure.
    return NextResponse.json(
      { error: "Failed to read activities", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.description || !body.project || !body.actionType) {
    return NextResponse.json(
      { error: "Missing required fields: description, project, actionType" },
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

  try {
    const created = await insertActivity({
      actionType: String(body.actionType),
      description: String(body.description),
      project: String(body.project),
      status: body.status ? String(body.status) : "success",
      actor: body.actor ? String(body.actor) : "mc-push",
      raw: body.raw,
    });
    return NextResponse.json(
      {
        id: created.id,
        timestamp: created.ts,
        actionType: created.actionType,
        description: created.description,
        project: created.project,
        status: created.status,
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to save activity", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
