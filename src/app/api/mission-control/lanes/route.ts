import { NextResponse } from "next/server";
import { loadEffectiveRegistry } from "@/lib/truth/registry-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const registry = loadEffectiveRegistry();

  const monetization = registry
    .filter((p) => p.monetization)
    .map((p) => ({
      projectId: p.id,
      name: p.name,
      tagline: p.tagline,
      current: p.monetization!.current,
      potential: p.monetization!.potential,
      currency: p.monetization!.currency,
      stage: p.stage,
      blockers: p.blockers,
    }))
    .sort((a, b) => b.potential - a.potential);

  const content = registry
    .filter((p) => p.contentLane)
    .map((p) => ({
      projectId: p.id,
      name: p.name,
      lane: p.contentLane!,
      tagline: p.tagline,
      stage: p.stage,
    }));

  return NextResponse.json({ monetization, content });
}
