// Mission Control v2 — Truth domain types.
//
// Every visible operational claim must carry: source, timestamp, TTL/freshness,
// confidence, and evidence. If a claim cannot be verified, it is Unknown,
// Unverified, or Stale — never fake green.

/** How much we trust a claim, given its supporting evidence. */
export type Confidence = "high" | "medium" | "low" | "none";

/** Verification state of a single claim. */
export type VerificationStatus =
  | "verified" // fresh evidence proves it
  | "unverified" // asserted, but no proof (e.g. agent testimony, static registry)
  | "unknown" // no information at all
  | "stale"; // had evidence, but it expired past its TTL

/** Where a piece of evidence came from. */
export type EvidenceKind =
  | "static-registry" // committed registry file — metadata, NOT health proof
  | "http-probe" // configured public URL probe, no credentials
  | "local-path" // local filesystem check (renders unknown on Railway)
  | "agent-heartbeat" // an agent reported in — testimony, not proof
  | "deploy-status" // deploy succeeded — does not mean product works
  | "browser-render" // rendered/browser proof of a working surface
  | "test-result" // automated test outcome
  | "manual"; // human-entered observation

export interface EvidenceSource {
  type:
    | "static"
    | "http"
    | "local"
    | "agent"
    | "deploy"
    | "browser"
    | "test"
    | "manual";
  /** Human-readable, exact name. No ambiguous shorthand. */
  label: string;
  /** url / path / identifier the evidence points at. */
  ref?: string;
}

/** Freshness of an observation relative to its TTL. */
export interface Freshness {
  state: "fresh" | "stale" | "unknown";
  observedAt: string | null;
  ttlSeconds: number | null;
  ageSeconds: number | null;
  expiresAt: string | null;
}

export interface Evidence {
  id: string;
  kind: EvidenceKind;
  source: EvidenceSource;
  /** ISO-8601 timestamp the evidence was observed. */
  observedAt: string;
  /** Seconds the observation stays fresh. <= 0 means it is never fresh on its own. */
  ttlSeconds: number;
  /** What this evidence shows, in plain language. */
  summary: string;
  detail?: string;
  /** Probe outcome: true=pass, false=fail, null/undefined=not a pass/fail signal. */
  ok?: boolean | null;
  /** Raw payload, surfaced only behind Explain/Debug. */
  raw?: unknown;
}

export interface Claim {
  id: string;
  /** Entity this claim is about, e.g. "agent:barry" or "project:fleet-intel". */
  subject: string;
  /** The human-readable assertion. */
  statement: string;
  status: VerificationStatus;
  confidence: Confidence;
  /** Supporting evidence ids. A claim with no evidence cannot be verified. */
  evidenceIds: string[];
  freshness: Freshness;
  /** How this is measured — every number/metric has a visible definition. */
  definition?: string;
  generatedAt: string;
}

export type AgentStatus = "online" | "offline" | "degraded" | "unknown";

export interface Agent {
  id: string;
  /** Exact name, e.g. "Barry". */
  name: string;
  role: string;
  status: AgentStatus;
  /** e.g. "Unknown — no heartbeat evidence". */
  statusLabel: string;
  lastHeartbeatAt: string | null;
  freshness: Freshness;
  claimIds: string[];
  evidenceIds: string[];
}

export type ProjectState =
  | "healthy"
  | "degraded"
  | "broken"
  | "unknown"
  | "archived";

export interface ProjectStatus {
  id: string;
  /** Exact name, e.g. "Battle Dinghy". */
  name: string;
  state: ProjectState;
  stateLabel: string;
  summary: string;
  /** What the static registry asserts — not the same as verified health. */
  registryStatus?: string;
  /** True only when fresh evidence proves health. Registry data never sets this. */
  verified: boolean;
  claimIds: string[];
  evidenceIds: string[];
  links?: { label: string; url: string }[];
}

export type IncidentSeverity = "critical" | "high" | "medium" | "low";

export interface Incident {
  id: string;
  title: string;
  severity: IncidentSeverity;
  state: "open" | "investigating" | "resolved" | "unknown";
  detail: string;
  /** project/agent id this incident concerns. */
  subject?: string;
  claimIds: string[];
  evidenceIds: string[];
}

export type JustinActionKind =
  | "decision"
  | "approval"
  | "unblock"
  | "verify"
  | "review-artifact";

export type JustinControlType =
  | "approve"
  | "reject"
  | "defer"
  | "unblock"
  | "rerun-verification"
  | "assign-to-agent"
  | "view-artifact"
  | "explain";

export interface JustinControl {
  type: JustinControlType;
  label: string;
}

export interface JustinAction {
  id: string;
  kind: JustinActionKind;
  title: string;
  detail: string;
  subject?: string;
  priority: "high" | "medium" | "low";
  controls: JustinControl[];
  claimIds: string[];
  evidenceIds: string[];
}

export interface ProofFeedItem {
  id: string;
  at: string;
  title: string;
  source: EvidenceSource;
  evidenceId: string;
  freshness: Freshness;
  /** Pass/fail of the underlying evidence, or null when not a pass/fail signal. */
  ok: boolean | null;
}

export type ProofSlotId =
  | "change"
  | "repo"
  | "branch"
  | "commit"
  | "tests"
  | "deploy"
  | "liveVerification"
  | "blocker"
  | "nextAction";

export interface ProofSlot {
  id: ProofSlotId;
  label: string;
  value: string;
  status: VerificationStatus;
  ref?: string;
}

export interface ProofCard {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  status: VerificationStatus;
  confidence: Confidence;
  updatedAt: string;
  requiredSlots: ProofSlotId[];
  slots: Record<ProofSlotId, ProofSlot>;
  claimIds: string[];
  evidenceIds: string[];
}

export type GlobalStatusLevel =
  | "all_clear"
  | "attention"
  | "degraded"
  | "critical"
  | "unknown";

export interface GlobalStatus {
  level: GlobalStatusLevel;
  label: string;
  rationale: string;
  claimIds: string[];
  evidenceIds: string[];
}

export interface SnapshotSummary {
  totalProjects: number;
  verifiedHealthy: number;
  degraded: number;
  unknown: number;
  openIncidents: number;
  justinActions: number;
  /** Visible definition for every headline number. */
  definitions: Record<string, string>;
}

export interface FreshnessReport {
  freshEvidence: number;
  staleEvidence: number;
  unknownClaims: number;
  oldestEvidenceAt: string | null;
  newestEvidenceAt: string | null;
}

export interface MissionControlSnapshot {
  generatedAt: string;
  globalStatus: GlobalStatus;
  summary: SnapshotSummary;
  freshness: FreshnessReport;
  justinQueue: JustinAction[];
  agents: Agent[];
  projects: ProjectStatus[];
  incidents: Incident[];
  proofCards: ProofCard[];
  proofFeed: ProofFeedItem[];
  claims: Claim[];
  evidence: Evidence[];
}

/** Output of a connector: evidence plus the claims that evidence supports. */
export interface ConnectorResult {
  evidence: Evidence[];
  claims: Claim[];
}
