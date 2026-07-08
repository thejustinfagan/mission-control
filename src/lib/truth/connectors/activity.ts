// Activity connector — turns agent-pushed activity log entries into evidence
// for the proof feed. Activities are testimony about work done.

import type { Claim, ConnectorResult, Evidence } from "../types";
import { computeFreshness } from "../ttl";
import { nowIso } from "../time";
import { readActivities, type ActivityRecord } from "../activity-store";
import { loadRegistry } from "../registry";

const ACTIVITY_TTL_SECONDS = 60 * 60 * 24; // 24h — activity stays visible in feed
const MAX_ACTIVITIES = 40;

/** Map activity.project slug to registry project id. */
function resolveProjectId(projectSlug: string, registryIds: Set<string>): string | null {
  const normalized = projectSlug.toLowerCase().replace(/\s+/g, "-");
  if (registryIds.has(normalized)) return normalized;
  // fuzzy: fleet-intel matches "fleet-intel", battle-dinghy matches "battle dinghy"
  for (const id of registryIds) {
    if (normalized.includes(id) || id.includes(normalized)) return id;
  }
  return null;
}

export interface ActivityConnectorResult extends ConnectorResult {
  byProject: Record<string, string[]>;
}

export async function activityConnector(
  now: Date = new Date(),
  options: { dbPath?: string } = {}
): Promise<ActivityConnectorResult> {
  const generatedAt = nowIso(now);
  const activities = await readActivities({ dbPath: options.dbPath });
  const registry = loadRegistry();
  const registryIds = new Set(registry.map((p) => p.id));

  const evidence: Evidence[] = [];
  const claims: Claim[] = [];
  const byProject: Record<string, string[]> = {};

  for (const activity of activities.slice(0, MAX_ACTIVITIES)) {
    const projectId = resolveProjectId(activity.project, registryIds);
    const evidenceId = `ev:activity:${activity.id}`;

    const ok =
      activity.status === "success" ? true : activity.status === "failed" ? false : null;

    evidence.push({
      id: evidenceId,
      kind: "manual",
      source: {
        type: "agent",
        label: activity.agentId ? `Agent activity (${activity.agentId})` : "Agent activity",
        ref: activity.id,
      },
      observedAt: activity.timestamp,
      ttlSeconds: ACTIVITY_TTL_SECONDS,
      summary: `[${activity.actionType}] ${activity.description}`,
      detail: `Project: ${activity.project} · Status: ${activity.status}`,
      ok,
      raw: activity,
    });

    const claimId = `cl:activity:${activity.id}`;
    claims.push({
      id: claimId,
      subject: projectId ? `project:${projectId}` : "mission-control",
      statement: `Agent reported: ${activity.description}`,
      status: "unverified",
      confidence: "low",
      evidenceIds: [evidenceId],
      freshness: computeFreshness(activity.timestamp, ACTIVITY_TTL_SECONDS, now),
      definition: "Activity log entry pushed by an agent. Testimony, not independently verified.",
      generatedAt,
    });

    if (projectId) {
      if (!byProject[projectId]) byProject[projectId] = [];
      byProject[projectId].push(evidenceId);
    }
  }

  return { evidence, claims, byProject };
}
