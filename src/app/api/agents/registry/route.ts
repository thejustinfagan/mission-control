import { NextRequest, NextResponse } from "next/server";
import { verifyAgentAuth, unauthorizedResponse } from "@/lib/truth/auth";
import { pushRegistryUpdate } from "@/lib/truth/registry-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Push a single project registry update. Prefer /api/agents/feed for batching. */
export async function POST(request: NextRequest) {
  if (!verifyAgentAuth(request)) return unauthorizedResponse();

  try {
    const body = await request.json();
    if (!body.projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    const record = pushRegistryUpdate(
      {
        projectId: body.projectId,
        claimedStatus: body.claimedStatus ?? body.status,
        lastWorked: body.lastWorked,
        blockers: body.blockers,
        tagline: body.tagline,
        liveUrl: body.liveUrl,
        stage: body.stage,
      },
      body.agentId === "harry" ? "harry" : "barry"
    );

    return NextResponse.json({ ok: true, record }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Registry push failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
