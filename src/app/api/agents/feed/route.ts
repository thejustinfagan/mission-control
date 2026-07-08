import { NextRequest, NextResponse } from "next/server";
import { verifyAgentAuth, unauthorizedResponse } from "@/lib/truth/auth";
import { recordHeartbeat } from "@/lib/truth/heartbeat-store";
import { appendActivity } from "@/lib/truth/activity-store";
import { pushRegistryUpdate, saveAgentStatusSnapshot, type RegistryPushUpdate } from "@/lib/truth/registry-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Unified Barry feed — call after EVERY action and on heartbeat cron.
 *
 * POST /api/agents/feed
 * {
 *   "agentId": "barry",
 *   "heartbeat": { "ok": true, "currentTask": "Nightly build" },
 *   "activity": { "actionType": "code", "description": "...", "project": "fleet-intel" },
 *   "registry": [{ "projectId": "fleet-intel", "claimedStatus": "...", "lastWorked": "2026-07-08", "blockers": [] }],
 *   "status": { ...optional full status snapshot for /api/status consumers }
 * }
 */
export async function POST(request: NextRequest) {
  if (!verifyAgentAuth(request)) return unauthorizedResponse();

  try {
    const body = await request.json();
    const agentId = body.agentId === "harry" ? "harry" : "barry";
    const results: Record<string, unknown> = { agentId };

    if (body.heartbeat) {
      const hb = await recordHeartbeat({
        agentId,
        ok: body.heartbeat.ok !== false,
        currentTask: body.heartbeat.currentTask,
        metadata: body.heartbeat.metadata,
      });
      results.heartbeat = hb;

      // Auto-log heartbeat as activity when currentTask is set and no explicit activity
      if (hb.currentTask && !body.activity) {
        const auto = await appendActivity({
          actionType: "heartbeat",
          description: hb.currentTask,
          project: "mission-control",
          status: hb.ok ? "success" : "failed",
          agentId,
        });
        results.activity = auto;
      }
    }

    if (body.activity) {
      const act = await appendActivity({
        actionType: body.activity.actionType || "work",
        description: body.activity.description,
        project: body.activity.project || "mission-control",
        status: body.activity.status || "success",
        agentId,
      });
      results.activity = act;
    }

    if (Array.isArray(body.registry)) {
      const pushed: RegistryPushUpdate[] = [];
      for (const item of body.registry) {
        if (!item?.projectId) continue;
        const record = pushRegistryUpdate(
          {
            projectId: item.projectId,
            claimedStatus: item.claimedStatus ?? item.status,
            lastWorked: item.lastWorked,
            blockers: item.blockers,
            tagline: item.tagline,
            liveUrl: item.liveUrl,
            stage: item.stage,
          },
          agentId
        );
        pushed.push(record);
      }
      results.registry = pushed;
    }

    if (body.status && typeof body.status === "object") {
      const at = saveAgentStatusSnapshot({ ...body.status, pushedBy: agentId });
      results.statusSnapshotAt = at;
    }

    return NextResponse.json({ ok: true, ...results }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Feed failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
