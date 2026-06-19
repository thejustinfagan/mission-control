import { AGENTS } from "./registry";
import { claimStatusIsProblem, deriveClaims, statusSeverityRank } from "./rules";
import { relativeAge } from "./time";
import type { AgentCard, Claim, Evidence, Incident, JustinAction, MissionControlSnapshot, ProjectCard } from "./types";
import { collectHttpEvidence } from "./connectors/http";
import { collectLocalPathEvidence } from "./connectors/local";
import { collectStaticEvidence, getStaticProjectCards } from "./connectors/static";

function claimsFor(claims: Claim[], subjectType: Claim["subjectType"], subjectId: string): Claim[] {
  return claims.filter((claim) => claim.subjectType === subjectType && claim.subjectId === subjectId);
}

function evidenceFor(evidence: Evidence[], subjectType: Evidence["subjectType"], subjectId: string): Evidence[] {
  return evidence.filter((row) => row.subjectType === subjectType && row.subjectId === subjectId);
}

function buildAgents(claims: Claim[], evidence: Evidence[]): AgentCard[] {
  return AGENTS.map((agent) => {
    const agentClaims = claimsFor(claims, "agent", agent.id);
    const agentEvidence = evidenceFor(evidence, "agent", agent.id);
    const verifiedClaim = agentClaims.find((claim) => claim.ruleId === "rule.agent.fresh_heartbeat");
    const task = verifiedClaim?.summary;
    return {
      id: agent.id,
      name: agent.name,
      role: agent.role,
      status: verifiedClaim ? (task ? "working" : "idle") : "unknown",
      confidence: verifiedClaim?.confidence ?? "unknown",
      currentTask: verifiedClaim ? task : undefined,
      lastHeartbeatAt: verifiedClaim?.lastVerifiedAt,
      lastProof: verifiedClaim?.summary ?? "No fresh heartbeat source configured",
      blocker: agentClaims.find((claim) => claim.status === "unknown")?.recommendedAction,
      claimIds: agentClaims.map((claim) => claim.id),
      evidenceIds: agentEvidence.map((row) => row.id),
    };
  });
}

function buildProjects(claims: Claim[], evidence: Evidence[]): ProjectCard[] {
  return getStaticProjectCards()
    .map((project) => {
      const projectClaims = claimsFor(claims, "project", project.id);
      const projectEvidence = evidenceFor(evidence, "project", project.id);
      const blockerClaim = projectClaims.find((claim) => claim.ruleId === "rule.project.has_blocker");
      const staleClaim = projectClaims.find((claim) => claim.status === "stale");
      return {
        ...project,
        status: blockerClaim ? "blocked" : staleClaim ? "stale" : "unknown",
        proofCount: projectEvidence.length,
        claimIds: projectClaims.map((claim) => claim.id),
        evidenceIds: projectEvidence.map((row) => row.id),
      } satisfies ProjectCard;
    })
    .sort((a, b) => a.priority - b.priority);
}

function buildJustinQueue(claims: Claim[], evidence: Evidence[]): JustinAction[] {
  const statusClaim = claims.find((claim) => claim.id === "claim.system.status_api_stale");
  const legacyEvidence = evidence.filter((row) => row.subjectId === "legacy-status-api").map((row) => row.id);
  return [
    {
      id: "action.review.truth_machine_direction",
      type: "review",
      title: "Approve Mission Control v2 Truth Machine build direction",
      projectId: "mission-control",
      urgency: "high",
      whyJustin: "The homepage must prioritize verified evidence, stale-source warnings, and agent uncertainty over dashboard polish.",
      recommendation: "Build truth ledger + cockpit, not dashboard polish",
      risk: "Without approval, old STATUS.md-style data can keep presenting stale claims as live truth.",
      options: ["Approve truth-machine direction", "Request different evidence sources", "Pause homepage replacement"],
      claimIds: statusClaim ? [statusClaim.id] : [],
      evidenceIds: legacyEvidence,
    },
  ];
}

function buildIncidents(claims: Claim[], evidence: Evidence[], now: Date): Incident[] {
  const incidents: Incident[] = [];
  const statusClaim = claims.find((claim) => claim.id === "claim.system.status_api_stale");
  const shapeClaim = claims.find((claim) => claim.id === "claim.system.legacy_shape_mismatch");
  const barryClaim = claims.find((claim) => claim.id === "claim.agent.barry.no_fresh_heartbeat");

  if (statusClaim) {
    incidents.push({
      id: "incident.status_source_stale",
      severity: "high",
      title: "Mission Control status source stale",
      affected: "Homepage legacy data contract",
      symptom: statusClaim.summary,
      suspectedCause: "Static fallback timestamp predates current work and lacks live proof.",
      status: "open",
      firstSeenAt: evidence.find((row) => row.id === statusClaim.evidenceIds[0])?.capturedAt ?? now.toISOString(),
      lastSeenAt: now.toISOString(),
      recommendedAction: statusClaim.recommendedAction,
      claimIds: [statusClaim.id],
      evidenceIds: statusClaim.evidenceIds,
    });
  }

  if (barryClaim) {
    incidents.push({
      id: "incident.barry_health_unverified",
      severity: "medium",
      title: "Barry health unverified",
      affected: "Agent lane: Barry",
      symptom: "No heartbeat source proves Barry is online or working.",
      suspectedCause: "Heartbeat connector is not configured yet.",
      status: "open",
      firstSeenAt: now.toISOString(),
      lastSeenAt: now.toISOString(),
      recommendedAction: barryClaim.recommendedAction,
      claimIds: [barryClaim.id],
      evidenceIds: barryClaim.evidenceIds,
    });
  }

  if (shapeClaim) {
    incidents.push({
      id: "incident.legacy_shape_mismatch",
      severity: "medium",
      title: "Legacy status payload shape mismatch",
      affected: "/api/status compatibility clients",
      symptom: shapeClaim.summary,
      suspectedCause: "Old fallback encoded incomplete work as strings while UI expected objects.",
      status: "monitoring",
      firstSeenAt: evidence.find((row) => row.id === shapeClaim.evidenceIds[0])?.capturedAt ?? now.toISOString(),
      lastSeenAt: now.toISOString(),
      recommendedAction: shapeClaim.recommendedAction,
      claimIds: [shapeClaim.id],
      evidenceIds: shapeClaim.evidenceIds,
    });
  }

  return incidents.sort((a, b) => statusSeverityRank(b.severity) - statusSeverityRank(a.severity));
}

function headlineFor(status: MissionControlSnapshot["globalStatus"]): string {
  return {
    all_clear: "All clear",
    needs_justin: "Needs Justin",
    agent_blocked: "Agent blocked",
    production_broken: "Production broken",
    data_stale: "Data stale",
    unknown: "Unknown",
  }[status];
}

export async function buildMissionControlSnapshot(now = new Date()): Promise<MissionControlSnapshot> {
  const staticEvidence = collectStaticEvidence();
  const localEvidence = collectLocalPathEvidence(getStaticProjectCards(), now);
  const httpEvidence = await collectHttpEvidence(now);
  const evidence = [...staticEvidence, ...localEvidence, ...httpEvidence];
  const claims = deriveClaims(evidence, now);
  const agents = buildAgents(claims, evidence);
  const projects = buildProjects(claims, evidence);
  const justinQueue = buildJustinQueue(claims, evidence);
  const incidents = buildIncidents(claims, evidence, now);

  const hasProductionIncident = incidents.some((incident) => incident.severity === "critical" && incident.affected.toLowerCase().includes("production"));
  const globalStatus: MissionControlSnapshot["globalStatus"] = hasProductionIncident
    ? "production_broken"
    : justinQueue.length > 0
      ? "needs_justin"
      : agents.some((agent) => agent.status === "blocked")
        ? "agent_blocked"
        : incidents.some((incident) => incident.title.toLowerCase().includes("stale"))
          ? "data_stale"
          : evidence.length === 0
            ? "unknown"
            : claims.some((claim) => claimStatusIsProblem(claim.status))
              ? "unknown"
              : "all_clear";

  const proofFeed = evidence
    .slice()
    .sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime())
    .slice(0, 12)
    .map((row) => ({
      id: row.id,
      capturedAt: row.capturedAt,
      label: row.summary,
      source: row.sourceName,
      status: row.status,
      confidence: row.confidence,
      artifactUrl: row.artifactUrl,
      subjectLabel: `${row.subjectType}:${row.subjectId}`,
    }));

  const unknownEvidence = evidence.filter((row) => row.status === "unknown");
  const staleClaims = claims.filter((claim) => claim.status === "stale");

  return {
    generatedAt: now.toISOString(),
    globalStatus,
    headline: headlineFor(globalStatus),
    summary: {
      justinActions: justinQueue.length,
      openIncidents: incidents.filter((incident) => incident.status === "open").length,
      agentsWorking: agents.filter((agent) => agent.status === "working").length,
      agentsUnknown: agents.filter((agent) => agent.status === "unknown").length,
      staleClaims: staleClaims.length,
      verifiedProofs: evidence.filter((row) => row.status === "verified").length,
    },
    freshness: {
      label: `generated ${relativeAge(now.toISOString(), now)}`,
      worstStatus: staleClaims.length > 0 ? "stale" : unknownEvidence.length > 0 ? "unknown" : "fresh",
      generatedAt: now.toISOString(),
    },
    justinQueue,
    agents,
    projects,
    incidents,
    proofFeed,
    claims,
    evidence,
  };
}
