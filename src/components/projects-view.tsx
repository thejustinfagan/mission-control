"use client";

import { useState } from "react";
import Link from "next/link";

type StageType = "production" | "testing" | "development" | "planning" | "research" | "archived";

interface Project {
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

const projects: Project[] = [
  // PRODUCTION
  {
    id: "fleet-intel",
    name: "Fleet Intel v3",
    emoji: "🚛",
    stage: "production",
    priority: 1,
    status: "Deployed + Enhanced",
    lastWorked: "2026-02-08",
    nextAction: "Premium safety reports (PDF export)",
    blockers: "none",
    liveUrl: "https://sphere-scsi-wait-submitting.trycloudflare.com",
    progress: "4.38M carriers + 4.59M crash records",
  },
  {
    id: "battle-dinghy",
    name: "Battle Dinghy",
    emoji: "⚔️",
    stage: "production",
    priority: 2,
    status: "Game Factory MVP",
    lastWorked: "2026-02-07",
    nextAction: "Add Baseball Showdown as second game type",
    blockers: "none",
    liveUrl: "https://twitter.com/BattleDinghy",
    progress: "Igor rule pipeline deployed",
  },
  {
    id: "threadchess",
    name: "ThreadChess",
    emoji: "♟️",
    stage: "production",
    priority: 5,
    status: "Live on Railway",
    lastWorked: "2026-02-06",
    nextAction: "Monitor for stability",
    blockers: "none",
    liveUrl: "https://powerful-optimism-production.up.railway.app",
  },
  {
    id: "mission-control",
    name: "Mission Control",
    emoji: "🎛️",
    stage: "production",
    priority: 2,
    status: "Dashboard live",
    lastWorked: "2026-02-08",
    nextAction: "Real-time activity logging",
    blockers: "none",
    liveUrl: "https://mission-control-production-8b21.up.railway.app",
  },
  // TESTING
  {
    id: "baseball-showdown",
    name: "Baseball Showdown",
    emoji: "⚾",
    stage: "testing",
    priority: 3,
    status: "Phase 1 CLI Complete",
    lastWorked: "2026-02-08",
    nextAction: "Justin playtest, then Phase 2 (Ore Protocol)",
    blockers: "none",
    progress: "63/63 tests passing, 10 games validated",
  },
  {
    id: "polymarket-scanner",
    name: "Polymarket Scanner",
    emoji: "📊",
    stage: "testing",
    priority: 3,
    status: "Paper Trading",
    lastWorked: "2026-02-08",
    nextAction: "4-6 weeks validation before real money",
    blockers: "none",
    progress: "129 open paper trades",
  },
  // DEVELOPMENT
  {
    id: "jit-extension",
    name: "JIT Chrome Extension",
    emoji: "💼",
    stage: "development",
    priority: 2,
    status: "Building",
    lastWorked: "2026-02-08",
    nextAction: "Convert icons to PNG, test on competitors",
    blockers: "none",
    progress: "68 parts, 9,914 cross-refs",
  },
  {
    id: "truck-parts-db",
    name: "Truck Parts Cross-Ref DB",
    emoji: "🔧",
    stage: "development",
    priority: 4,
    status: "Active",
    lastWorked: "2026-02-08",
    nextAction: "Continue scraping/mapping",
    blockers: "none",
    progress: "Schema + 10 brands seeded",
  },
  {
    id: "ai-calibration",
    name: "AI Calibration",
    emoji: "🧠",
    stage: "development",
    priority: 13,
    status: "Testing Models",
    lastWorked: "2026-02-08",
    nextAction: "ChatGPT Web o1/o3 via browser",
    blockers: "none",
    progress: "3/4 models tested (38%)",
  },
  {
    id: "findtruckservice",
    name: "FindTruckService Scraper",
    emoji: "🔍",
    stage: "development",
    priority: 4,
    status: "Building",
    lastWorked: "2026-02-08",
    nextAction: "Rebuild locally, test national scrape",
    blockers: "none",
    progress: "Architecture designed",
  },
  // PLANNING
  {
    id: "wife-calendar",
    name: "Wife Calendar",
    emoji: "📅",
    stage: "planning",
    priority: 6,
    status: "OCR Pipeline Built",
    lastWorked: "2026-02-04",
    nextAction: "Justin tests with real photo",
    blockers: "Needs Justin test",
    daysStale: 4,
    needsDecision: true,
  },
  {
    id: "google-drive",
    name: "Google Drive Sync",
    emoji: "📁",
    stage: "planning",
    priority: 12,
    status: "Ready to Install",
    lastWorked: "2026-02-06",
    nextAction: "Justin runs brew install (needs sudo)",
    blockers: "Needs sudo password",
  },
  // RESEARCH
  {
    id: "polymarket-research",
    name: "Polymarket Research",
    emoji: "📈",
    stage: "research",
    priority: 7,
    status: "Active",
    lastWorked: "2026-02-08",
    nextAction: "Backtest one strategy",
    blockers: "none",
    progress: "35% - Cluster arb strategy identified",
  },
  {
    id: "public-data",
    name: "Public Data Products",
    emoji: "🗃️",
    stage: "research",
    priority: 8,
    status: "Active",
    lastWorked: "2026-02-06",
    nextAction: "Research one more industry",
    blockers: "none",
    progress: "30% - Fleet Intel proving value",
  },
  {
    id: "battle-dinghy-ore",
    name: "Battle Dinghy ORE",
    emoji: "🎰",
    stage: "research",
    priority: 10,
    status: "Paused",
    lastWorked: "Unknown",
    nextAction: "ORE token integration",
    blockers: "none",
  },
  // ARCHIVED
  {
    id: "x-simulator",
    name: "X_Simulator",
    emoji: "🐦",
    stage: "archived",
    priority: 99,
    status: "Archived",
    lastWorked: "2026-02-06",
    nextAction: "Reference only",
    blockers: "none",
    progress: "Archived as sandbox (2026-02-08)",
  },
  {
    id: "swipe-nft",
    name: "Swipe NFT",
    emoji: "🎴",
    stage: "archived",
    priority: 99,
    status: "On Hold",
    lastWorked: "Unknown",
    nextAction: "Wire up NFT library APIs",
    blockers: "none",
  },
];

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

function ProjectCard({ project }: { project: Project }) {
  const stage = stageConfig[project.stage];
  
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
              {config.label} ({stageCounts[stage]})
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
      
      {/* Stage Gate Flow */}
      <div className="mt-8 glass-panel rounded-3xl p-6">
        <h2 className="text-lg font-semibold text-white">Stage Gate Flow</h2>
        <p className="mt-2 text-sm text-slate-400">Visual pipeline of project progression</p>
        
        <div className="mt-6 flex items-center justify-between overflow-x-auto pb-2">
          {stages.filter(s => s !== "archived").map((stage, idx) => {
            const config = stageConfig[stage];
            const count = stageCounts[stage];
            return (
              <div key={stage} className="flex items-center">
                <div className={`rounded-2xl ${config.bgColor} border ${config.borderColor} px-4 py-3 text-center min-w-[120px]`}>
                  <p className={`text-2xl font-bold ${config.color}`}>{count}</p>
                  <p className="text-xs text-slate-400 mt-1">{config.label.replace(/^.+\s/, "")}</p>
                </div>
                {idx < stages.length - 2 && (
                  <div className="mx-2 text-slate-600">→</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
