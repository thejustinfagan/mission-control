"use client";

import { projects, getJustinActions, Project, ProjectAction } from "@/data/projects";
import { AlertTriangle, ExternalLink, Lightbulb, ArrowRight } from "lucide-react";
import Link from "next/link";

interface ActionItem {
  project: Project;
  action: ProjectAction;
}

function ActionCard({ item }: { item: ActionItem }) {
  const priorityColors = {
    high: "border-l-amber-500 bg-amber-500/5",
    medium: "border-l-comet-500 bg-comet-500/5",
    low: "border-l-slate-500 bg-slate-500/5",
  };

  return (
    <div className={`border-l-4 ${priorityColors[item.action.priority]} rounded-r-lg p-4 hover:bg-slate-800/50 transition-colors`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{item.project.emoji}</span>
            <Link 
              href={`/projects/${item.project.id}`}
              className="text-sm font-medium text-slate-400 hover:text-comet-400 transition-colors"
            >
              {item.project.name}
            </Link>
            {item.action.priority === "high" && (
              <span className="text-xs bg-red-500/30 text-red-300 px-2 py-0.5 rounded">URGENT</span>
            )}
          </div>
          <p className="text-white">{item.action.label}</p>
        </div>
        <Link 
          href={`/projects/${item.project.id}`}
          className="text-slate-400 hover:text-white transition-colors p-2"
        >
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

function DecisionCard({ project }: { project: Project }) {
  if (!project.needsDecision) return null;
  
  return (
    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{project.emoji}</span>
            <Link 
              href={`/projects/${project.id}`}
              className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
            >
              {project.name}
            </Link>
          </div>
          <p className="text-white mb-2">{project.needsDecision.question}</p>
          {project.needsDecision.options && (
            <div className="flex flex-wrap gap-2">
              {project.needsDecision.options.map((opt, i) => (
                <span key={i} className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                  {opt}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickLink({ project }: { project: Project }) {
  if (!project.liveUrl) return null;
  
  return (
    <a 
      href={project.liveUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors group"
    >
      <span className="text-xl">{project.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="text-white font-medium truncate">{project.name}</div>
        <div className="text-xs text-slate-400 truncate">{project.liveUrl}</div>
      </div>
      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-aurora-400 transition-colors" />
    </a>
  );
}

export function JustinDashboard() {
  const justinActions = getJustinActions();
  const highPriority = justinActions.filter(a => a.action.priority === "high");
  const mediumPriority = justinActions.filter(a => a.action.priority === "medium");
  const lowPriority = justinActions.filter(a => a.action.priority === "low");
  
  const decisionsNeeded = projects.filter(p => p.needsDecision);
  const liveProjects = projects.filter(p => p.liveUrl && p.stage === "production");

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-xl p-4 border border-amber-500/30">
          <div className="text-3xl font-bold text-amber-400">{highPriority.length}</div>
          <div className="text-sm text-amber-300/80">Urgent Actions</div>
        </div>
        <div className="bg-gradient-to-br from-comet-500/20 to-comet-600/10 rounded-xl p-4 border border-comet-500/30">
          <div className="text-3xl font-bold text-comet-400">{mediumPriority.length}</div>
          <div className="text-sm text-comet-300/80">Medium Priority</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl p-4 border border-purple-500/30">
          <div className="text-3xl font-bold text-purple-400">{decisionsNeeded.length}</div>
          <div className="text-sm text-purple-300/80">Decisions Needed</div>
        </div>
        <div className="bg-gradient-to-br from-aurora-500/20 to-aurora-600/10 rounded-xl p-4 border border-aurora-500/30">
          <div className="text-3xl font-bold text-aurora-400">{liveProjects.length}</div>
          <div className="text-sm text-aurora-300/80">Live Projects</div>
        </div>
      </div>

      {/* Urgent Actions */}
      {highPriority.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-amber-400">Urgent - Do These First</h2>
          </div>
          <div className="space-y-2">
            {highPriority.map((item, i) => (
              <ActionCard key={i} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Decisions Needed */}
      {decisionsNeeded.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-purple-400">Decisions Needed</h2>
          </div>
          <div className="space-y-3">
            {decisionsNeeded.map((project, i) => (
              <DecisionCard key={i} project={project} />
            ))}
          </div>
        </div>
      )}

      {/* Medium Priority */}
      {mediumPriority.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-comet-400 mb-4">When You Have Time</h2>
          <div className="space-y-2">
            {mediumPriority.map((item, i) => (
              <ActionCard key={i} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      {liveProjects.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-300 mb-4">Quick Links - Live Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {liveProjects.map((project, i) => (
              <QuickLink key={i} project={project} />
            ))}
          </div>
        </div>
      )}

      {/* Low Priority (collapsed) */}
      {lowPriority.length > 0 && (
        <details className="group">
          <summary className="text-sm text-slate-400 cursor-pointer hover:text-slate-300 transition-colors">
            {lowPriority.length} low priority items...
          </summary>
          <div className="mt-3 space-y-2">
            {lowPriority.map((item, i) => (
              <ActionCard key={i} item={item} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
