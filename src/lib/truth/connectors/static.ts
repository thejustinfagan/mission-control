// Static registry connector.
//
// Turns the committed project registry into evidence + claims. Registry data is
// testimony about identity and history — it proves a project EXISTS and what was
// last *claimed* about it. It never proves the project is healthy or live, so
// every health claim it produces is "unverified", never "verified".

import type { ConnectorResult, Claim, Evidence } from "../types";
import { computeFreshness } from "../ttl";
import { nowIso } from "../time";
import { loadEffectiveRegistry } from "../registry-store";
import type { RegistryProject } from "../registry";

// Registry existence is re-confirmed every time we read the committed file, so
// its observation timestamp is "now". A generous TTL keeps identity evidence
// fresh; it says nothing about runtime health.
const REGISTRY_TTL_SECONDS = 60 * 60 * 24; // 24h

export interface StaticProjectRefs {
  existenceEvidenceId: string;
  registeredClaimId: string;
  healthClaimId: string;
  blockerClaimIds: string[];
}

export interface StaticConnectorResult extends ConnectorResult {
  registry: RegistryProject[];
  byProject: Record<string, StaticProjectRefs>;
}

export function staticRegistryConnector(
  now: Date = new Date()
): StaticConnectorResult {
  const registry = loadEffectiveRegistry();
  const generatedAt = nowIso(now);
  const evidence: Evidence[] = [];
  const claims: Claim[] = [];
  const byProject: Record<string, StaticProjectRefs> = {};

  for (const project of registry) {
    const existenceEvidenceId = `ev:registry:${project.id}`;
    const registeredClaimId = `cl:registered:${project.id}`;
    const healthClaimId = `cl:health:${project.id}`;
    const blockerClaimIds: string[] = [];

    // Evidence: the project is present in the committed registry file.
    evidence.push({
      id: existenceEvidenceId,
      kind: "static-registry",
      source: {
        type: "static",
        label: "Project registry (src/data/projects.ts)",
        ref: "src/data/projects.ts",
      },
      observedAt: generatedAt,
      ttlSeconds: REGISTRY_TTL_SECONDS,
      summary: `${project.name} is listed in the committed project registry`,
      detail: `Registry status: "${project.claimedStatus}". Last worked (per registry): ${project.lastWorked}. Static file + any agent push via /api/agents/feed.`,
      ok: null,
      raw: {
        id: project.id,
        claimedStatus: project.claimedStatus,
        stage: project.stage,
        lastWorked: project.lastWorked,
        liveUrl: project.liveUrl,
        repoUrl: project.repoUrl,
        blockers: project.blockers,
      },
    });

    // Claim: the project is registered. This the file genuinely verifies.
    claims.push({
      id: registeredClaimId,
      subject: `project:${project.id}`,
      statement: `${project.name} is a registered project`,
      status: "verified",
      confidence: "high",
      evidenceIds: [existenceEvidenceId],
      freshness: computeFreshness(generatedAt, REGISTRY_TTL_SECONDS, now),
      definition:
        "Verified by presence in the committed src/data/projects.ts registry file.",
      generatedAt,
    });

    // Claim: the project is healthy. The registry CANNOT verify this.
    claims.push({
      id: healthClaimId,
      subject: `project:${project.id}`,
      statement: `${project.name} runtime health is unverified`,
      status: "unverified",
      confidence: "none",
      evidenceIds: [existenceEvidenceId],
      freshness: computeFreshness(generatedAt, REGISTRY_TTL_SECONDS, now),
      definition:
        "Health requires fresh HTTP/browser/test evidence. The registry provides none, so health is Unverified — not green.",
      generatedAt,
    });

    // Claims: each registry-asserted blocker is testimony of a problem.
    project.blockers.forEach((blocker, i) => {
      const blockerClaimId = `cl:blocker:${project.id}:${i}`;
      blockerClaimIds.push(blockerClaimId);
      claims.push({
        id: blockerClaimId,
        subject: `project:${project.id}`,
        statement: `${project.name} blocker (claimed): ${blocker}`,
        status: "unverified",
        confidence: "low",
        evidenceIds: [existenceEvidenceId],
        freshness: computeFreshness(generatedAt, REGISTRY_TTL_SECONDS, now),
        definition:
          "Blocker text recorded in the registry. Unverified testimony, not a live probe.",
        generatedAt,
      });
    });

    byProject[project.id] = {
      existenceEvidenceId,
      registeredClaimId,
      healthClaimId,
      blockerClaimIds,
    };
  }

  return { evidence, claims, registry, byProject };
}
