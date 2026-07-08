// Agent heartbeat connector — reads persisted heartbeats pushed by Barry/Harry.
// Heartbeats are self-reported testimony: useful for "is the agent running?",
// not proof that work shipped.

import type { Claim, ConnectorResult, Evidence } from "../types";
import { deriveAgentStatus } from "../rules";
import { computeFreshness } from "../ttl";
import { nowIso } from "../time";
import {
  latestHeartbeatsByAgent,
  readHeartbeats,
  type AgentHeartbeatRecord,
} from "../heartbeat-store";

const HEARTBEAT_TTL_SECONDS = 30 * 60; // 30 min — matches cron heartbeat cadence

export interface HeartbeatConnectorResult extends ConnectorResult {
  byAgent: Record<string, { evidenceId: string; claimId: string; record: AgentHeartbeatRecord }>;
}

export async function heartbeatConnector(
  now: Date = new Date(),
  options: { dbPath?: string } = {}
): Promise<HeartbeatConnectorResult> {
  const generatedAt = nowIso(now);
  const records = await readHeartbeats({ dbPath: options.dbPath });
  const latest = latestHeartbeatsByAgent(records);

  const evidence: Evidence[] = [];
  const claims: Claim[] = [];
  const byAgent: HeartbeatConnectorResult["byAgent"] = {};

  for (const [agentId, record] of latest) {
    const evidenceId = `ev:heartbeat:${agentId}`;
    const claimId = `cl:heartbeat:${agentId}`;

    const heartbeatEvidence: Evidence = {
      id: evidenceId,
      kind: "agent-heartbeat",
      source: {
        type: "agent",
        label: `Agent heartbeat (${agentId})`,
        ref: agentId,
      },
      observedAt: record.observedAt,
      ttlSeconds: HEARTBEAT_TTL_SECONDS,
      summary: record.ok
        ? `${agentId} heartbeat OK${record.currentTask ? ` — ${record.currentTask}` : ""}`
        : `${agentId} heartbeat reported a problem`,
      detail: "Self-reported by the agent runtime. Testimony, not proof of shipped work.",
      ok: record.ok,
      raw: record,
    };

    const { status, label } = deriveAgentStatus(heartbeatEvidence, now);

    const claim: Claim = {
      id: claimId,
      subject: `agent:${agentId}`,
      statement: `${agentId} status: ${label}`,
      status: status === "online" ? "verified" : status === "unknown" ? "unknown" : "unverified",
      confidence: status === "online" ? "medium" : "none",
      evidenceIds: [evidenceId],
      freshness: computeFreshness(record.observedAt, HEARTBEAT_TTL_SECONDS, now),
      definition:
        "Agent status from a fresh self-reported heartbeat. No heartbeat = Unknown.",
      generatedAt,
    };

    evidence.push(heartbeatEvidence);
    claims.push(claim);
    byAgent[agentId] = { evidenceId, claimId, record };
  }

  return { evidence, claims, byAgent };
}
