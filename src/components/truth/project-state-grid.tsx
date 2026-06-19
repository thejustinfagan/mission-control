"use client";

import type { ProjectCard } from "@/lib/truth/types";
import { ExplainButton, type ExplainRecord } from "./explain-drawer";
import { StatusPill } from "./status-pill";

export function ProjectStateGrid({ projects, onExplain }: { projects: ProjectCard[]; onExplain: (record: ExplainRecord) => void }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-white">Projects</h2>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <article key={project.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-3"><h3 className="font-bold text-white">{project.emoji} {project.name}</h3><StatusPill status={project.status} /></div>
            <p className="mt-2 text-sm text-slate-300">{project.objective}</p>
            {project.nextAction && <p className="mt-2 text-xs text-cyan-200">Next: {project.nextAction}</p>}
            {project.blocker && <p className="mt-2 text-xs text-amber-200">Blocker: {project.blocker}</p>}
            <p className="mt-2 text-xs text-slate-500">Proof rows: {project.proofCount}</p>
            <div className="mt-3"><ExplainButton record={{ id: project.id, title: project.name, status: project.status, evidenceIds: project.evidenceIds, claimIds: project.claimIds }} onExplain={onExplain} /></div>
          </article>
        ))}
      </div>
    </section>
  );
}
