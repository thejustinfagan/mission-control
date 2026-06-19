import { projects } from "@/data/projects";
import { AGENTS, REQUIRED_PROJECTS } from "../registry";
import { TTL } from "../ttl";
import type { Evidence, ProjectCard } from "../types";

export const LEGACY_STATUS_FALLBACK_CAPTURED_AT = "2026-03-16T12:09:00Z";

function asIsoDate(value?: string): string {
  if (!value) return LEGACY_STATUS_FALLBACK_CAPTURED_AT;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const dateOnly = new Date(`${value}T00:00:00Z`);
    return Number.isNaN(dateOnly.getTime()) ? LEGACY_STATUS_FALLBACK_CAPTURED_AT : dateOnly.toISOString();
  }
  return date.toISOString();
}

export function getStaticProjectCards(): ProjectCard[] {
  const known = new Map(projects.map((project) => [project.id, project]));
  const required = REQUIRED_PROJECTS.map((project) => {
    const existing = known.get(project.id);
    return {
      ...existing,
      ...project,
      tagline: existing?.tagline ?? project.objective,
      currentMilestone: project.objective,
      nextActions: existing?.nextActions ?? [],
      blockers: existing?.blockers ?? [],
      lastWorked: existing?.lastWorked,
    };
  });
  const extras = projects.filter((project) => !REQUIRED_PROJECTS.some((requiredProject) => requiredProject.id === project.id));

  return [...required, ...extras].map((project) => ({
    id: project.id,
    name: project.name,
    emoji: project.emoji,
    status: project.blockers && project.blockers.length > 0 ? "blocked" : "unknown",
    priority: project.priority ?? 99,
    objective: project.currentMilestone || project.tagline || "Static registry entry; current objective unverified",
    ownerAgent: project.nextActions?.find((action) => action.owner === "barry") ? "barry" : undefined,
    localPath: project.localPath,
    repoUrl: project.repoUrl,
    liveUrl: project.liveUrl,
    nextAction: project.nextActions?.find((action) => !action.completed)?.label,
    blocker: project.blockers?.[0],
    proofCount: 1,
    claimIds: [`claim.project.${project.id}.static_registry`],
    evidenceIds: [`evidence.static.project.${project.id}`],
  }));
}

export function collectStaticEvidence(): Evidence[] {
  const cards = getStaticProjectCards();
  const projectEvidence: Evidence[] = cards.map((project) => {
    const sourceProject = projects.find((candidate) => candidate.id === project.id);
    return {
      id: `evidence.static.project.${project.id}`,
      sourceType: "static_registry",
      sourceName: "src/data/projects.ts",
      subjectType: "project",
      subjectId: project.id,
      capturedAt: asIsoDate(sourceProject?.lastWorked),
      ttlSeconds: TTL.staticRegistry,
      status: "reported",
      confidence: "low",
      summary: `${project.name} exists in the static project registry; live state is unverified`,
      details: project.objective,
      artifactUrl: project.repoUrl,
      rawRef: `src/data/projects.ts:${project.id}`,
      metadata: {
        name: project.name,
        priority: project.priority,
        blocker: project.blocker,
        nextAction: project.nextAction,
        objective: project.objective,
      },
    };
  });

  const agentEvidence: Evidence[] = AGENTS.map((agent) => ({
    id: `evidence.static.agent.${agent.id}`,
    sourceType: "static_registry",
    sourceName: "src/lib/truth/registry.ts AGENTS",
    subjectType: "agent",
    subjectId: agent.id,
    capturedAt: LEGACY_STATUS_FALLBACK_CAPTURED_AT,
    ttlSeconds: TTL.staticRegistry,
    status: "unknown",
    confidence: "unknown",
    summary: `${agent.name} is registered as an agent lane, but no heartbeat proof is configured`,
    metadata: { role: agent.role },
  }));

  return [
    ...projectEvidence,
    ...agentEvidence,
    {
      id: "evidence.system.legacy_status_fallback",
      sourceType: "local_file",
      sourceName: "src/app/api/status/route.ts STATIC_FALLBACK",
      subjectType: "system",
      subjectId: "legacy-status-api",
      capturedAt: LEGACY_STATUS_FALLBACK_CAPTURED_AT,
      ttlSeconds: TTL.localFile,
      status: "stale",
      confidence: "high",
      summary: "Legacy /api/status static fallback is stale and must not be treated as live truth",
      rawRef: "src/app/api/status/route.ts:STATIC_FALLBACK",
    },
    {
      id: "evidence.system.legacy_incomplete_shape",
      sourceType: "local_file",
      sourceName: "src/app/api/status/route.ts STATIC_FALLBACK.incomplete",
      subjectType: "system",
      subjectId: "legacy-status-api",
      capturedAt: LEGACY_STATUS_FALLBACK_CAPTURED_AT,
      ttlSeconds: TTL.localFile,
      status: "failed",
      confidence: "high",
      summary: "Legacy static fallback historically used incomplete as strings; route now normalizes them for compatibility",
      rawRef: "src/app/api/status/route.ts:STATIC_FALLBACK.incomplete",
      metadata: { normalizedAtRuntime: true },
    },
  ];
}
