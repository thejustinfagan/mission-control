"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { projects, getJustinActions, type Project, type ProjectAction } from "@/data/projects";

const STAGE_STYLES: Record<Project["stage"], { chip: string; dot: string }> = {
  production: { chip: "bg-emerald-500/20 text-emerald-200 border-emerald-400/40", dot: "bg-emerald-400" },
  testing: { chip: "bg-amber-500/20 text-amber-200 border-amber-400/40", dot: "bg-amber-400" },
  development: { chip: "bg-sky-500/20 text-sky-200 border-sky-400/40", dot: "bg-sky-400" },
  planning: { chip: "bg-purple-500/20 text-purple-200 border-purple-400/40", dot: "bg-purple-400" },
  research: { chip: "bg-red-500/20 text-red-200 border-red-400/40", dot: "bg-red-400" },
  archived: { chip: "bg-slate-500/20 text-slate-300 border-slate-500/40", dot: "bg-slate-400" },
};

const PRIORITY_LABELS: Record<ProjectAction["priority"], { icon: string; color: string }> = {
  high: { icon: "🟠", color: "text-amber-300" },
  medium: { icon: "🟡", color: "text-yellow-300" },
  low: { icon: "⚪", color: "text-slate-400" },
};

type StageFilter = "all" | Project["stage"];

function ProgressBar({ value }: { value: number }) {
  const color =
    value >= 80 ? "bg-emerald-400" : value >= 50 ? "bg-sky-400" : value >= 25 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-800">
      <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
}

function ProjectCard({ project, expanded, onToggle }: { project: Project; expanded: boolean; onToggle: () => void }) {
  const stage = STAGE_STYLES[project.stage];

  return (
    <div className="glass-panel rounded-2xl border border-slate-800/80 transition hover:border-slate-700/80">
      {/* Header — always visible */}
      <button onClick={onToggle} className="w-full px-5 py-4 text-left">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{project.emoji}</span>
            <div>
              <h3 className="text-base font-semibold text-white">{project.name}</h3>
              <p className="mt-0.5 text-xs text-slate-400">{project.tagline}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.15em] ${stage.chip}`}>
              {project.stage}
            </span>
            <span className="text-xs text-slate-500">{expanded ? "▲" : "▼"}</span>
          </div>
        </div>

        {/* Status + progress */}
        <div className="mt-3">
          <p className="text-xs text-slate-300">{project.status}</p>
          {project.progress != null && (
            <div className="mt-2 flex items-center gap-3">
              <div className="flex-1">
                <ProgressBar value={project.progress} />
              </div>
              <span className="text-[10px] font-medium text-slate-400">{project.progress}%</span>
            </div>
          )}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-slate-800/60 px-5 py-4">
          {/* Current milestone */}
          {project.currentMilestone && (
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Current Milestone</p>
              <p className="mt-1 text-sm text-slate-200">{project.currentMilestone}</p>
            </div>
          )}

          {/* Metrics grid */}
          {project.metrics && project.metrics.length > 0 && (
            <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
              {project.metrics.map((m) => (
                <div key={m.label} className="rounded-xl bg-slate-900/60 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{m.label}</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {m.value}
                    {m.trend === "up" && " ↑"}
                    {m.trend === "down" && " ↓"}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Revenue */}
          {project.revenueStatus && (
            <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-400/80">Revenue</p>
              <p className="mt-1 text-sm text-emerald-200">
                ${project.revenueStatus.current.toLocaleString()} current / $
                {project.revenueStatus.potential.toLocaleString()} potential
              </p>
            </div>
          )}

          {/* Blockers */}
          {project.blockers.length > 0 && (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-red-400/80">Blockers</p>
              {project.blockers.map((b, i) => (
                <p key={i} className="mt-1 text-xs text-red-200">
                  ⚠️ {b}
                </p>
              ))}
            </div>
          )}

          {/* Decision needed */}
          {project.needsDecision && (
            <div className="mb-4 rounded-xl border border-purple-500/20 bg-purple-500/5 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-purple-400/80">Decision Needed</p>
              <p className="mt-1 text-xs text-purple-200">{project.needsDecision.question}</p>
              {project.needsDecision.options && (
                <ul className="mt-1 list-inside list-disc text-xs text-purple-300/80">
                  {project.needsDecision.options.map((o, i) => (
                    <li key={i}>{o}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Next actions */}
          {project.nextActions.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Next Actions</p>
              <div className="mt-2 space-y-1.5">
                {project.nextActions.map((a, i) => {
                  const p = PRIORITY_LABELS[a.priority];
                  return (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span>{p.icon}</span>
                      <span className={a.completed ? "text-slate-500 line-through" : "text-slate-200"}>
                        {a.label}
                      </span>
                      <span className="ml-auto whitespace-nowrap rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-400">
                        {a.owner === "barry" ? "🤖 Barry" : "👤 Justin"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tech stack */}
          {project.techStack && (
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Tech Stack</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {project.techStack.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-slate-700/60 bg-slate-800/60 px-2 py-0.5 text-[10px] text-slate-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent updates */}
          {project.recentUpdates && project.recentUpdates.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Recent Updates</p>
              <div className="mt-1.5 space-y-1">
                {project.recentUpdates.slice(0, 4).map((u, i) => (
                  <p key={i} className="text-xs text-slate-400">
                    {u}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Key decisions */}
          {project.keyDecisions && project.keyDecisions.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Key Decisions</p>
              <div className="mt-1.5 space-y-1">
                {project.keyDecisions.map((d, i) => (
                  <p key={i} className="text-xs text-slate-400">
                    <span className="text-slate-500">{d.date}:</span> {d.decision}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          <div className="mt-4 flex flex-wrap gap-2">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[10px] text-emerald-300 transition hover:bg-emerald-500/20"
              >
                🌐 Live
              </a>
            )}
            {project.repoUrl && (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-slate-600/40 bg-slate-700/20 px-3 py-1 text-[10px] text-slate-300 transition hover:bg-slate-600/30"
              >
                📦 GitHub
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectsPage() {
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const justinActions = useMemo(() => getJustinActions(), []);

  const filtered = useMemo(() => {
    if (stageFilter === "all") return projects;
    return projects.filter((p) => p.stage === stageFilter);
  }, [stageFilter]);

  const stages = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach((p) => {
      counts[p.stage] = (counts[p.stage] || 0) + 1;
    });
    return counts;
  }, []);

  const summary = useMemo(() => {
    const total = projects.length;
    const inProduction = projects.filter((p) => p.stage === "production").length;
    const blocked = projects.filter((p) => p.blockers.length > 0).length;
    const justinTasks = justinActions.length;
    return { total, inProduction, blocked, justinTasks };
  }, [justinActions]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-midnight-900">
      <div className="absolute inset-0 bg-grid-fade" />
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        {/* Header */}
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-aurora-400/80">Mission Control</p>
              <h1 className="mt-2 text-2xl font-semibold text-white">Projects</h1>
              <p className="mt-1 text-xs text-slate-400">
                All active projects, milestones, and next actions.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-midnight-800/60 px-3 py-1 text-xs text-slate-300 transition hover:border-aurora-500/40 hover:text-aurora-200"
            >
              ← Command Center
            </Link>
          </div>
          <Navigation />
        </header>

        {/* Summary cards */}
        <section className="grid gap-3 md:grid-cols-4">
          <div className="glass-panel rounded-2xl px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Total Projects</p>
            <p className="mt-2 text-2xl font-semibold text-white">{summary.total}</p>
          </div>
          <div className="glass-panel rounded-2xl px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">In Production</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-300">{summary.inProduction}</p>
          </div>
          <div className="glass-panel rounded-2xl px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Blocked</p>
            <p className="mt-2 text-2xl font-semibold text-red-300">{summary.blocked}</p>
          </div>
          <div className="glass-panel rounded-2xl px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Justin&apos;s Tasks</p>
            <p className="mt-2 text-2xl font-semibold text-amber-300">{summary.justinTasks}</p>
          </div>
        </section>

        {/* Justin's action items */}
        {justinActions.length > 0 && (
          <section className="glass-panel rounded-3xl p-6">
            <h2 className="text-lg font-semibold text-white">👤 Justin&apos;s Action Items</h2>
            <p className="mt-1 text-xs text-slate-400">
              Tasks that need your attention across all projects.
            </p>
            <div className="mt-4 space-y-2">
              {justinActions.map(({ project, action }, i) => {
                const pri = PRIORITY_LABELS[action.priority];
                return (
                  <div key={i} className="flex items-start gap-3 rounded-xl bg-slate-900/40 px-4 py-2.5">
                    <span>{pri.icon}</span>
                    <div className="flex-1 text-xs">
                      <p className="text-slate-200">{action.label}</p>
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        {project.emoji} {project.name}
                      </p>
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider ${pri.color}`}>{action.priority}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Stage filter */}
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "production", "testing", "development", "planning", "research"] as const).map((s) => {
            const count = s === "all" ? projects.length : stages[s] || 0;
            if (count === 0 && s !== "all") return null;
            const isActive = stageFilter === s;
            return (
              <button
                key={s}
                onClick={() => setStageFilter(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  isActive
                    ? "bg-aurora-500/20 text-aurora-200 border border-aurora-500/50"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
                }`}
              >
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)} ({count})
              </button>
            );
          })}
        </div>

        {/* Project cards */}
        <section className="space-y-3">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              expanded={expandedId === project.id}
              onToggle={() => setExpandedId(expandedId === project.id ? null : project.id)}
            />
          ))}
        </section>

        {/* Last updated footer */}
        <footer className="text-center text-[10px] text-slate-600">
          Data last synced: 2026-03-31 01:00 CT by Barry (Nightly Amazement Build)
        </footer>
      </div>
    </main>
  );
}
