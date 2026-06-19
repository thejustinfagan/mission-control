import { NextResponse } from "next/server";
import { buildMissionControlSnapshot } from "@/lib/truth/snapshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const snapshot = await buildMissionControlSnapshot();
    return NextResponse.json(snapshot, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Mission Control truth snapshot failed", error);
    return NextResponse.json(
      { error: "Mission Control truth snapshot failed" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
