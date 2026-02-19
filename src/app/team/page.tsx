"use client";

import { useMemo, useState } from "react";
import { Navigation } from "@/components/navigation";
import { teamAgents, type AgentProfile, type RoleAccent, type RoleGroup } from "@/data/team";

const STATUS_STYLES: Record<
  AgentProfile["status"],
  { label: string; icon: string; badge: string; text: string }
> = {
  active: {
    label: "Active",
    icon: "🟢",
    badge: "bg-emerald-500/15 text-emerald-200 border-emerald-400/40",
    text: "text-emerald-200",
  },
  "on-demand": {
    label: "On-demand",
    icon: "🔵",
    badge: "bg-sky-500/15 text-sky-200 border-sky-400/40",
    text: "text-sky-200",
  },
  scheduled: {
    label: "Scheduled",
    icon: "🟡",
    badge: "bg-amber-500/15 text-amber-200 border-amber-400/40",
    text: "text-amber-200",
  },
  error: {
    label: "Error",
    icon: "🔴",
    badge: "bg-rose-500/15 text-rose-200 border-rose-400/40",
    text: "text-rose-200",
  },
};

const ACCENT_STYLES: Record<RoleAccent, { bar: string; ring: string; glow: string }> = {
  developer: {
    bar: "bg-sky-500/70",
    ring: "ring-sky-500/40",
    glow: "shadow-[0_0_30px_rgba(56,189,248,0.15)]",
  },
  writer: {
    bar: "bg-emerald-500/70",
    ring: "ring-emerald-500/40",
    glow: "shadow-[0_0_30px_rgba(52,211,153,0.15)]",
  },
  analyst: {
    bar: "bg-purple-500/70",
    ring: "ring-purple-500/40",
    glow: "shadow-[0_0_30px_rgba(168,85,247,0.15)]",
  },
  ops: {
    bar: "bg-orange-500/70",
    ring: "ring-orange-500/40",
    glow: "shadow-[0_0_30px_rgba(249,115,22,0.15)]",
  },
  security: {
    bar: "bg-rose-500/70",
    ring: "ring-rose-500/40",
    glow: "shadow-[0_0_30px_rgba(244,63,94,0.15)]",
  },
};

const ROLE_FILTERS: Array<{ id: RoleGroup | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "developers", label: "Developers" },
  { id: "writers", label: "Writers" },
  { id: "analysts", label: "Analysts" },
  { id: "ops", label: "Ops" },
];

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatRate(value: number) {
  return `${value.toFixed(1)}%`;
}

export default function TeamPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [roleFilter, setRoleFilter] = useState<RoleGroup | "all">("all");
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());

  const summary = useMemo(() => {
    const totalAgents = teamAgents.length;
    const activeNow = teamAgents.filter((agent) => agent.status === "active").length;
    const tasksCompletedToday = teamAgents.reduce((total, agent) => total + agent.tasksCompletedToday, 0);
    const sessionsToday = teamAgents.reduce((total, agent) => total + agent.sessionsToday, 0);

    return { totalAgents, activeNow, tasksCompletedToday, sessionsToday };
  }, []);

  const leader = teamAgents.find((agent) => agent.id === "barry") ?? teamAgents[0];
  const subAgents = teamAgents.filter((agent) => agent.id !== leader.id);

  const filteredAgents = useMemo(() => {
    if (roleFilter === "all") return teamAgents;
    return teamAgents.filter((agent) => agent.roleGroup === roleFilter);
  }, [roleFilter]);

  const toggleResponsibilities = (id: string) => {
    setExpandedAgents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-midnight-900 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-grid-fade opacity-80" />
      <div className="relative z-10 px-6 pb-20 pt-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-10">
          <header className="flex flex-col gap-6">
            <Navigation />
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-aurora-300/80">
                Mission Control
              </p>
              <h1 className="text-4xl font-semibold text-white">Team Structure</h1>
              <p className="max-w-2xl text-sm text-slate-300">
                Barry&apos;s agent roster keeps Mission Control humming, with every role mapped to current status,
                responsibilities, and momentum.
              </p>
            </div>
          </header>

          <section className="glass-panel rounded-3xl px-6 py-5">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total agents</p>
                <p className="mt-2 text-2xl font-semibold text-white">{summary.totalAgents}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Active now</p>
                <p className="mt-2 text-2xl font-semibold text-white">{summary.activeNow}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Tasks completed today</p>
                <p className="mt-2 text-2xl font-semibold text-white">{summary.tasksCompletedToday}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Sessions spawned today</p>
                <p className="mt-2 text-2xl font-semibold text-white">{summary.sessionsToday}</p>
              </div>
            </div>
          </section>

          <section className="glass-panel rounded-3xl px-6 py-6">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-aurora-300">Org chart</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Leadership and reporting lines</h2>
              </div>

              <div className="hidden md:flex flex-col items-center">
                <div
                  className={`relative flex flex-col items-center gap-2 rounded-3xl border border-slate-700/60 px-6 py-4 text-center ring-1 ${
                    ACCENT_STYLES[leader.accent].ring
                  } ${ACCENT_STYLES[leader.accent].glow}`}
                >
                  <span className="text-4xl">{leader.emoji}</span>
                  <div>
                    <p className="text-lg font-semibold text-white">{leader.name}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{leader.role}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold ${
                      STATUS_STYLES[leader.status].badge
                    }`}
                  >
                    {STATUS_STYLES[leader.status].icon}
                    {STATUS_STYLES[leader.status].label}
                  </span>
                </div>

                <div className="relative mt-8 w-full max-w-4xl">
                  <div className="absolute left-1/2 top-0 h-6 w-px -translate-x-1/2 bg-slate-600/70" />
                  <div className="absolute left-1/2 top-6 h-px w-full -translate-x-1/2 bg-slate-600/40" />
                  <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {subAgents.map((agent) => (
                      <div
                        key={agent.id}
                        className="relative flex flex-col items-center gap-2 rounded-2xl border border-slate-700/50 bg-midnight-800/70 px-4 py-3 text-center"
                      >
                        <span className="text-2xl">{agent.emoji}</span>
                        <div>
                          <p className="text-sm font-semibold text-white">{agent.name}</p>
                          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{agent.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="md:hidden">
                <div className="flex flex-col gap-3">
                  {[leader, ...subAgents].map((agent) => (
                    <div
                      key={agent.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-700/60 bg-midnight-800/70 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{agent.emoji}</span>
                        <div>
                          <p className="text-sm font-semibold text-white">{agent.name}</p>
                          <p className="text-xs text-slate-400">{agent.role}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold ${STATUS_STYLES[agent.status].text}`}>
                        {STATUS_STYLES[agent.status].label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-aurora-300">Agent roster</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Roles, responsibilities, and activity</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 rounded-full border border-slate-700/50 bg-midnight-800/60 p-1">
                  {(["grid", "list"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setViewMode(mode)}
                      className={`rounded-full px-4 py-1 text-xs font-semibold transition ${
                        viewMode === mode
                          ? "bg-aurora-500/30 text-aurora-200"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {mode === "grid" ? "Grid" : "List"}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {ROLE_FILTERS.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setRoleFilter(filter.id)}
                      className={`rounded-full border px-4 py-1 text-xs font-semibold transition ${
                        roleFilter === filter.id
                          ? "border-aurora-400/60 bg-aurora-500/15 text-aurora-200"
                          : "border-slate-700/60 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div
              className={
                viewMode === "grid"
                  ? "grid gap-6 md:grid-cols-2 xl:grid-cols-3"
                  : "flex flex-col gap-4"
              }
            >
              {filteredAgents.map((agent) => {
                const accent = ACCENT_STYLES[agent.accent];
                const status = STATUS_STYLES[agent.status];
                const isExpanded = expandedAgents.has(agent.id);
                const visibleResponsibilities = isExpanded
                  ? agent.responsibilities
                  : agent.responsibilities.slice(0, 3);
                const hiddenCount = agent.responsibilities.length - visibleResponsibilities.length;

                return (
                  <article
                    key={agent.id}
                    className={`relative overflow-hidden rounded-3xl border border-slate-700/50 bg-midnight-800/70 p-6 ring-1 ${
                      accent.ring
                    } ${accent.glow} ${viewMode === "list" ? "md:flex md:gap-6" : ""}`}
                  >
                    <span className={`absolute inset-x-0 top-0 h-1 ${accent.bar}`} />
                    <div className={viewMode === "list" ? "flex items-start gap-4" : ""}>
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900/70 text-3xl">
                        {agent.emoji}
                      </div>
                      <div className="mt-4 flex-1 md:mt-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-semibold text-white">{agent.name}</h3>
                          <span className="rounded-full border border-slate-700/60 bg-slate-900/60 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-300">
                            {agent.role}
                          </span>
                          <span className="rounded-full border border-slate-700/60 bg-slate-900/60 px-3 py-1 text-[11px] text-slate-300">
                            {agent.model}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                              status.badge
                            }`}
                          >
                            {status.icon}
                            {status.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-6">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Responsibilities</p>
                        <ul className="mt-3 space-y-2 text-sm text-slate-200">
                          {visibleResponsibilities.map((item) => (
                            <li key={item} className="flex items-start gap-2">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-aurora-400" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                        {hiddenCount > 0 ? (
                          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                            <span>Hidden items: {hiddenCount}</span>
                            <button
                              type="button"
                              onClick={() => toggleResponsibilities(agent.id)}
                              className="rounded-full border border-slate-700/60 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-aurora-400/60 hover:text-aurora-200"
                            >
                              {isExpanded ? "Collapse" : "Show all"}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleResponsibilities(agent.id)}
                            className="mt-3 rounded-full border border-slate-700/60 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-aurora-400/60 hover:text-aurora-200"
                          >
                            {isExpanded ? "Collapse" : "Show details"}
                          </button>
                        )}
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Recent activity</p>
                        <ul className="mt-3 space-y-2 text-sm text-slate-200">
                          {agent.recentActivity.map((entry) => (
                            <li key={entry.label} className="flex items-start gap-2">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-comet-400" />
                              <div>
                                <p className="font-medium text-slate-100">{entry.label}</p>
                                <p className="text-xs text-slate-400">{formatTimestamp(entry.timestamp)}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="grid gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/50 p-4 text-sm text-slate-200 sm:grid-cols-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Tasks completed</p>
                          <p className="mt-1 text-lg font-semibold text-white">{agent.stats.tasksCompleted}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Last active</p>
                          <p className="mt-1 text-xs text-slate-200">{formatTimestamp(agent.stats.lastActive)}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Success rate</p>
                          <p className="mt-1 text-lg font-semibold text-white">{formatRate(agent.stats.successRate)}</p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
