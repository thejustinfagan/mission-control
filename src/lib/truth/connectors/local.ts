// Local filesystem probe connector.
//
// Checks whether configured local paths exist on the host running this process.
// On Railway (or any host that is not the developer's Mac) these paths simply
// are not visible, which is UNKNOWN, not a failure. We never turn "path not on
// this server" into a red health signal.
//
// Configure via env: MC_LOCAL_PATHS="projectId|/abs/path,projectId|/abs/path"
// When unset, this connector is a no-op.

import type { Claim, ConnectorResult, Evidence } from "../types";
import { nowIso } from "../time";
import { computeFreshness } from "../ttl";

export interface LocalPathTarget {
  projectId: string;
  path: string;
}

const LOCAL_TTL_SECONDS = 300;

export function configuredLocalTargets(
  env: NodeJS.ProcessEnv = process.env
): LocalPathTarget[] {
  const raw = env.MC_LOCAL_PATHS;
  if (!raw) return [];
  const targets: LocalPathTarget[] = [];
  for (const entry of raw.split(",")) {
    const [projectId, path] = entry.split("|").map((s) => s.trim());
    if (!projectId || !path) continue;
    targets.push({ projectId, path });
  }
  return targets;
}

export interface LocalConnectorResult extends ConnectorResult {
  byProject: Record<string, { evidenceId: string; claimId: string }>;
}

export async function localPathConnector(
  now: Date = new Date(),
  targets: LocalPathTarget[] = configuredLocalTargets()
): Promise<LocalConnectorResult> {
  const result: LocalConnectorResult = { evidence: [], claims: [], byProject: {} };
  if (targets.length === 0) return result;

  // Import fs lazily so this module stays import-safe in edge/browser bundles.
  const { access } = await import("node:fs/promises");
  const generatedAt = nowIso(now);

  for (const target of targets) {
    const evidenceId = `ev:local:${target.projectId}`;
    const claimId = `cl:localpath:${target.projectId}`;

    let exists: boolean | null = null;
    let summary: string;
    try {
      await access(target.path);
      exists = true;
      summary = `Local path present on this host: ${target.path}`;
    } catch {
      // Not found here. On a server this is expected and means UNKNOWN, not bad.
      exists = null;
      summary = `Local path not visible from this host: ${target.path}`;
    }

    const evidence: Evidence = {
      id: evidenceId,
      kind: "local-path",
      source: { type: "local", label: target.path, ref: target.path },
      observedAt: generatedAt,
      ttlSeconds: LOCAL_TTL_SECONDS,
      summary,
      detail:
        "Local path checks only describe the host running Mission Control. Absence on a server is Unknown, not a failure.",
      ok: exists, // true if present, null if not visible here
      raw: { path: target.path },
    };

    result.evidence.push(evidence);
    result.claims.push({
      id: claimId,
      subject: `project:${target.projectId}`,
      statement: summary,
      status: exists ? "verified" : "unknown",
      confidence: exists ? "low" : "none",
      evidenceIds: [evidenceId],
      freshness: computeFreshness(generatedAt, LOCAL_TTL_SECONDS, now),
      definition:
        "fs.access() on a configured path on the Mission Control host. Presence is low-confidence (file exists ≠ project works).",
      generatedAt,
    });
    result.byProject[target.projectId] = { evidenceId, claimId };
  }

  return result;
}
