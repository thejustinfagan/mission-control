"use client";

import { useState } from "react";
import { Navigation } from "./navigation";

interface BeastModeData {
  verdict: string;
  version: string;
  repoTotal: number;
  repoHealthy: number;
  repoWarning: number;
  cronTotal: number;
  cronHealthy: number;
  liveTotal: number;
  liveHealthy: number;
  allDeltasClear: string;
}

interface Project {
  id: string;
  name: string;
  emoji?: string;
  status: string;
  health: string;
  description?: string;
  lastActivity?: string;
  deployment?: string;
  notes?: string;
  priority?: number;
}

interface HealthData {
  timestamp: string;
  beastMode?: BeastModeData;
  projects?: Project[];
  summary?: {
    totalProjects: number;
    activeProjects: number;
    blockedProjects: number;
    staleProjects: number;
  };
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return "unknown";
  const now = new Date();
  const then = new Date(dateStr);
  const mins = Math.floor((now.getTime() - then.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const v = verdict?.toUpperCase() || "";
  let color = "bg-slate-500/20 text-slate-300 border-slate-500/30";
  let icon = "⚪";
  if (v.includes("ALL_CLEAR") || v.includes("ALL CLEAR")) {
    color = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    icon = "✅";
  } else if (v.includes("DEGRADED")) {
    color = "bg-amber-500/20 text-amber-300 border-amber-500/30";
    icon = "⚠️";
  } else if (v.includes("CRITICAL") || v.includes("FAIL")) {
    color = "bg-red-500/20 text-red-300 border-red-500/30";
    icon = "🔴";
  }
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${color} font-mono text-sm`}>
      <span>{icon}</span>
      <span>{verdict || "No data"}</span>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">{label}</div>
      <div className={`text-3xl font-extrabold ${color || "text-white"}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}

function HealthBar({ healthy, warning, error, total }: { healthy: number; warning: number; error: number; total: number }) {
  if (total === 0) return null;
  const other = total - healthy - warning - error;
  return (
    <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mt-2">
      {healthy > 0 && <div style={{ flex: healthy }} className="bg-emerald-500 rounded-full" />}
      {warning > 0 && <div style={{ flex: warning }} className="bg-amber-500 rounded-full" />}
      {error > 0 && <div style={{ flex: error }} className="bg-red-500 rounded-full" />}
      {other > 0 && <div style={{ flex: other }} className="bg-slate-600 rounded-full" />}
    </div>
  );
}

function ProjectRow({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const healthColor: Record<string, string> = {
    healthy: "text-emerald-400",
    degraded: "text-amber-400",
    broken: "text-red-400",
    stale: "text-slate-500",
  };
  const statusBg: Record<string, string> = {
    active: "bg-emerald-500/20 text-emerald-300",
    paused: "bg-slate-500/20 text-slate-400",
    stale: "bg-amber-500/20 text-amber-300",
    blocked: "bg-red-500/20 text-red-300",
  };

  return (
    <div
      className="border-b border-slate-700/50 hover:bg-slate-800/30 transition cursor-pointer"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-lg flex-shrink-0">{project.emoji || "📁"}</span>
          <span className="text-sm font-semibold text-white truncate">{project.name}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusBg[project.status] || statusBg.paused}`}>
            {project.status}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-mono ${healthColor[project.health] || "text-slate-400"}`}>
            {project.health}
          </span>
          {project.deployment && (
            <a
              href={project.deployment}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              ↗
            </a>
          )}
          <span className="text-slate-600 text-xs">{open ? "▲" : "▼"}</span>
        </div>
      </div>
      {open && (
        <div className="px-4 pb-3 space-y-1">
          {project.description && <p className="text-xs text-slate-400 font-mono">{project.description}</p>}
          {project.notes && <p className="text-xs text-slate-500">{project.notes}</p>}
          {project.lastActivity && (
            <p className="text-[10px] text-slate-600">Last activity: {timeAgo(project.lastActivity)}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function BeastModeHealth({ data }: { data: HealthData | null }) {
  if (!data) {
    return (
      <div className="min-h-screen bg-midnight-900 text-white font-[family-name:var(--font-space-grotesk)]">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Navigation />
          <div className="mt-12 text-center text-slate-500">No health data available. Run push-live-status.sh first.</div>
        </div>
      </div>
    );
  }

  const bm = data.beastMode;
  const projects = data.projects || [];
  const activeProjects = projects.filter((p) => p.status === "active");
  const staleProjects = projects.filter((p) => p.status === "stale" || p.status === "paused");

  return (
    <div className="min-h-screen bg-midnight-900 text-white font-[family-name:var(--font-space-grotesk)]">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <Navigation />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">🦁 System Health</h1>
          <p className="text-xs text-slate-500 font-mono">
            Last updated: {data.timestamp ? timeAgo(data.timestamp) : "never"}
            {data.timestamp && <span className="ml-2 text-slate-600">({new Date(data.timestamp).toLocaleString()})</span>}
          </p>
        </div>

        {/* Beast Mode Verdict */}
        {bm && (
          <div className="text-center mb-8">
            <VerdictBadge verdict={bm.verdict} />
            <div className="text-xs text-slate-500 font-mono mt-2">Beast Mode v{bm.version}</div>
          </div>
        )}

        {/* Stats Grid */}
        {bm && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div>
              <StatCard
                label="Repositories"
                value={bm.repoTotal}
                sub={`${bm.repoHealthy} healthy · ${bm.repoWarning} warning`}
                color="text-sky-400"
              />
              <HealthBar healthy={bm.repoHealthy} warning={bm.repoWarning} error={0} total={bm.repoTotal} />
            </div>
            <StatCard
              label="Cron Jobs"
              value={`${bm.cronHealthy}/${bm.cronTotal}`}
              sub={bm.cronTotal > 0 ? `${bm.cronTotal - bm.cronHealthy} issues` : "not reporting"}
              color={bm.cronHealthy === bm.cronTotal ? "text-emerald-400" : "text-amber-400"}
            />
            <StatCard
              label="Live Deploys"
              value={`${bm.liveHealthy}/${bm.liveTotal}`}
              color={bm.liveHealthy === bm.liveTotal ? "text-emerald-400" : "text-red-400"}
            />
            <StatCard
              label="Drift Status"
              value={bm.allDeltasClear === "yes" ? "Clear" : "Drifted"}
              color={bm.allDeltasClear === "yes" ? "text-emerald-400" : "text-amber-400"}
            />
          </div>
        )}

        {/* Summary Stats */}
        {data.summary && !bm && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Projects" value={data.summary.totalProjects} color="text-sky-400" />
            <StatCard label="Active" value={data.summary.activeProjects} color="text-emerald-400" />
            <StatCard label="Blocked" value={data.summary.blockedProjects} color="text-red-400" />
            <StatCard label="Stale" value={data.summary.staleProjects} color="text-amber-400" />
          </div>
        )}

        {/* Active Projects */}
        {activeProjects.length > 0 && (
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl mb-6 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700/50">
              <h2 className="text-sm font-semibold text-emerald-400">🟢 Active Projects ({activeProjects.length})</h2>
            </div>
            {activeProjects.map((p) => (
              <ProjectRow key={p.id} project={p} />
            ))}
          </div>
        )}

        {/* Stale / Paused Projects */}
        {staleProjects.length > 0 && (
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl mb-6 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700/50">
              <h2 className="text-sm font-semibold text-amber-400">⏸️ Stale / Paused ({staleProjects.length})</h2>
            </div>
            {staleProjects.map((p) => (
              <ProjectRow key={p.id} project={p} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-[10px] text-slate-600 mt-8 font-mono">
          Mission Control · System Health · Powered by Beast Mode Audit
        </div>
      </div>
    </div>
  );
}
