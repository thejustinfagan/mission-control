"use client";

import type { ProjectStatus } from "@/lib/truth/types";
import { StatusPill, projectTone } from "./status-pill";
import type { ExplainHandler } from "./explain-types";

export function ProjectStateGrid({
  projects,
  onExplain,
}: {
  projects: ProjectStatus[];
  onExplain: ExplainHandler;
}) {
  return (
    <section className="glass-panel rounded-2xl p-4">
      <p className="text-[10px] uppercase tracking-[0.3em] text-aurora-400/80">Project states</p>
      <h2 className="mb-3 text-sm font-semibold text-white">Projects ({projects.length})</h2>

      {projects.length === 0 ? (
        <p className="rounded-xl border border-slate-700/50 bg-slate-800/40 px-3 py-3 text-xs text-slate-400">
          No projects in the registry.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {projects.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{p.name}</p>
                  <p className="line-clamp-2 text-[11px] text-slate-400">{p.summary}</p>
                </div>
                <StatusPill tone={projectTone(p.state)} label={p.state} />
              </div>

              <p className="mt-2 text-[11px] text-slate-400">{p.stateLabel}</p>
              {!p.verified && (
                <p className="text-[10px] text-slate-600">
                  Registry claims: “{p.registryStatus}” — unverified, no live health proof.
                </p>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {p.links?.map((l) => (
                  <a
                    key={l.url}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border border-slate-700/60 px-2 py-0.5 text-[11px] text-slate-300 hover:bg-slate-700/40"
                  >
                    {l.label} ↗
                  </a>
                ))}
                <button
                  onClick={() =>
                    onExplain({
                      title: p.name,
                      subtitle: p.stateLabel,
                      claimIds: p.claimIds,
                      evidenceIds: p.evidenceIds,
                    })
                  }
                  className="rounded-md border border-aurora-500/40 px-2 py-0.5 text-[11px] font-medium text-aurora-300 hover:bg-aurora-500/10"
                >
                  Explain
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
