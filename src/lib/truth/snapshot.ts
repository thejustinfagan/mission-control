// Snapshot builder — assembles the normalized Mission Control truth snapshot
// from connectors + pure rules. This is the single source the homepage and
// /api/mission-control both consume. Output is plain serializable JSON.

import type {
  Agent,
  Claim,
  Evidence,
  Incident,
  IncidentSeverity,
  JustinAction,
  JustinActionKind,
  JustinControl,
  MissionControlSnapshot,
  ProjectStatus,
  ProofFeedItem,
} from "./types";
import { staticRegistryConnector } from "./connectors/static";
import { httpProbeConnector, type HttpProbeTarget } from "./connectors/http";
import { localPathConnector, type LocalPathTarget } from "./connectors/local";
import { deriveAgentStatus, deriveGlobalStatus, deriveProjectState } from "./rules";
import { computeFreshness } from "./ttl";
import { nowIso, toEpochMs } from "./time";
import type { RegistryProject, RegistryAction } from "./registry";

// Known agents. We deliberately have NO live heartbeat source wired in, so both
// render Unknown — never "Online" — until real heartbeat evidence exists. We do
// not read Barry/Harry OpenClaw configs or any secrets.
const KNOWN_AGENTS: { id: string; name: string; role: string }[] = [
  { id: "barry", name: "Barry", role: "Build & operations agent" },
  { id: "harry", name: "Harry", role: "Secondary operations agent" },
];

/**
 * Severity for an UNVERIFIED registry-claimed blocker. Capped at "high": we
 * will not fake-red the whole cockpit off testimony. "critical" is reserved for
 * incidents backed by fresh failing evidence (e.g. a live probe returning 5xx).
 */
function registryBlockerSeverity(text: string): IncidentSeverity {
  if (/deadlock|broken|lost|exhausted|\bdead\b|\bdown\b|crash|fork bomb/i.test(text)) {
    return "high";
  }
  if (/needs?|set up|missing|redeploy|re-?stage/i.test(text)) return "medium";
  return "medium";
}

function classifyActionKind(label: string): JustinActionKind {
  if (/merge|approve|deploy|ship|release/i.test(label)) return "approval";
  if (/decide|decision|choose|pick/i.test(label)) return "decision";
  if (/fix|unblock|billing|set up|api key|\bkey\b|formspree|records request/i.test(label)) {
    return "unblock";
  }
  if (/verify|test|check|validate/i.test(label)) return "verify";
  return "review-artifact";
}

function controlsForKind(kind: JustinActionKind): JustinControl[] {
  switch (kind) {
    case "decision":
      return [
        { type: "approve", label: "Approve" },
        { type: "reject", label: "Reject" },
        { type: "defer", label: "Defer" },
        { type: "assign-to-agent", label: "Assign to agent" },
        { type: "explain", label: "Explain" },
      ];
    case "approval":
      return [
        { type: "approve", label: "Approve" },
        { type: "reject", label: "Reject" },
        { type: "defer", label: "Defer" },
        { type: "explain", label: "Explain" },
      ];
    case "unblock":
      return [
        { type: "unblock", label: "Mark unblocked" },
        { type: "assign-to-agent", label: "Assign to agent" },
        { type: "defer", label: "Defer" },
        { type: "explain", label: "Explain" },
      ];
    case "verify":
      return [
        { type: "rerun-verification", label: "Rerun verification" },
        { type: "view-artifact", label: "View artifact" },
        { type: "explain", label: "Explain" },
      ];
    case "review-artifact":
    default:
      return [
        { type: "view-artifact", label: "View artifact" },
        { type: "approve", label: "Approve" },
        { type: "defer", label: "Defer" },
        { type: "explain", label: "Explain" },
      ];
  }
}

const PRIORITY_RANK: Record<"high" | "medium" | "low", number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export interface BuildOptions {
  now?: Date;
  /**
   * Override HTTP probe targets. Omit to use MC_PROBE_URLS / committed defaults.
   * Pass [] to disable HTTP probing entirely (used by tests to stay offline).
   */
  probeTargets?: HttpProbeTarget[];
  /** Override local path probe targets. Omit to use MC_LOCAL_PATHS. */
  localTargets?: LocalPathTarget[];
}

export async function buildMissionControlSnapshot(
  options: BuildOptions = {}
): Promise<MissionControlSnapshot> {
  const now = options.now ?? new Date();
  const generatedAt = nowIso(now);

  // --- Connectors -----------------------------------------------------------
  const staticResult = staticRegistryConnector(now);
  // Probes are no-ops unless explicitly configured via env. Network/local
  // access is intentionally cautious; failures degrade to Unknown, not red.
  const httpResult = await httpProbeConnector(now, options.probeTargets).catch(() => ({
    evidence: [] as Evidence[],
    claims: [] as Claim[],
    byProject: {} as Record<string, { evidenceId: string; claimId: string }>,
  }));
  const localResult = await localPathConnector(now, options.localTargets).catch(() => ({
    evidence: [] as Evidence[],
    claims: [] as Claim[],
    byProject: {} as Record<string, { evidenceId: string; claimId: string }>,
  }));

  const evidence: Evidence[] = [
    ...staticResult.evidence,
    ...httpResult.evidence,
    ...localResult.evidence,
  ];
  const claims: Claim[] = [
    ...staticResult.claims,
    ...httpResult.claims,
    ...localResult.claims,
  ];

  const evidenceById = new Map(evidence.map((e) => [e.id, e]));

  // --- Agents ---------------------------------------------------------------
  const agents: Agent[] = KNOWN_AGENTS.map(({ id, name, role }) => {
    // No heartbeat evidence source exists, so status is Unknown by design.
    const heartbeat: Evidence | null = null;
    const { status, label } = deriveAgentStatus(heartbeat, now);
    const claimId = `cl:agent:${id}`;
    const agentClaim: Claim = {
      id: claimId,
      subject: `agent:${id}`,
      statement: `${name} status: ${label}`,
      status: status === "online" ? "verified" : "unknown",
      confidence: status === "online" ? "medium" : "none",
      evidenceIds: heartbeat ? [(heartbeat as Evidence).id] : [],
      freshness: computeFreshness(null, null, now),
      definition:
        "Agent status comes only from a fresh heartbeat. No heartbeat = Unknown, never Online.",
      generatedAt,
    };
    claims.push(agentClaim);
    return {
      id,
      name,
      role,
      status,
      statusLabel: label,
      lastHeartbeatAt: null,
      freshness: computeFreshness(null, null, now),
      claimIds: [claimId],
      evidenceIds: [],
    };
  });

  // --- Projects -------------------------------------------------------------
  const projects: ProjectStatus[] = [];
  const incidents: Incident[] = [];
  const justinQueue: JustinAction[] = [];

  for (const project of staticResult.registry) {
    const refs = staticResult.byProject[project.id];
    const httpRef = httpResult.byProject[project.id];
    const localRef = localResult.byProject[project.id];

    const reachEvidence = httpRef ? evidenceById.get(httpRef.evidenceId) ?? null : null;

    // Health is only proven by rendered/test evidence — none wired yet.
    let stateResult = deriveProjectState(
      {
        claimedStatus: project.claimedStatus,
        blockers: project.blockers,
        stage: project.stage,
        healthEvidence: [],
      },
      now
    );

    // A fresh, failing reachability probe is verified negative evidence.
    if (reachEvidence) {
      const f = computeFreshness(reachEvidence.observedAt, reachEvidence.ttlSeconds, now);
      if (f.state === "fresh" && reachEvidence.ok === false) {
        stateResult = {
          state: "degraded",
          label: "Degraded — live URL returning errors",
          verified: true,
        };
      }
    }

    const projectClaimIds = [
      refs.registeredClaimId,
      refs.healthClaimId,
      ...refs.blockerClaimIds,
      httpRef?.claimId,
      localRef?.claimId,
    ].filter(Boolean) as string[];

    const projectEvidenceIds = [
      refs.existenceEvidenceId,
      httpRef?.evidenceId,
      localRef?.evidenceId,
    ].filter(Boolean) as string[];

    const links: { label: string; url: string }[] = [];
    if (project.liveUrl) links.push({ label: "Live", url: project.liveUrl });
    if (project.repoUrl) links.push({ label: "Repo", url: project.repoUrl });

    projects.push({
      id: project.id,
      name: project.name,
      state: stateResult.state,
      stateLabel: stateResult.label,
      summary: project.tagline,
      registryStatus: project.claimedStatus,
      verified: stateResult.verified,
      claimIds: projectClaimIds,
      evidenceIds: projectEvidenceIds,
      links,
    });

    // Incidents from registry-claimed blockers (unverified testimony).
    project.blockers.forEach((blocker, i) => {
      incidents.push({
        id: `inc:${project.id}:${i}`,
        title: `${project.name}: ${blocker}`,
        severity: registryBlockerSeverity(blocker),
        state: "open",
        detail: `Registry-claimed blocker for ${project.name}. Unverified — no live probe confirms current status.`,
        subject: `project:${project.id}`,
        claimIds: [refs.blockerClaimIds[i]].filter(Boolean) as string[],
        evidenceIds: [refs.existenceEvidenceId],
      });
    });

    // Incident from a verified-failing reachability probe.
    if (reachEvidence && reachEvidence.ok === false) {
      const f = computeFreshness(reachEvidence.observedAt, reachEvidence.ttlSeconds, now);
      if (f.state === "fresh") {
        incidents.push({
          id: `inc:http:${project.id}`,
          title: `${project.name}: live URL returning errors`,
          severity: "high",
          state: "open",
          detail: reachEvidence.summary,
          subject: `project:${project.id}`,
          claimIds: httpRef ? [httpRef.claimId] : [],
          evidenceIds: [reachEvidence.id],
        });
      }
    }

    // Justin queue from registry actions owned by Justin.
    pushJustinActions(justinQueue, project, refs, project.justinActions);
    if (project.needsDecision) {
      const kind: JustinActionKind = "decision";
      justinQueue.push({
        id: `act:decision:${project.id}`,
        kind,
        title: project.needsDecision.question,
        detail: `Decision needed for ${project.name}.`,
        subject: `project:${project.id}`,
        priority: "high",
        controls: controlsForKind(kind),
        claimIds: [refs.registeredClaimId],
        evidenceIds: [refs.existenceEvidenceId],
      });
    }
  }

  justinQueue.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);

  // --- Proof feed -----------------------------------------------------------
  const proofFeed: ProofFeedItem[] = evidence
    .slice()
    .sort((a, b) => (toEpochMs(b.observedAt) ?? 0) - (toEpochMs(a.observedAt) ?? 0))
    .slice(0, 40)
    .map((e) => ({
      id: `proof:${e.id}`,
      at: e.observedAt,
      title: e.summary,
      source: e.source,
      evidenceId: e.id,
      freshness: computeFreshness(e.observedAt, e.ttlSeconds, now),
      ok: e.ok ?? null,
    }));

  // --- Freshness report -----------------------------------------------------
  const evidenceFreshness = evidence.map((e) =>
    computeFreshness(e.observedAt, e.ttlSeconds, now)
  );
  const freshEvidence = evidenceFreshness.filter((f) => f.state === "fresh").length;
  const staleEvidence = evidenceFreshness.filter((f) => f.state === "stale").length;
  const unknownClaims = claims.filter((c) => c.status === "unknown").length;
  const observedTimes = evidence
    .map((e) => toEpochMs(e.observedAt))
    .filter((n): n is number => n !== null)
    .sort((a, b) => a - b);
  const oldestEvidenceAt = observedTimes.length
    ? new Date(observedTimes[0]).toISOString()
    : null;
  const newestEvidenceAt = observedTimes.length
    ? new Date(observedTimes[observedTimes.length - 1]).toISOString()
    : null;

  // --- Global status --------------------------------------------------------
  const openIncidents = incidents.filter(
    (i) => i.state === "open" || i.state === "investigating"
  ).length;
  const globalStatus = deriveGlobalStatus({
    projects,
    agents: agents.map((a) => ({ status: a.status })),
    incidents,
    staleEvidenceCount: staleEvidence,
    unknownClaimCount: unknownClaims,
  });
  // Attach representative references so Explain on the global card is useful.
  globalStatus.claimIds = [
    ...projects.map((p) => p.claimIds.find((c) => c.startsWith("cl:health:"))).filter(Boolean) as string[],
    ...agents.map((a) => a.claimIds[0]),
  ];
  globalStatus.evidenceIds = projects.map((p) => p.evidenceIds[0]).filter(Boolean) as string[];

  // --- Summary --------------------------------------------------------------
  const verifiedHealthy = projects.filter((p) => p.verified && p.state === "healthy").length;
  const degraded = projects.filter((p) => p.state === "degraded").length;
  const unknown = projects.filter((p) => p.state === "unknown").length;

  return {
    generatedAt,
    globalStatus,
    summary: {
      totalProjects: projects.length,
      verifiedHealthy,
      degraded,
      unknown,
      openIncidents,
      justinActions: justinQueue.length,
      definitions: {
        totalProjects: "Projects present in the committed registry (src/data/projects.ts).",
        verifiedHealthy:
          "Projects proven healthy by fresh rendered/test evidence. Registry/HTTP-only does not count.",
        degraded: "Projects with fresh evidence showing live errors.",
        unknown: "Projects with no fresh health evidence — status genuinely unknown.",
        openIncidents: "Open or investigating incidents/risks across all projects.",
        justinActions: "Open decisions, approvals, unblocks, and verifications assigned to Justin.",
      },
    },
    freshness: {
      freshEvidence,
      staleEvidence,
      unknownClaims,
      oldestEvidenceAt,
      newestEvidenceAt,
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

function pushJustinActions(
  queue: JustinAction[],
  project: RegistryProject,
  refs: { registeredClaimId: string; existenceEvidenceId: string },
  actions: RegistryAction[]
): void {
  actions.forEach((action, i) => {
    const kind = classifyActionKind(action.label);
    queue.push({
      id: `act:${project.id}:${i}`,
      kind,
      title: action.label,
      detail: `${project.name}: ${action.label}`,
      subject: `project:${project.id}`,
      priority: action.priority,
      controls: controlsForKind(kind),
      claimIds: [refs.registeredClaimId],
      evidenceIds: [refs.existenceEvidenceId],
    });
  });
}
