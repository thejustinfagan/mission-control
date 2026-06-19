import { NextResponse } from "next/server";
import { buildMissionControlSnapshot } from "@/lib/truth/snapshot";

// Normalized, evidence-backed Mission Control snapshot. This is the truth
// source the homepage consumes — not raw STATUS.md.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const snapshot = await buildMissionControlSnapshot();
    return NextResponse.json(snapshot);
  } catch (err) {
    // Never fake green: surface the failure explicitly.
    return NextResponse.json(
      {
        error: "Failed to build Mission Control snapshot",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
