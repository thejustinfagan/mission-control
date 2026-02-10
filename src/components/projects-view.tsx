"use client";

import { useState } from "react";
import Link from "next/link";
import { projects as projectsData, Project } from "@/data/projects";

type StageType = "production" | "testing" | "development" | "planning" | "research" | "archived";

// Transform rich Project data to view format
interface ViewProject {
  id: string;
  name: string;
  emoji: string;
  stage: StageType;
  priority: number;
  status: string;
  lastWorked: string;
  nextAction: string;
  blockers: string;
  liveUrl?: string;
  progress?: string;
  needsDecision?: boolean;
  daysStale?: number;
}

function toViewProject(p: Project): ViewProject {
  const justinActions = p.nextActions.filter(a => a.owner === 'justin' && !a.completed);
  const barryActions = p.nextActions.filter(a => a.owner === 'barry' && !a.completed);
  const nextAction = justinActions[0]?.label || barryActions[0]?.label || 'No actions';
  
  // Calculate days stale
  const lastWorkedDate = new Date(p.lastWorked);
  const now = new Date();
  const daysStale = Math.floor((now.getTime() - lastWorkedDate.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    id: p.id,
    name: p.name,
    emoji: p.emoji,
    stage: p.stage,
    priority: p.priority,
    status: p.status,
    lastWorked: p.lastWorked,
    nextAction,
    blockers: p.blockers.length > 0 ? p.blockers.join(', ') : 'none',
    liveUrl: p.liveUrl,
    progress: p.metrics ? p.metrics.map(m => `${m.label}: ${m.value}`).join(' • ') : undefined,
    needsDecision: !!p.needsDecision,
    daysStale: daysStale >= 3 ? daysStale : undefined,
  };
}

const projects: ViewProject[] = projectsData.map(toViewProject);

const stageConfig: Record<StageType, { label: string; color: string; bgColor: string; borderColor: string }> = {
  production: {
    label: "🚀 Production",
    color: "text-aurora-400",
    bgColor: "bg-aurora-500/15",
    borderColor: "border-aurora-500/30",
  },
  testing: {
    label: "🧪 Testing",
    color: "text-amber-400",
    bgColor: "bg-amber-500/15",
    borderColor: "border-amber-500/30",
  },
  development: {
    label: "🔨 Development",
    color: "text-blue-400",
    bgColor: "bg-blue-500/15",
    borderColor: "border-blue-500/30",
  },
  planning: {
    label: "📐 Planning",
    color: "text-purple-400",
    bgColor: "bg-purple-500/15",
    borderColor: "border-purple-500/30",
  },
  research: {
    label: "🔍 Research",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/15",
    borderColor: "border-cyan-500/30",
  },
  archived: {
    label: "📦 Archived",
    color: "text-slate-400",
    bgColor: "bg-slate-500/15",
    borderColor: "border-slate-500/30",
  },
};

const stages: StageType[] = ["production", "testing", "development", "planning", "research", "archived"];

function ProjectCard({ project }: { project: ViewProject }) {
  return (
    <Link href={`/projects/${project.id}`}>
      <article className="rounded-2xl border border-slate-800/80 bg-midnight-800/80 p-4 transition hover:border-aurora-500/40 cursor-pointer group">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{project.emoji}</span>
            <div>
              <h3 className="font-semibold text-white group-hover:text-aurora-300 transition">{project.name}</h3>
              <p className="text-xs text-slate-400">{project.status}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {project.needsDecision && (
              <span className="rounded-full bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 text-xs text-rose-300">
                ⚠️ Decision Needed
              </span>
            )}
            {project.daysStale && project.daysStale >= 3 && (
              <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-xs text-amber-300">
                {project.daysStale}d stale
              </span>
            )}
          </div>
        </div>
        
        {project.progress && (
          <p className="mt-2 text-sm text-slate-300">{project.progress}</p>
        )}
        
        <div className="mt-3 space-y-1.5">
          <p className="text-xs text-slate-400">
            <span className="text-slate-500">Next:</span> {project.nextAction}
          </p>
          {project.blockers !== "none" && (
            <p className="text-xs text-rose-400">
              <span className="text-rose-500">Blocked:</span> {project.blockers}
            </p>
          )}
        </div>
        
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-slate-500">Last: {project.lastWorked}</span>
          <div className="flex items-center gap-2">
            {project.liveUrl && (
              <span
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(project.liveUrl, '_blank');
                }}
                className="rounded-lg bg-aurora-500/10 border border-aurora-500/30 px-2 py-1 text-xs text-aurora-300 hover:bg-aurora-500/20 transition"
              >
                View Live →
              </span>
            )}
            <span className="text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition">
              Details →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export function ProjectsView() {
  const [selectedStage, setSelectedStage] = useState<StageType | "all">("all");
  
  const stageCounts = stages.reduce((acc, stage) => {
    acc[stage] = projects.filter((p) => p.stage === stage).length;
    return acc;
  }, {} as Record<StageType, number>);
  
  const filteredProjects = selectedStage === "all" 
    ? projects 
    : projects.filter((p) => p.stage === selectedStage);
  
  const needsAttention = projects.filter((p) => p.needsDecision || (p.daysStale && p.daysStale >= 3));
  
  return (
    <>
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="glass-panel rounded-2xl px-5 py-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Total Projects</p>
          <p className="mt-3 text-3xl font-semibold text-white">{projects.length}</p>
          <p className="mt-2 text-xs text-slate-400">Across all stages</p>
        </div>
        <div className="glass-panel rounded-2xl px-5 py-4">
          <p className="text-xs uppercase tracking-[0.3em] text-aurora-400">In Production</p>
          <p className="mt-3 text-3xl font-semibold text-aurora-300">{stageCounts.production}</p>
          <p className="mt-2 text-xs text-slate-400">Live & deployed</p>
        </div>
        <div className="glass-panel rounded-2xl px-5 py-4">
          <p className="text-xs uppercase tracking-[0.3em] text-blue-400">In Development</p>
          <p className="mt-3 text-3xl font-semibold text-blue-300">{stageCounts.development}</p>
          <p className="mt-2 text-xs text-slate-400">Being built</p>
        </div>
        <div className="glass-panel rounded-2xl px-5 py-4">
          <p className="text-xs uppercase tracking-[0.3em] text-rose-400">Needs Attention</p>
          <p className="mt-3 text-3xl font-semibold text-rose-300">{needsAttention.length}</p>
          <p className="mt-2 text-xs text-slate-400">Stale or blocked</p>
        </div>
      </div>
      
      {/* Needs Attention Alert */}
      {needsAttention.length > 0 && (
        <div className="mt-6 glass-panel rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4">
          <h3 className="text-sm font-semibold text-rose-300">⚠️ Needs Attention</h3>
          <div className="mt-2 space-y-1">
            {needsAttention.map((p) => (
              <p key={p.id} className="text-sm text-slate-300">
                <span className="text-rose-400">{p.emoji} {p.name}:</span> {p.blockers !== "none" ? p.blockers : `${p.daysStale}d stale`}
              </p>
            ))}
          </div>
        </div>
      )}
      
      {/* Stage Filter */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedStage("all")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            selectedStage === "all"
              ? "bg-slate-700/50 text-white border border-slate-600"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          All ({projects.length})
        </button>
        {stages.map((stage) => {
          const config = stageConfig[stage];
          const count = stageCounts[stage];
          if (count === 0) return null;
          return (
            <button
              key={stage}
              onClick={() => setSelectedStage(stage)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                selectedStage === stage
                  ? `${config.bgColor} ${config.color} border ${config.borderColor}`
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              {config.label} ({count})
            </button>
          );
        })}
      </div>
      
      {/* Project Grid */}
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects
          .sort((a, b) => a.priority - b.priority)
          .map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
      </div>
    </>
  );
}
