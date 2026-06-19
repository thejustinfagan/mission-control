import { AGENTS } from "./registry";
import { expiresAt, isFresh } from "./time";
import type { Claim, Confidence, Evidence, Severity, TruthStatus } from "./types";

function confidenceForEvidence(evidence: Evidence): Confidence {
  return evidence.confidence;
}

function staleClaim(evidence: Evidence): Claim {
  return {
    id: `claim.stale.${evidence.id.replace(/[^a-zA-Z0-9_-]/g, "_")}`,
    subjectType: evidence.subjectType,
    subjectId: evidence.subjectId,
    title: "Evidence is stale",
    status: "stale",
    severity: evidence.subjectType === "system" ? "medium" : "low",
    confidence: confidenceForEvidence(evidence),
    summary: `${evidence.summary} (expired TTL ${evidence.ttlSeconds}s)`,
    lastVerifiedAt: evidence.status === "verified" ? evidence.capturedAt : undefined,
    expiresAt: expiresAt(evidence.capturedAt, evidence.ttlSeconds),
    evidenceIds: [evidence.id],
    ruleId: "rule.global.data_stale",
    recommendedAction: "Refresh this source with current proof before treating it as true.",
  };
}

export function deriveClaims(evidence: Evidence[], now = new Date()): Claim[] {
  const claims: Claim[] = [];

  for (const row of evidence) {
    if (!isFresh(row.capturedAt, row.ttlSeconds, now)) claims.push(staleClaim(row));
  }

  for (const agent of AGENTS) {
    const heartbeats = evidence.filter((row) => row.subjectType === "agent" && row.subjectId === agent.id && row.sourceType === "local_process");
    const freshVerified = heartbeats.find((row) => row.status === "verified" && isFresh(row.capturedAt, row.ttlSeconds, now));
    if (freshVerified) {
      claims.push({
        id: `claim.agent.${agent.id}.fresh_heartbeat`,
        subjectType: "agent",
        subjectId: agent.id,
        title: `${agent.name} heartbeat verified`,
        status: "verified",
        severity: "info",
        confidence: freshVerified.confidence,
        summary: freshVerified.summary,
        lastVerifiedAt: freshVerified.capturedAt,
        expiresAt: expiresAt(freshVerified.capturedAt, freshVerified.ttlSeconds),
        evidenceIds: [freshVerified.id],
        ruleId: "rule.agent.fresh_heartbeat",
      });
    } else {
      const agentEvidence = evidence.filter((row) => row.subjectType === "agent" && row.subjectId === agent.id);
      claims.push({
        id: `claim.agent.${agent.id}.no_fresh_heartbeat`,
        subjectType: "agent",
        subjectId: agent.id,
        title: `${agent.name} health unverified`,
        status: "unknown",
        severity: agent.id === "barry" ? "medium" : "low",
        confidence: "unknown",
        summary: "No fresh heartbeat evidence is configured for this agent.",
        evidenceIds: heartbeats.map((row) => row.id),
        ruleId: "rule.agent.no_fresh_heartbeat",
        recommendedAction: "Configure a heartbeat/probe before showing this agent as online or working.",
      });
    }
  }

  for (const row of evidence.filter((item) => item.subjectType === "project" && item.sourceType === "static_registry")) {
    claims.push({
      id: `claim.project.${row.subjectId}.static_registry`,
      subjectType: "project",
      subjectId: row.subjectId,
      title: "Project registry entry is unverified",
      status: "unverified",
      severity: "info",
      confidence: "low",
      summary: "This project came from the static registry, not a live probe.",
      expiresAt: expiresAt(row.capturedAt, row.ttlSeconds),
      evidenceIds: [row.id],
      ruleId: "rule.project.static_registry_unverified",
      recommendedAction: "Attach live repo/deploy/browser evidence before calling this verified.",
    });

    if (typeof row.metadata?.blocker === "string" && row.metadata.blocker.length > 0) {
      claims.push({
        id: `claim.project.${row.subjectId}.has_blocker`,
        subjectType: "project",
        subjectId: row.subjectId,
        title: "Project has a reported blocker",
        status: "reported",
        severity: "medium",
        confidence: "low",
        summary: row.metadata.blocker,
        evidenceIds: [row.id],
        ruleId: "rule.project.has_blocker",
        recommendedAction: "Verify whether this blocker is still current and decide ownership.",
      });
    }
  }

  const legacyStatus = evidence.find((row) => row.id === "evidence.system.legacy_status_fallback");
  if (legacyStatus) {
    claims.push({
      id: "claim.system.status_api_stale",
      subjectType: "system",
      subjectId: "legacy-status-api",
      title: "Mission Control status source stale",
      status: "stale",
      severity: "high",
      confidence: "high",
      summary: legacyStatus.summary,
      expiresAt: expiresAt(legacyStatus.capturedAt, legacyStatus.ttlSeconds),
      evidenceIds: [legacyStatus.id],
      ruleId: "rule.system.status_api_stale",
      recommendedAction: "Use /api/mission-control truth snapshot as the homepage source.",
    });
  }

  const shape = evidence.find((row) => row.id === "evidence.system.legacy_incomplete_shape");
  if (shape) {
    claims.push({
      id: "claim.system.legacy_shape_mismatch",
      subjectType: "system",
      subjectId: "legacy-status-api",
      title: "Legacy status payload shape mismatch",
      status: "failed",
      severity: "medium",
      confidence: "high",
      summary: shape.summary,
      evidenceIds: [shape.id],
      ruleId: "rule.system.legacy_shape_mismatch",
      recommendedAction: "Keep runtime normalization until legacy clients migrate.",
    });
  }

  return claims;
}

export function statusSeverityRank(severity: Severity): number {
  return { critical: 5, high: 4, medium: 3, low: 2, info: 1 }[severity];
}

export function claimStatusIsProblem(status: TruthStatus): boolean {
  return ["failed", "stale", "unknown", "unverified", "reported"].includes(status);
}
