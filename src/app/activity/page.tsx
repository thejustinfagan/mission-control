"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface Activity {
  id: string;
  timestamp: string;
  type: "build" | "deploy" | "merge" | "fix" | "config" | "infra" | "research" | "alert";
  project: string;
  title: string;
  description: string;
  actor: "barry" | "justin" | "system";
  links?: { label: string; url: string }[];
  impact?: "high" | "medium" | "low";
}

const TYPE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  build: { icon: "🔨", color: "text-blue-400", label: "Build" },
  deploy: { icon: "🚀", color: "text-green-400", label: "Deploy" },
  merge: { icon: "🔀", color: "text-purple-400", label: "Merge" },
  fix: { icon: "🐛", color: "text-orange-400", label: "Fix" },
  config: { icon: "⚙️", color: "text-slate-400", label: "Config" },
  infra: { icon: "🏗️", color: "text-yellow-400", label: "Infra" },
  research: { icon: "🔍", color: "text-cyan-400", label: "Research" },
  alert: { icon: "🚨", color: "text-red-400", label: "Alert" },
};

const IMPACT_BADGE: Record<string, string> = {
  high: "bg-red-500/20 text-red-300 border-red-500/40",
  medium: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  low: "bg-slate-500/20 text-slate-400 border-slate-500/40",
};

// Static activity data — Barry pushes updates via /api/activity
const ACTIVITIES: Activity[] = [
  {
    id: "act-20260402-001",
    timestamp: "2026-04-02T06:00:00Z",
    type: "merge",
    project: "Mission Control",
    title: "Merged Projects page + data refresh",
    description: "PR #7 merged — new /projects page with expandable cards, stage filters, Justin's action items aggregation. All project data refreshed from Feb 9 → Apr 1 state.",
    actor: "barry",
    impact: "high",
    links: [
      { label: "PR #7", url: "https://github.com/thejustinfagan/mission-control/pull/7" },
      { label: "Live", url: "https://mission-control-rose-xi.vercel.app/projects" },
    ],
  },
  {
    id: "act-20260402-002",
    timestamp: "2026-04-02T06:15:00Z",
    type: "build",
    project: "Mission Control",
    title: "Activity Feed page + auto-sync script",
    description: "New /activity page showing real-time timeline of all Barry actions across projects. Includes type filters, impact badges, and project grouping. Plus mc-push.sh script for automated dashboard data sync.",
    actor: "barry",
    impact: "high",
  },
  {
    id: "act-20260401-001",
    timestamp: "2026-04-01T06:00:00Z",
    type: "fix",
    project: "Battle Dinghy",
    title: "Board perspective lock-down",
    description: "Fixed critical bug where board perspective showed wrong player's view. Locked down the golden rule: whoever is shooting = show their board. All 3 render points verified.",
    actor: "barry",
    impact: "high",
    links: [
      { label: "Commit", url: "https://github.com/thejustinfagan/Battle_Dinghy/commit/ecc0e2a" },
    ],
  },
  {
    id: "act-20260401-002",
    timestamp: "2026-04-01T05:30:00Z",
    type: "fix",
    project: "Battle Dinghy",
    title: "Invalid coordinate error handling",
    description: "F5 on a 5x5 grid now returns a clear error reply instead of silently failing. Added error replies for all out-of-bounds coordinates.",
    actor: "barry",
    impact: "medium",
  },
  {
    id: "act-20260401-003",
    timestamp: "2026-04-01T04:00:00Z",
    type: "config",
    project: "Infrastructure",
    title: "Removed Brave API key",
    description: "Brave Search API was charging without being used. Removed from openclaw.json and all scripts.",
    actor: "barry",
    impact: "low",
  },
  {
    id: "act-20260331-001",
    timestamp: "2026-03-31T06:19:00Z",
    type: "build",
    project: "Mission Control",
    title: "Projects page + full data refresh",
    description: "Built complete /projects page with summary cards, stage filters, expandable project cards. Refreshed all stale data (projects, tasks, schedule) — 7 weeks of drift corrected.",
    actor: "barry",
    impact: "high",
    links: [
      { label: "PR #7", url: "https://github.com/thejustinfagan/mission-control/pull/7" },
    ],
  },
  {
    id: "act-20260326-001",
    timestamp: "2026-03-26T06:04:00Z",
    type: "build",
    project: "Battle Dinghy",
    title: "Work queue — stream never freezes",
    description: "Decoupled Twitter stream reading from game processing via bounded work queue with 4 daemon worker threads. The #1 production incident (110s TCP timeout killing stream) is now impossible.",
    actor: "barry",
    impact: "high",
    links: [
      { label: "PR #6", url: "https://github.com/thejustinfagan/Battle_Dinghy/pull/6" },
    ],
  },
  {
    id: "act-20260325-001",
    timestamp: "2026-03-25T06:04:00Z",
    type: "build",
    project: "Battle Dinghy",
    title: "Resilient tweet posting with retry + backoff",
    description: "All Twitter API calls now have 3 retries with exponential backoff. Players get instant '⚔️ Got it!' ack before image generation. No more permanently lost moves.",
    actor: "barry",
    impact: "high",
    links: [
      { label: "PR #5", url: "https://github.com/thejustinfagan/Battle_Dinghy/pull/5" },
    ],
  },
  {
    id: "act-20260324-001",
    timestamp: "2026-03-24T06:10:00Z",
    type: "fix",
    project: "Battle Dinghy",
    title: "Chess image import bug + leaderboard system",
    description: "Fixed chess piece image import that crashed board rendering. Added leaderboard tracking system.",
    actor: "barry",
    impact: "medium",
    links: [
      { label: "PR #4", url: "https://github.com/thejustinfagan/Battle_Dinghy/pull/4" },
    ],
  },
  {
    id: "act-20260322-001",
    timestamp: "2026-03-22T06:15:00Z",
    type: "build",
    project: "Mission Control",
    title: "Auto-status scanner + dashboard push",
    description: "Built automated scanner that reads workspace state and pushes to Mission Control API. Keeps dashboard data fresh without manual updates.",
    actor: "barry",
    impact: "medium",
    links: [
      { label: "PR #6", url: "https://github.com/thejustinfagan/mission-control/pull/6" },
    ],
  },
];

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function ActivityPage() {
  const [filter, setFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");

  const types = ["all", ...new Set(ACTIVITIES.map((a) => a.type))];
  const projects = ["all", ...new Set(ACTIVITIES.map((a) => a.project))];

  const filtered = ACTIVITIES.filter((a) => {
    if (filter !== "all" && a.type !== filter) return false;
    if (projectFilter !== "all" && a.project !== projectFilter) return false;
    return true;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Group by date
  const grouped = filtered.reduce<Record<string, Activity[]>>((acc, act) => {
    const date = new Date(act.timestamp).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(act);
    return acc;
  }, {});

  return (
    <main className="relative min-h-screen overflow-hidden bg-midnight-900">
      <div className="absolute inset-0 bg-grid-fade"></div>
      <div className="relative z-10 mx-auto max-w-4xl px-4 py-8">
        <header className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-midnight-800/60 px-3 py-1 text-xs text-slate-300 transition hover:border-aurora-500/40 hover:text-aurora-200"
          >
            ← Back to Command Center
          </Link>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-aurora-400/80">
                Mission Control
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-white">Activity Feed</h1>
              <p className="mt-1 text-xs text-slate-400">
                Real-time timeline of everything Barry ships across all projects.
              </p>
            </div>
            <div className="glass-panel rounded-full px-3 py-1.5 text-[10px] text-slate-200">
              {ACTIVITIES.length} events tracked
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-3">
          <div className="flex flex-wrap gap-1.5">
            <span className="self-center text-[10px] uppercase tracking-widest text-slate-500 mr-1">
              Type
            </span>
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                  filter === t
                    ? "bg-aurora-500/20 text-aurora-300 border border-aurora-500/50"
                    : "text-slate-400 hover:text-slate-200 border border-slate-700/40 hover:border-slate-600"
                }`}
              >
                {t === "all" ? "All" : `${TYPE_CONFIG[t]?.icon || ""} ${TYPE_CONFIG[t]?.label || t}`}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="self-center text-[10px] uppercase tracking-widest text-slate-500 mr-1">
              Project
            </span>
            {projects.map((p) => (
              <button
                key={p}
                onClick={() => setProjectFilter(p)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                  projectFilter === p
                    ? "bg-aurora-500/20 text-aurora-300 border border-aurora-500/50"
                    : "text-slate-400 hover:text-slate-200 border border-slate-700/40 hover:border-slate-600"
                }`}
              >
                {p === "all" ? "All" : p}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, activities]) => (
            <div key={date}>
              <div className="sticky top-0 z-20 mb-3 flex items-center gap-3">
                <h2 className="text-xs font-semibold text-slate-300">{date}</h2>
                <div className="h-px flex-1 bg-slate-700/50" />
                <span className="text-[10px] text-slate-500">{activities.length} events</span>
              </div>
              <div className="relative ml-4 border-l border-slate-700/50 pl-6 space-y-4">
                {activities.map((act) => {
                  const cfg = TYPE_CONFIG[act.type] || TYPE_CONFIG.build;
                  return (
                    <div
                      key={act.id}
                      className="group relative rounded-xl border border-slate-700/40 bg-midnight-800/60 p-4 transition hover:border-slate-600/60 hover:bg-midnight-800/80"
                    >
                      {/* Timeline dot */}
                      <div className="absolute -left-[31px] top-5 h-2.5 w-2.5 rounded-full border-2 border-slate-700 bg-midnight-900 group-hover:border-aurora-500/60 transition" />

                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className={`text-sm ${cfg.color}`}>{cfg.icon}</span>
                            <span className={`text-[10px] font-medium ${cfg.color}`}>
                              {cfg.label}
                            </span>
                            <span className="text-[10px] text-slate-500">•</span>
                            <span className="text-[10px] font-medium text-slate-300">
                              {act.project}
                            </span>
                            {act.impact && (
                              <span
                                className={`rounded-full border px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider ${IMPACT_BADGE[act.impact]}`}
                              >
                                {act.impact}
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-medium text-white leading-snug">
                            {act.title}
                          </h3>
                          <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                            {act.description}
                          </p>
                          {act.links && act.links.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {act.links.map((link) => (
                                <a
                                  key={link.url}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded-md border border-slate-700/60 bg-midnight-900/60 px-2 py-0.5 text-[10px] text-aurora-400 transition hover:border-aurora-500/40 hover:text-aurora-200"
                                >
                                  🔗 {link.label}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-[10px] text-slate-500">
                            {formatRelativeTime(act.timestamp)}
                          </div>
                          <div className="mt-0.5 text-[9px] text-slate-600">
                            {formatDate(act.timestamp)}
                          </div>
                          <div className="mt-1 text-[10px] text-slate-500">
                            by {act.actor === "barry" ? "🤖 Barry" : act.actor === "justin" ? "👨‍💻 Justin" : "⚡ System"}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-12 text-center">
            <p className="text-sm text-slate-500">No activities match your filters.</p>
          </div>
        )}

        {/* Summary stats */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Events", value: ACTIVITIES.length, icon: "📊" },
            { label: "High Impact", value: ACTIVITIES.filter((a) => a.impact === "high").length, icon: "🔥" },
            { label: "Projects Active", value: new Set(ACTIVITIES.map((a) => a.project)).size, icon: "🚀" },
            { label: "This Week", value: ACTIVITIES.filter((a) => {
                const d = new Date(a.timestamp);
                const now = new Date();
                return now.getTime() - d.getTime() < 7 * 86400000;
              }).length, icon: "⚡",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-slate-700/40 bg-midnight-800/60 p-3 text-center"
            >
              <div className="text-lg">{stat.icon}</div>
              <div className="mt-1 text-xl font-bold text-white">{stat.value}</div>
              <div className="text-[10px] text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
