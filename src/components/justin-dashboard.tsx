"use client";

import { useState } from "react";

interface LiveProject {
  name: string;
  emoji: string;
  status: string;
  priority: number;
  lastWorked: string;
  currentMilestone: string;
  nextAction: string;
  blockers: string;
  daysSinceTouch: number;
  needsDecision: string;
  liveUrl: string;
  data: string;
  features: string[];
}

interface IncompleteItem {
  project: string;
  completed: boolean;
  task: string;
}

interface LiveData {
  timestamp: string;
  summary: {
    totalProjects: number;
    activeProjects: number;
    blockedProjects: number;
    staleProjects: number;
    decisionsNeeded: number;
    incompleteItems: number;
  };
  projects: LiveProject[];
  incomplete: IncompleteItem[];
  todayLog: string | null;
  yesterdayLog: string | null;
}

type ViewMode = "actions" | "projects" | "activity" | "incomplete";

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase() || "";
  let color = "bg-slate-500/20 text-slate-300";
  if (s.includes("deployed") || s.includes("production") || s.includes("live")) color = "bg-emerald-500/20 text-emerald-300";
  else if (s.includes("testing") || s.includes("ready")) color = "bg-amber-500/20 text-amber-300";
  else if (s.includes("blocked")) color = "bg-red-500/20 text-red-300";
  else if (s.includes("paused")) color = "bg-slate-500/20 text-slate-400";
  else if (s.includes("development") || s.includes("building")) color = "bg-sky-500/20 text-sky-300";
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${color}`}>{status}</span>;
}

function StaleBadge({ days }: { days: number }) {
  if (!days || days < 3) return null;
  const color = days >= 7 ? "bg-red-500/30 text-red-300" : "bg-amber-500/30 text-amber-300";
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${color}`}>⏸️ {days}d stale</span>;
}

function ProjectCard({ project }: { project: LiveProject }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-aurora-500/30 transition-all cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{project.emoji}</span>
            <h3 className="text-sm font-semibold text-white truncate">{project.name}</h3>
            <StatusBadge status={project.status} />
            <StaleBadge days={project.daysSinceTouch} />
          </div>
          {project.currentMilestone && (
            <p className="text-xs text-slate-400 truncate">{project.currentMilestone}</p>
          )}
        </div>
        {project.liveUrl && (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-aurora-400 hover:text-aurora-300 text-xs ml-2 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            ↗ Live
          </a>
        )}
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2">
          {project.nextAction && (
            <div className="flex items-start gap-2">
              <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded font-bold flex-shrink-0">NEXT</span>
              <p className="text-xs text-slate-300">{project.nextAction}</p>
            </div>
          )}
          {project.blockers && project.blockers !== "none" && project.blockers !== "None" && (
            <div className="flex items-start gap-2">
              <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded font-bold flex-shrink-0">BLOCKED</span>
              <p className="text-xs text-red-300">{project.blockers}</p>
            </div>
          )}
          {project.needsDecision && project.needsDecision.toLowerCase() !== "no" && (
            <div className="flex items-start gap-2">
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-bold flex-shrink-0">DECIDE</span>
              <p className="text-xs text-purple-300">{project.needsDecision}</p>
            </div>
          )}
          {project.data && (
            <p className="text-[10px] text-slate-500">{project.data}</p>
          )}
          {project.lastWorked && (
            <p className="text-[10px] text-slate-600">Last worked: {project.lastWorked}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function JustinDashboard({ liveData }: { liveData: LiveData | null }) {
  const [view, setView] = useState<ViewMode>("actions");

  if (!liveData) {
    return (
      <div className="min-h-screen bg-midnight-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">🎛️</p>
          <p className="text-slate-400">Loading Mission Control...</p>
          <p className="text-xs text-slate-600 mt-2">Could not connect to workspace files</p>
        </div>
      </div>
    );
  }

  const { summary, projects, incomplete, todayLog } = liveData;
  
  // Sort projects by priority
  const sortedProjects = [...projects].sort((a, b) => (a.priority || 99) - (b.priority || 99));
  
  // Get Justin's action items (next actions from all projects)
  const justinActions = sortedProjects
    .filter(p => p.nextAction)
    .map(p => ({ project: p, action: p.nextAction }));

  // Get decisions needed
  const decisions = sortedProjects.filter(
    p => p.needsDecision && p.needsDecision.toLowerCase() !== "no"
  );

  // Get stale projects
  const stale = sortedProjects.filter(p => p.daysSinceTouch >= 3);

  // Incomplete items
  const incompleteItems = incomplete.filter(i => !i.completed);

  const updatedAt = new Date(liveData.timestamp);
  const timeStr = updatedAt.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  });

  return (
    <main className="relative min-h-screen overflow-hidden bg-midnight-900">
      <div className="absolute inset-0 bg-grid-fade"></div>
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-6">
        {/* Header */}
        <header className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-aurora-400/80">Mission Control</p>
              <h1 className="mt-1 text-2xl font-semibold text-white">Command Center</h1>
              <p className="mt-1 text-xs text-slate-400">
                Live from STATUS.md • Updated {timeStr} CT
              </p>
            </div>
            <div className="glass-panel flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] text-slate-200">
              <span className="h-2 w-2 rounded-full bg-aurora-500 shadow-[0_0_12px_rgba(84,240,193,0.8)]"></span>
              Barry Online
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">
            <div className="bg-gradient-to-br from-aurora-500/20 to-aurora-600/10 rounded-lg p-3 border border-aurora-500/30">
              <div className="text-2xl font-bold text-aurora-400">{summary.activeProjects}</div>
              <div className="text-[10px] text-aurora-300/80">Active Projects</div>
            </div>
            <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-lg p-3 border border-amber-500/30">
              <div className="text-2xl font-bold text-amber-400">{justinActions.length}</div>
              <div className="text-[10px] text-amber-300/80">Your Actions</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-lg p-3 border border-purple-500/30">
              <div className="text-2xl font-bold text-purple-400">{decisions.length}</div>
              <div className="text-[10px] text-purple-300/80">Decisions</div>
            </div>
            <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-lg p-3 border border-red-500/30">
              <div className="text-2xl font-bold text-red-400">{stale.length}</div>
              <div className="text-[10px] text-red-300/80">Stale ({">"}3d)</div>
            </div>
            <div className="bg-gradient-to-br from-sky-500/20 to-sky-600/10 rounded-lg p-3 border border-sky-500/30">
              <div className="text-2xl font-bold text-sky-400">{incompleteItems.length}</div>
              <div className="text-[10px] text-sky-300/80">Incomplete</div>
            </div>
          </div>

          {/* View Tabs */}
          <nav className="flex gap-1 mt-4">
            {([
              { key: "actions", label: "⚡ Actions", count: justinActions.length },
              { key: "projects", label: "📋 Projects", count: sortedProjects.length },
              { key: "incomplete", label: "🔄 Incomplete", count: incompleteItems.length },
              { key: "activity", label: "📊 Today" },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setView(tab.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  view === tab.key
                    ? "bg-aurora-500/20 text-aurora-300 border border-aurora-500/50"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                {tab.label}
                {"count" in tab && tab.count ? (
                  <span className="ml-1 text-[10px] opacity-60">({tab.count})</span>
                ) : null}
              </button>
            ))}
          </nav>
        </header>

        {/* Content */}
        <div className="space-y-3">
          {view === "actions" && (
            <>
              {decisions.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-purple-400 mb-2 flex items-center gap-1">
                    💡 Decisions Needed
                  </h2>
                  <div className="space-y-2">
                    {decisions.map((p, i) => (
                      <div key={i} className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span>{p.emoji}</span>
                          <span className="text-xs font-medium text-purple-400">{p.name}</span>
                        </div>
                        <p className="text-xs text-white">{p.needsDecision}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-1">
                  ⚡ Next Actions
                </h2>
                <div className="space-y-1.5">
                  {justinActions.map(({ project, action }, i) => (
                    <div key={i} className="border-l-3 border-l-amber-500 bg-amber-500/5 rounded-r-lg p-3 hover:bg-slate-800/50 transition">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm">{project.emoji}</span>
                        <span className="text-[10px] font-medium text-slate-400">{project.name}</span>
                      </div>
                      <p className="text-xs text-white">{action}</p>
                    </div>
                  ))}
                </div>
              </div>

              {stale.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-1">
                    ⏸️ Stale Projects
                  </h2>
                  <div className="space-y-1.5">
                    {stale.map((p, i) => (
                      <div key={i} className="border-l-3 border-l-red-500 bg-red-500/5 rounded-r-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span>{p.emoji}</span>
                            <span className="text-xs text-white">{p.name}</span>
                          </div>
                          <span className="text-[10px] text-red-400 font-bold">{p.daysSinceTouch}d untouched</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">Last: {p.lastWorked}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {view === "projects" && (
            <div className="space-y-2">
              {sortedProjects.map((project, i) => (
                <ProjectCard key={i} project={project} />
              ))}
            </div>
          )}

          {view === "incomplete" && (
            <div className="space-y-3">
              {Object.entries(
                incompleteItems.reduce((acc, item) => {
                  if (!acc[item.project]) acc[item.project] = [];
                  acc[item.project].push(item);
                  return acc;
                }, {} as Record<string, IncompleteItem[]>)
              ).map(([project, items]) => (
                <div key={project}>
                  <h3 className="text-xs font-bold text-slate-300 mb-1.5">{project}</h3>
                  <div className="space-y-1">
                    {items.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 bg-slate-800/30 rounded-lg p-2.5">
                        <span className="text-slate-600 text-xs mt-0.5">☐</span>
                        <p className="text-xs text-slate-300">{item.task}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {view === "activity" && (
            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
              <h2 className="text-sm font-semibold text-slate-300 mb-3">📊 Today&apos;s Activity Log</h2>
              {todayLog ? (
                <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono leading-relaxed">
                  {todayLog}
                </pre>
              ) : (
                <p className="text-xs text-slate-500 italic">No activity logged yet today.</p>
              )}
            </div>
          )}
        </div>

        {/* Internal Pages */}
        <div className="mt-6 pt-4 border-t border-slate-800">
          <h2 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Mission Control</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { href: "/tasks", label: "Task Board", icon: "📋" },
              { href: "/calendar", label: "Calendar", icon: "📅" },
              { href: "/team", label: "Team", icon: "👥" },
              { href: "/office", label: "Office", icon: "🏢" },
              { href: "/memory", label: "Memory", icon: "🧠" },
            ].map((page) => (
              <a
                key={page.href}
                href={page.href}
                className="flex items-center gap-1.5 bg-aurora-500/10 hover:bg-aurora-500/20 border border-aurora-500/30 rounded-lg px-3 py-1.5 text-xs text-aurora-300 transition"
              >
                <span>{page.icon}</span>
                <span>{page.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Live Projects Links */}
        <div className="pt-4 border-t border-slate-800">
          <h2 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Quick Links</h2>
          <div className="flex flex-wrap gap-2">
            {sortedProjects
              .filter(p => p.liveUrl)
              .map((p, i) => (
                <a
                  key={i}
                  href={p.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg px-3 py-1.5 text-xs text-slate-300 transition"
                >
                  <span>{p.emoji}</span>
                  <span>{p.name}</span>
                  <span className="text-slate-600">↗</span>
                </a>
              ))}
          </div>
        </div>
      </div>
    </main>
  );
}
