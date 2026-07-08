// Agent-push connector — registry fields updated by Barry/Harry via POST /api/agents/feed.
// Agent testimony with timestamps; fresher than static projects.ts when Barry feeds MC.

import type { Claim, ConnectorResult, Evidence } from "../types";
import { computeFreshness } from "../ttl";
import { nowIso } from "../time";
import { readRegistryPushes, type RegistryPushRecord } from "../registry-store";

const AGENT_REGISTRY_TTL_SECONDS = 60 * 60 * 24; // 24h

export interface AgentPushConnectorResult extends ConnectorResult {
  byProject: Record<string, { evidenceId: string; claimId: string; record: RegistryPushRecord }>;
}

export function agentPushConnector(
  now: Date = new Date(),
  options: { dbPath?: string } = {}
): AgentPushConnectorResult {
  const generatedAt = nowIso(now);
  const pushes = readRegistryPushes(options);
  const evidence: Evidence[] = [];
  const claims: Claim[] = [];
  const byProject: AgentPushConnectorResult["byProject"] = {};

  for (const record of pushes) {
    const evidenceId = `ev:agent-registry:${record.projectId}`;
    const claimId = `cl:agent-registry:${record.projectId}`;

    const summary = `Agent (${record.pushedBy}) updated registry for ${record.projectId}`;
    const detail = [
      record.claimedStatus && `status: ${record.claimedStatus}`,
      record.lastWorked && `lastWorked: ${record.lastWorked}`,
      record.blockers?.length && `blockers: ${record.blockers.join("; ")}`,
    ]
      .filter(Boolean)
      .join(" · ");

    const ev: Evidence = {
      id: evidenceId,
      kind: "manual",
      source: {
        type: "agent",
        label: `Agent registry push (${record.pushedBy})`,
        ref: record.projectId,
      },
      observedAt: record.pushedAt,
      ttlSeconds: AGENT_REGISTRY_TTL_SECONDS,
      summary,
      detail: detail || "Registry fields updated by agent.",
      ok: null,
      raw: record,
    };

    const claim: Claim = {
      id: claimId,
      subject: `project:${record.projectId}`,
      statement: `${summary}${detail ? ` — ${detail}` : ""}`,
      status: "unverified",
      confidence: "low",
      evidenceIds: [evidenceId],
      freshness: computeFreshness(record.pushedAt, AGENT_REGISTRY_TTL_SECONDS, now),
      definition:
        "Registry fields pushed by an agent via /api/agents/feed. Testimony — not independently verified.",
      generatedAt,
    };

    evidence.push(ev);
    claims.push(claim);
    byProject[record.projectId] = { evidenceId, claimId, record };
  }

  return { evidence, claims, byProject };
}
