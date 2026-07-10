import { NextRequest, NextResponse } from "next/server";
import { buildMissionControlSnapshot } from "@/lib/truth/snapshot";
import { generateNightlySweep } from "@/lib/ai/sweep";
import { readLatestSweep, readSweepHistory } from "@/lib/truth/sweep-store";
import { isNvidiaConfigured } from "@/lib/ai/nvidia";
import { verifyAgentAuth, unauthorizedResponse } from "@/lib/truth/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET — latest sweep; ?force=true regenerates; ?history=N returns past sweeps
 * POST — cron trigger (requires strict Bearer MC_AUTH_TOKEN)
 */
export async function GET(request: NextRequest) {
  const historyParam = request.nextUrl.searchParams.get("history");
  if (historyParam) {
    const limit = Math.min(parseInt(historyParam, 10) || 7, 30);
    const history = await readSweepHistory(limit);
    return NextResponse.json({ history });
  }

  const force = request.nextUrl.searchParams.get("force") === "true";
  const snapshot = await buildMissionControlSnapshot();

  if (force) {
    const result = await generateNightlySweep(snapshot, { force: true });
    return NextResponse.json(result);
  }

  const latest = await readLatestSweep();
  if (latest) {
    return NextResponse.json({
      report: latest,
      configured: isNvidiaConfigured(),
      model: null,
      cached: true,
    });
  }

  const result = await generateNightlySweep(snapshot);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  if (!verifyAgentAuth(request)) return unauthorizedResponse();

  try {
    const force = request.nextUrl.searchParams.get("force") === "true";
    const snapshot = await buildMissionControlSnapshot();
    const result = await generateNightlySweep(snapshot, { force });
    return NextResponse.json(result, { status: result.cached ? 200 : 201 });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to run nightly sweep",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
