import { NextResponse } from "next/server";
import { buildMissionControlSnapshot } from "@/lib/truth/snapshot";
import { relativeAge } from "@/lib/truth/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const snapshot = await buildMissionControlSnapshot();
  const id = decodeURIComponent(params.id);

  const claim = snapshot.claims.find((item) => item.id === id);
  const evidence = snapshot.evidence.find((item) => item.id === id);
  const project = snapshot.projects.find((item) => item.id === id);
  const agent = snapshot.agents.find((item) => item.id === id);
  const incident = snapshot.incidents.find((item) => item.id === id);
  const action = snapshot.justinQueue.find((item) => item.id === id);

  const found = claim ?? evidence ?? project ?? agent ?? incident ?? action;
  if (!found) {
    return NextResponse.json({ error: "Explanation target not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  const kind = claim ? "claim" : evidence ? "evidence" : project ? "project" : agent ? "agent" : incident ? "incident" : "action";
  const claimIds = claim ? [claim.id] : "claimIds" in found ? found.claimIds : [];
  const evidenceIds = evidence ? [evidence.id] : claim ? claim.evidenceIds : "evidenceIds" in found ? found.evidenceIds : [];
  const relatedClaims = snapshot.claims.filter((item) => claimIds.includes(item.id) || evidenceIds.some((evidenceId) => item.evidenceIds.includes(evidenceId)));
  const relatedEvidence = snapshot.evidence.filter((item) => evidenceIds.includes(item.id) || relatedClaims.some((relatedClaim) => relatedClaim.evidenceIds.includes(item.id)));
  const title = "title" in found ? String(found.title) : "name" in found ? String(found.name) : "summary" in found ? String(found.summary) : id;
  const capturedAt = evidence ? evidence.capturedAt : relatedEvidence[0]?.capturedAt;

  return NextResponse.json(
    {
      id,
      kind,
      title,
      status: "status" in found ? found.status : undefined,
      confidence: "confidence" in found ? found.confidence : undefined,
      ruleId: claim?.ruleId,
      freshness: capturedAt ? relativeAge(capturedAt) : snapshot.freshness.label,
      evidence: relatedEvidence,
      claims: relatedClaims,
      raw: found,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
