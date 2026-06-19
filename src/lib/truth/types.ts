export type TruthStatus = "verified" | "reported" | "unverified" | "stale" | "unknown" | "failed";
export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type Confidence = "high" | "medium" | "low" | "unknown";

export type EvidenceSourceType =
  | "http_probe"
  | "github"
  | "railway"
  | "local_process"
  | "local_file"
  | "hermes_cron"
  | "hermes_session"
  | "agent_report"
  | "static_registry"
  | "browser_check"
  | "manual_note";

export interface Evidence {
  id: string;
  sourceType: EvidenceSourceType;
  sourceName: string;
  subjectType: "agent" | "project" | "system" | "run" | "action" | "ui";
  subjectId: string;
  capturedAt: string;
  ttlSeconds: number;
  status: TruthStatus;
  confidence: Confidence;
  summary: string;
  details?: string;
  artifactUrl?: string;
  rawRef?: string;
  metadata?: Record<string, unknown>;
}

export interface Claim {
  id: string;
  subjectType: Evidence["subjectType"];
  subjectId: string;
  title: string;
  status: TruthStatus;
  severity: Severity;
  confidence: Confidence;
  summary: string;
  lastVerifiedAt?: string;
  expiresAt?: string;
  evidenceIds: string[];
  ruleId: string;
  recommendedAction?: string;
}

export interface AgentCard {
  id: "barry" | "harry" | "bruce" | "larry" | "randy" | "hermes" | string;
  name: string;
  role: string;
  status: "working" | "idle" | "blocked" | "stale" | "offline" | "unknown";
  confidence: Confidence;
  currentTask?: string;
  lastHeartbeatAt?: string;
  lastProof?: string;
  blocker?: string;
  claimIds: string[];
  evidenceIds: string[];
}

export interface ProjectCard {
  id: string;
  name: string;
  emoji?: string;
  status: "active" | "blocked" | "degraded" | "stale" | "paused" | "unknown";
  priority: number;
  objective: string;
  ownerAgent?: string;
  localPath?: string;
  repoUrl?: string;
  liveUrl?: string;
  nextAction?: string;
  blocker?: string;
  lastVerifiedAt?: string;
  proofCount: number;
  claimIds: string[];
  evidenceIds: string[];
}

export interface JustinAction {
  id: string;
  type: "approve" | "decide" | "review" | "unblock" | "provide_input" | "confirm_destructive";
  title: string;
  projectId?: string;
  agentId?: string;
  urgency: Severity;
  whyJustin: string;
  recommendation?: string;
  risk?: string;
  options: string[];
  claimIds: string[];
  evidenceIds: string[];
}

export interface Incident {
  id: string;
  severity: Severity;
  title: string;
  affected: string;
  symptom: string;
  suspectedCause?: string;
  status: "open" | "monitoring" | "resolved";
  firstSeenAt: string;
  lastSeenAt: string;
  recommendedAction?: string;
  claimIds: string[];
  evidenceIds: string[];
}

export interface ProofFeedItem {
  id: string;
  capturedAt: string;
  label: string;
  source: string;
  status: TruthStatus;
  confidence: Confidence;
  artifactUrl?: string;
  subjectLabel: string;
}

export interface MissionControlSnapshot {
  generatedAt: string;
  globalStatus: "all_clear" | "needs_justin" | "agent_blocked" | "production_broken" | "data_stale" | "unknown";
  headline: string;
  summary: {
    justinActions: number;
    openIncidents: number;
    agentsWorking: number;
    agentsUnknown: number;
    staleClaims: number;
    verifiedProofs: number;
  };
  freshness: {
    label: string;
    worstStatus: "fresh" | "stale" | "unknown";
    generatedAt: string;
  };
  justinQueue: JustinAction[];
  agents: AgentCard[];
  projects: ProjectCard[];
  incidents: Incident[];
  proofFeed: ProofFeedItem[];
  claims: Claim[];
  evidence: Evidence[];
}
