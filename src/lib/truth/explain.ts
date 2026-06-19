// Explain resolver. Given any id in a snapshot (claim, evidence, agent,
// project, incident, or Justin action), return the related claims and evidence
// so a human can see exactly why something is shown. Pure — used by both the
// /api/mission-control/explain endpoint and the in-app Explain drawer.

import type { Claim, Evidence, MissionControlSnapshot } from "./types";

export type ExplainTargetType =
  | "claim"
  | "evidence"
  | "agent"
  | "project"
  | "incident"
  | "action"
  | "global"
  | "unknown";

export interface ExplainResult {
  id: string;
  found: boolean;
  type: ExplainTargetType;
  title: string;
  claims: Claim[];
  evidence: Evidence[];
}

/**
 * Expand a set of claim/evidence ids into the full claims and the evidence
 * those claims (and the explicit evidence ids) reference. De-duplicated.
 */
export function resolveRefs(
  snapshot: MissionControlSnapshot,
  claimIds: string[] = [],
  evidenceIds: string[] = []
): { claims: Claim[]; evidence: Evidence[] } {
  const claimById = new Map(snapshot.claims.map((c) => [c.id, c]));
  const evidenceById = new Map(snapshot.evidence.map((e) => [e.id, e]));

  const claims: Claim[] = [];
  const seenClaims = new Set<string>();
  const evidenceIdSet = new Set<string>(evidenceIds);

  for (const id of claimIds) {
    const claim = claimById.get(id);
    if (claim && !seenClaims.has(claim.id)) {
      seenClaims.add(claim.id);
      claims.push(claim);
      for (const eid of claim.evidenceIds) evidenceIdSet.add(eid);
    }
  }

  const evidence: Evidence[] = [];
  const seenEvidence = new Set<string>();
  for (const id of evidenceIdSet) {
    const e = evidenceById.get(id);
    if (e && !seenEvidence.has(e.id)) {
      seenEvidence.add(e.id);
      evidence.push(e);
    }
  }

  return { claims, evidence };
}

/** Resolve a single id to an explanation. */
export function explainId(
  snapshot: MissionControlSnapshot,
  id: string
): ExplainResult {
  if (id === "global" || id === snapshot.globalStatus.label) {
    const { claims, evidence } = resolveRefs(
      snapshot,
      snapshot.globalStatus.claimIds,
      snapshot.globalStatus.evidenceIds
    );
    return {
      id,
      found: true,
      type: "global",
      title: `Global status: ${snapshot.globalStatus.label}`,
      claims,
      evidence,
    };
  }

  const agent = snapshot.agents.find((a) => a.id === id);
  if (agent) {
    const { claims, evidence } = resolveRefs(snapshot, agent.claimIds, agent.evidenceIds);
    return { id, found: true, type: "agent", title: agent.name, claims, evidence };
  }

  const project = snapshot.projects.find((p) => p.id === id);
  if (project) {
    const { claims, evidence } = resolveRefs(snapshot, project.claimIds, project.evidenceIds);
    return { id, found: true, type: "project", title: project.name, claims, evidence };
  }

  const incident = snapshot.incidents.find((i) => i.id === id);
  if (incident) {
    const { claims, evidence } = resolveRefs(snapshot, incident.claimIds, incident.evidenceIds);
    return { id, found: true, type: "incident", title: incident.title, claims, evidence };
  }

  const action = snapshot.justinQueue.find((a) => a.id === id);
  if (action) {
    const { claims, evidence } = resolveRefs(snapshot, action.claimIds, action.evidenceIds);
    return { id, found: true, type: "action", title: action.title, claims, evidence };
  }

  const claim = snapshot.claims.find((c) => c.id === id);
  if (claim) {
    const { claims, evidence } = resolveRefs(snapshot, [claim.id], []);
    return { id, found: true, type: "claim", title: claim.statement, claims, evidence };
  }

  const ev = snapshot.evidence.find((e) => e.id === id);
  if (ev) {
    const claims = snapshot.claims.filter((c) => c.evidenceIds.includes(ev.id));
    return { id, found: true, type: "evidence", title: ev.summary, claims, evidence: [ev] };
  }

  return { id, found: false, type: "unknown", title: "Not found", claims: [], evidence: [] };
}
