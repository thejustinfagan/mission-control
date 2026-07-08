import { NextResponse } from "next/server";
import { buildMissionControlSnapshot } from "@/lib/truth/snapshot";
import { generateExecutiveBriefing } from "@/lib/ai/briefing";

// Executive briefing: answers the north-star success questions from the live
// snapshot. Uses NVIDIA NIM when NVIDIA_API_KEY is set; otherwise rule-based.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const snapshot = await buildMissionControlSnapshot();
    const result = await generateExecutiveBriefing(snapshot);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to generate executive briefing",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
