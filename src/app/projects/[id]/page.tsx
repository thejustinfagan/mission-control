"use client";

import { useParams, useRouter } from "next/navigation";
import { getProject, Project, ProjectAction } from "@/data/projects";
import { ArrowLeft, ExternalLink, GitBranch, AlertTriangle, CheckCircle, Clock, DollarSign, Folder, History, Lightbulb } from "lucide-react";

function ActionBadge({ action }: { action: ProjectAction }) {
  const colors = {
    high: action.owner === "justin" 
      ? "bg-amber-500/20 text-amber-300 border-amber-500/40" 
      : "bg-aurora-500/20 text-aurora-400 border-aurora-500/40",
    medium: "bg-comet-500/20 text-comet-400 border-comet-500/40",
    low: "bg-slate-500/20 text-slate-400 border-slate-500/40",
  };
  
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${colors[action.priority]} ${action.completed ? 'opacity-50 line-through' : ''}`}>
      <span className={`text-xs font-semibold uppercase ${action.owner === 'justin' ? 'text-amber-400' : 'text-aurora-400'}`}>
        {action.owner}
      </span>
      <span className="text-sm">{action.label}</span>
      {action.priority === 'high' && !action.completed && (
        <span className="ml-auto text-xs bg-red-500/30 text-red-300 px-2 py-0.5 rounded">URGENT</span>
      )}
    </div>
  );
}

function MetricCard({ label, value, trend }: { label: string; value: string | number; trend?: "up" | "down" | "flat" }) {
  const trendColors = {
    up: "text-aurora-400",
    down: "text-rose-400",
    flat: "text-slate-400",
  };
  const trendIcons = {
    up: "↑",
    down: "↓",
    flat: "→",
  };
  
  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
      <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">{label}</div>
      <div className="text-2xl font-bold text-white flex items-center gap-2">
        {value}
        {trend && <span className={`text-sm ${trendColors[trend]}`}>{trendIcons[trend]}</span>}
      </div>
    </div>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full bg-slate-700 rounded-full h-2.5">
      <div 
        className="bg-gradient-to-r from-aurora-500 to-comet-500 h-2.5 rounded-full transition-all duration-500"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-comet-400" />
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const project = getProject(params.id as string);
  
  if (!project) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Project not found</h1>
          <button 
            onClick={() => router.push('/')}
            className="text-comet-400 hover:text-comet-300"
          >
            ← Back to Mission Control
          </button>
        </div>
      </div>
    );
  }

  const stageColors = {
    production: "bg-aurora-500/20 text-aurora-400 border-aurora-500/40",
    testing: "bg-comet-500/20 text-comet-400 border-comet-500/40",
    development: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    planning: "bg-purple-500/20 text-purple-400 border-purple-500/40",
    research: "bg-blue-500/20 text-blue-400 border-blue-500/40",
    archived: "bg-slate-500/20 text-slate-400 border-slate-500/40",
  };

  const justinActions = project.nextActions.filter(a => a.owner === 'justin' && !a.completed);
  const barryActions = project.nextActions.filter(a => a.owner === 'barry' && !a.completed);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700/50 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button 
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Mission Control
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">{project.emoji}</span>
                <h1 className="text-3xl font-bold">{project.name}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase border ${stageColors[project.stage]}`}>
                  {project.stage}
                </span>
              </div>
              <p className="text-slate-400 text-lg">{project.tagline}</p>
            </div>
            
            <div className="flex gap-3">
              {project.liveUrl && (
                <a 
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-aurora-500/20 text-aurora-400 rounded-lg hover:bg-aurora-500/30 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Live
                </a>
              )}
              {project.repoUrl && (
                <a 
                  href={project.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <GitBranch className="w-4 h-4" />
                  Repo
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Milestone & Progress */}
        <div className="bg-gradient-to-r from-slate-800/50 to-slate-800/30 rounded-xl p-6 border border-slate-700/50 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-slate-400 mb-1">Current Milestone</div>
              <div className="text-xl font-semibold text-white">{project.currentMilestone}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400 mb-1">Priority</div>
              <div className="text-2xl font-bold text-comet-400">#{project.priority}</div>
            </div>
          </div>
          {project.progress !== undefined && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Progress</span>
                <span className="text-white font-semibold">{project.progress}%</span>
              </div>
              <ProgressBar progress={project.progress} />
            </div>
          )}
        </div>

        {/* Justin's Actions - Highlighted */}
        {justinActions.length > 0 && (
          <div className="bg-amber-500/10 rounded-xl p-6 border border-amber-500/30 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-semibold text-amber-400">Waiting on You</h3>
            </div>
            <div className="space-y-2">
              {justinActions.map((action, i) => (
                <ActionBadge key={i} action={action} />
              ))}
            </div>
          </div>
        )}

        {/* Decision Needed */}
        {project.needsDecision && (
          <div className="bg-purple-500/10 rounded-xl p-6 border border-purple-500/30 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-purple-400">Decision Needed</h3>
            </div>
            <p className="text-white text-lg mb-3">{project.needsDecision.question}</p>
            {project.needsDecision.options && (
              <div className="flex flex-wrap gap-2">
                {project.needsDecision.options.map((opt, i) => (
                  <span key={i} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-sm">
                    {opt}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Metrics */}
          {project.metrics && project.metrics.length > 0 && (
            <Section title="Metrics" icon={CheckCircle}>
              <div className="grid grid-cols-2 gap-3">
                {project.metrics.map((metric, i) => (
                  <MetricCard key={i} {...metric} />
                ))}
              </div>
            </Section>
          )}

          {/* Revenue */}
          {project.revenueStatus && (
            <Section title="Revenue" icon={DollarSign}>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-slate-400 mb-1">Current</div>
                  <div className="text-3xl font-bold text-white">
                    ${project.revenueStatus.current.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">Annual Potential</div>
                  <div className="text-2xl font-bold text-aurora-400">
                    ${project.revenueStatus.potential.toLocaleString()}/yr
                  </div>
                </div>
              </div>
            </Section>
          )}
        </div>

        {/* Barry's Actions */}
        {barryActions.length > 0 && (
          <Section title="Barry's Next Actions" icon={Clock}>
            <div className="space-y-2">
              {barryActions.map((action, i) => (
                <ActionBadge key={i} action={action} />
              ))}
            </div>
          </Section>
        )}

        <div className="h-6" />

        {/* Key Files */}
        {project.keyFiles && project.keyFiles.length > 0 && (
          <Section title="Key Files" icon={Folder}>
            <div className="space-y-2">
              {project.keyFiles.map((file, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div>
                    <div className="text-white font-medium">{file.name}</div>
                    {file.description && <div className="text-sm text-slate-400">{file.description}</div>}
                  </div>
                  <code className="text-xs text-comet-400 bg-slate-800 px-2 py-1 rounded">
                    {file.path.startsWith('http') ? (
                      <a href={file.path} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {file.path.length > 50 ? file.path.slice(0, 50) + '...' : file.path}
                      </a>
                    ) : (
                      file.path
                    )}
                  </code>
                </div>
              ))}
            </div>
          </Section>
        )}

        <div className="h-6" />

        {/* Recent Updates */}
        {project.recentUpdates && project.recentUpdates.length > 0 && (
          <Section title="Recent Updates" icon={History}>
            <div className="space-y-2">
              {project.recentUpdates.map((update, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-comet-400 mt-1.5 flex-shrink-0" />
                  <span className="text-slate-300">{update}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        <div className="h-6" />

        {/* Key Decisions */}
        {project.keyDecisions && project.keyDecisions.length > 0 && (
          <Section title="Key Decisions" icon={Lightbulb}>
            <div className="space-y-3">
              {project.keyDecisions.map((decision, i) => (
                <div key={i} className="border-l-2 border-comet-500 pl-4 py-1">
                  <div className="text-xs text-slate-400 mb-1">{decision.date}</div>
                  <div className="text-slate-200">{decision.decision}</div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <div className="h-6" />

        {/* Tech Stack & Local Path */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {project.techStack && (
            <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Tech Stack</h3>
              <div className="flex flex-wrap gap-2">
                {project.techStack.map((tech, i) => (
                  <span key={i} className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-lg text-sm">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {project.localPath && (
            <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Local Path</h3>
              <code className="text-comet-400 bg-slate-800 px-3 py-2 rounded block">
                {project.localPath}
              </code>
            </div>
          )}
        </div>

        {/* Blockers */}
        {project.blockers && project.blockers.length > 0 && (
          <div className="mt-8 bg-rose-500/10 rounded-xl p-6 border border-rose-500/30">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <h3 className="text-lg font-semibold text-rose-400">Blockers</h3>
            </div>
            <ul className="space-y-2">
              {project.blockers.map((blocker, i) => (
                <li key={i} className="flex items-center gap-2 text-rose-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  {blocker}
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-400 text-sm">
          Last worked: {project.lastWorked} • Priority #{project.priority}
        </div>
      </footer>
    </div>
  );
}
