// Pure truth rules. No IO, no clock except the injected `now`. These encode the
// doctrine: unknown beats fake green, agent reports are testimony, stale
// evidence expires, deploy-green ≠ working.

import type {
  AgentStatus,
  Evidence,
  GlobalStatus,
  GlobalStatusLevel,
  Incident,
  ProjectState,
  ProjectStatus,
  VerificationStatus,
} from "./types";
import { computeFreshness } from "./ttl";

/**
 * Verification status implied by a set of evidence.
 * - No evidence → unknown.
 * - All evidence stale/expired → stale.
 * - Fresh passing evidence (ok === true) → verified.
 * - Fresh failing evidence (ok === false, none passing) → unverified
 *   (we have a fresh negative signal, but it does not prove the positive claim).
 * - Fresh evidence that is only uninformative (ok null, e.g. a probe that could
 *   not run / blocked egress) → unknown. No usable signal is not a soft pass.
 */
export function claimStatusFromEvidence(
  evidence: Evidence[],
  now: Date = new Date()
): VerificationStatus {
  if (evidence.length === 0) return "unknown";

  const fresh = evidence.filter(
    (e) => computeFreshness(e.observedAt, e.ttlSeconds, now).state === "fresh"
  );

  if (fresh.length === 0) return "stale";
  if (fresh.some((e) => e.ok === true)) return "verified";
  if (fresh.some((e) => e.ok === false)) return "unverified";
  return "unknown";
}

export interface AgentStatusResult {
  status: AgentStatus;
  label: string;
}

/**
 * An agent's status from its heartbeat evidence.
 * No heartbeat → UNKNOWN (never "online"). A stale heartbeat → offline. Only a
 * fresh, passing heartbeat yields "online" — and even then it is the agent's own
 * testimony that it is alive, not proof its work is correct.
 */
export function deriveAgentStatus(
  heartbeat: Evidence | null | undefined,
  now: Date = new Date()
): AgentStatusResult {
  if (!heartbeat) {
    return { status: "unknown", label: "Unknown — no heartbeat evidence" };
  }

  const freshness = computeFreshness(heartbeat.observedAt, heartbeat.ttlSeconds, now);

  if (freshness.state === "unknown") {
    return { status: "unknown", label: "Unknown — heartbeat has no usable timestamp" };
  }
  if (freshness.state === "stale") {
    return { status: "offline", label: "Offline — last heartbeat expired (stale)" };
  }
  if (heartbeat.ok === false) {
    return { status: "degraded", label: "Degraded — heartbeat reported a problem" };
  }
  return { status: "online", label: "Online — fresh heartbeat (self-reported)" };
}

export interface ProjectStateInput {
  /** Registry-claimed status text, if any. */
  claimedStatus?: string;
  /** Registry-claimed blockers. */
  blockers: string[];
  stage?: string;
  /** Fresh, passing health evidence (HTTP/browser/test). Absent for registry-only. */
  healthEvidence?: Evidence[];
}

export interface ProjectStateResult {
  state: ProjectState;
  label: string;
  /** True ONLY when fresh evidence proves health. Registry data never sets this. */
  verified: boolean;
}

/**
 * Project state. With no fresh health evidence the state is UNKNOWN regardless
 * of what the registry claims — registry status is testimony, not a live check.
 * Archived stage is the one purely-declarative state we honor.
 */
export function deriveProjectState(
  input: ProjectStateInput,
  now: Date = new Date()
): ProjectStateResult {
  if (input.stage === "archived") {
    return { state: "archived", label: "Archived", verified: false };
  }

  const health = input.healthEvidence ?? [];
  const verifiedStatus = claimStatusFromEvidence(health, now);

  if (verifiedStatus === "verified") {
    const anyFailing = health.some(
      (e) =>
        e.ok === false &&
        computeFreshness(e.observedAt, e.ttlSeconds, now).state === "fresh"
    );
    if (anyFailing) {
      return { state: "degraded", label: "Degraded — some live checks failing", verified: true };
    }
    return { state: "healthy", label: "Healthy — verified by fresh evidence", verified: true };
  }

  // No fresh passing evidence: we do not actually know it is healthy.
  const blockerSuffix = input.blockers.length
    ? ` — ${input.blockers.length} blocker${input.blockers.length === 1 ? "" : "s"} claimed`
    : "";
  return {
    state: "unknown",
    label: `Unknown — no live health evidence${blockerSuffix}`,
    verified: false,
  };
}

/**
 * Global status across the cockpit.
 * It is NOT all_clear whenever any project health is unknown, any agent is
 * unknown/offline, evidence is stale, or incidents are open. Fake green is
 * forbidden.
 */
export function deriveGlobalStatus(args: {
  projects: ProjectStatus[];
  agents: { status: AgentStatus }[];
  incidents: Incident[];
  staleEvidenceCount: number;
  unknownClaimCount: number;
}): GlobalStatus {
  const { projects, agents, incidents, staleEvidenceCount, unknownClaimCount } = args;

  const openCritical = incidents.filter(
    (i) => i.severity === "critical" && i.state !== "resolved"
  ).length;
  const openIncidents = incidents.filter((i) => i.state === "open" || i.state === "investigating").length;

  const brokenProjects = projects.filter((p) => p.state === "broken").length;
  const unknownProjects = projects.filter((p) => p.state === "unknown").length;
  const degradedProjects = projects.filter((p) => p.state === "degraded").length;
  const verifiedProjects = projects.filter((p) => p.verified).length;

  const unknownAgents = agents.filter(
    (a) => a.status === "unknown" || a.status === "offline"
  ).length;

  const evidenceIds: string[] = [];
  const claimIds: string[] = [];

  let level: GlobalStatusLevel;
  let label: string;
  let rationale: string;

  if (openCritical > 0 || brokenProjects > 0) {
    level = "critical";
    label = "Critical";
    rationale = `${openCritical} critical incident(s), ${brokenProjects} broken project(s).`;
  } else if (degradedProjects > 0) {
    level = "degraded";
    label = "Degraded";
    rationale = `${degradedProjects} project(s) verified degraded by fresh evidence.`;
  } else if (
    unknownProjects > 0 ||
    unknownAgents > 0 ||
    staleEvidenceCount > 0 ||
    unknownClaimCount > 0
  ) {
    level = "unknown";
    label = "Unknown — insufficient fresh evidence";
    rationale = `${verifiedProjects}/${projects.length} project(s) verified healthy; ${unknownProjects} unknown, ${unknownAgents} agent(s) unverified, ${staleEvidenceCount} stale evidence item(s), ${openIncidents} open risk(s). Unknown beats fake green.`;
  } else if (openIncidents > 0) {
    level = "attention";
    label = "Attention";
    rationale = `All projects verified, but ${openIncidents} open incident(s)/risk(s) need attention.`;
  } else if (projects.length === 0 && agents.length === 0) {
    level = "unknown";
    label = "Unknown — no signals";
    rationale = "No projects or agents reporting. Nothing to verify.";
  } else {
    level = "all_clear";
    label = "All clear";
    rationale = `All ${projects.length} project(s) verified healthy with fresh evidence and no open incidents.`;
  }

  return { level, label, rationale, claimIds, evidenceIds };
}
