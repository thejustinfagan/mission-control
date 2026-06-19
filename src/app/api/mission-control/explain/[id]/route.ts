import { NextResponse } from "next/server";
import { buildMissionControlSnapshot } from "@/lib/truth/snapshot";
import { explainId } from "@/lib/truth/explain";

// Explain endpoint: given any id (claim, evidence, agent, project, incident,
// action, or "global"), return the related claims and evidence so a human can
// see exactly why something is shown.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const id = decodeURIComponent(params.id);
  try {
    const snapshot = await buildMissionControlSnapshot();
    const result = explainId(snapshot, id);
    return NextResponse.json(result, { status: result.found ? 200 : 404 });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to build explanation",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
