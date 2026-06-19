// Static project registry — a committed list of known projects.
//
// IMPORTANT: this is metadata, not live proof. Registry data describes what we
// believe exists and what was last claimed about it; it must NEVER cause a
// project to render as verified-healthy. Health requires fresh probe/browser
// evidence, which the registry does not provide.

import { projects as registryProjects, type Project, type ProjectAction } from "@/data/projects";

export interface RegistryProject {
  id: string;
  /** Exact name, spelled out (e.g. "Battle Dinghy"). */
  name: string;
  tagline: string;
  /** Free-text status the registry asserts. Testimony, not verified health. */
  claimedStatus: string;
  stage: Project["stage"];
  priority: number;
  /** ISO date (yyyy-mm-dd) the registry says the project was last worked. */
  lastWorked: string;
  liveUrl?: string;
  repoUrl?: string;
  localPath?: string;
  blockers: string[];
  needsDecision?: { question: string; options?: string[] };
  /** Open next-actions owned by Justin (decisions/approvals/unblocks live here). */
  justinActions: RegistryAction[];
}

export interface RegistryAction {
  label: string;
  priority: ProjectAction["priority"];
}

function justinActionsFor(project: Project): RegistryAction[] {
  return project.nextActions
    .filter((a) => a.owner === "justin" && !a.completed)
    .map((a) => ({ label: a.label, priority: a.priority }));
}

/** Normalize the raw projects.ts registry into the truth model's shape. */
export function loadRegistry(): RegistryProject[] {
  return registryProjects.map((p) => ({
    id: p.id,
    name: p.name,
    tagline: p.tagline,
    claimedStatus: p.status,
    stage: p.stage,
    priority: p.priority,
    lastWorked: p.lastWorked,
    liveUrl: p.liveUrl,
    repoUrl: p.repoUrl,
    localPath: p.localPath,
    blockers: p.blockers ?? [],
    needsDecision: p.needsDecision,
    justinActions: justinActionsFor(p),
  }));
}
