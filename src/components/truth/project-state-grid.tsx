"use client";

import type { ProjectCard } from "@/lib/truth/types";
import { ExplainButton, type ExplainRecord } from "./explain-drawer";
import { StatusPill } from "./status-pill";

export function ProjectStateGrid({
  projects,
  activeProjectId,
  onSelectProject,
  onExplain,
}: {
  projects: ProjectCard[];
  activeProjectId?: string | null;
  onSelectProject?: (projectId: string) => void;
  onExplain: (record: ExplainRecord) => void;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-white">Projects</h2>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">tap a project</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => {
          const selected = activeProjectId === project.id;
          const record = {
            id: project.id,
            title: project.name,
            status: project.status,
            evidenceIds: project.evidenceIds,
            claimIds: project.claimIds,
          };

          return (
            <article key={project.id} className={`rounded-2xl border p-4 transition ${selected ? "border-cyan-300/70 bg-cyan-400/[0.08]" : "border-white/10 bg-white/[0.03] hover:border-cyan-300/40 hover:bg-white/[0.05]"}`}>
              <button type="button" onClick={() => onSelectProject?.(project.id)} className="block w-full text-left" aria-pressed={selected}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-white">{project.emoji} {project.name}</h3>
                  <StatusPill status={project.status} />
                </div>
                <p className="mt-2 text-sm text-slate-300">{project.objective}</p>
                {project.nextAction && <p className="mt-2 text-xs text-cyan-200">Next: {project.nextAction}</p>}
                {project.blocker && <p className="mt-2 text-xs text-amber-200">Blocker: {project.blocker}</p>}
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span>Priority: {project.priority}</span>
                  <span>Proof rows: {project.proofCount}</span>
                  {project.ownerAgent && <span>Owner: {project.ownerAgent}</span>}
                </div>
              </button>
              <div className="mt-3 flex flex-wrap gap-2">
                <ExplainButton record={record} onExplain={onExplain} />
                {project.liveUrl && (
                  <a className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-cyan-200 transition hover:border-cyan-300/60 hover:text-cyan-100" href={project.liveUrl} target="_blank" rel="noreferrer">
                    Live
                  </a>
                )}
                {project.repoUrl && (
                  <a className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/60 hover:text-cyan-100" href={project.repoUrl} target="_blank" rel="noreferrer">
                    Repo
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
