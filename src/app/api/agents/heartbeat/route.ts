import { NextRequest, NextResponse } from "next/server";
import { recordHeartbeat, readHeartbeats, isKnownAgentId } from "@/lib/truth/heartbeat-store";
import { verifyAgentAuthStrict, verifyHumanBasicAuth, unauthorizedResponse } from "@/lib/truth/access-control";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET — latest heartbeats (requires human Basic Auth)
 * POST — agent push (requires strict Bearer)
 */
export async function GET(request: NextRequest) {
  if (!verifyHumanBasicAuth(request)) return unauthorizedResponse();
  const records = await readHeartbeats();
  return NextResponse.json({ heartbeats: records });
}

export async function POST(request: NextRequest) {
  if (!verifyAgentAuthStrict(request)) return unauthorizedResponse();

  try {
    const body = await request.json();
    if (!body.agentId || !isKnownAgentId(body.agentId)) {
      return NextResponse.json(
        { error: "Invalid agentId — must be barry or harry" },
        { status: 400 }
      );
    }

    const record = await recordHeartbeat({
      agentId: body.agentId,
      ok: body.ok !== false,
      currentTask: body.currentTask,
      metadata: body.metadata,
    });

    return NextResponse.json({ ok: true, heartbeat: record }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to record heartbeat", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
