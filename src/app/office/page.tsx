"use client";

import { useEffect, useMemo, useState } from "react";
import { Navigation } from "@/components/navigation";
import { teamAgents, type AgentProfile } from "@/data/team";

const STATE_STYLES: Record<
  AgentProfile["state"],
  { label: string; light: string; glow: string; text: string; monitor: string }
> = {
  working: {
    label: "Working",
    light: "bg-emerald-400",
    glow: "ring-emerald-400/40",
    text: "text-emerald-200",
    monitor: "border-emerald-400/50 bg-emerald-500/10",
  },
  idle: {
    label: "Idle",
    light: "bg-slate-500",
    glow: "ring-slate-500/30",
    text: "text-slate-300",
    monitor: "border-slate-700/60 bg-slate-900/70",
  },
  scheduled: {
    label: "Scheduled",
    light: "bg-amber-400",
    glow: "ring-amber-400/40",
    text: "text-amber-200",
    monitor: "border-amber-400/40 bg-amber-500/10",
  },
  error: {
    label: "Error",
    light: "bg-rose-500",
    glow: "ring-rose-500/50",
    text: "text-rose-200",
    monitor: "border-rose-500/50 bg-rose-500/15",
  },
};

const MONITOR_ICONS: Record<string, string> = {
  barry: "🧭",
  codex: "⌘",
  scout: "🔎",
  analyst: "📈",
  scribe: "🧾",
  designer: "🎨",
  devops: "⌘",
  auditor: "🛡️",
};

function formatTimestamp(value?: string) {
  if (!value) return "Unknown";
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

function formatDuration(start?: string, now?: Date) {
  if (!start || !now) return "Unknown";
  const started = new Date(start);
  if (Number.isNaN(started.getTime())) return "Unknown";
  const diffMs = Math.max(now.getTime() - started.getTime(), 0);
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function formatClock(now: Date) {
  return now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getActivityText(agent: AgentProfile) {
  if (agent.currentActivity) return agent.currentActivity;
  if (agent.currentTask) return agent.currentTask;
  if (agent.state === "scheduled") return "Waiting for scheduled run";
  if (agent.state === "error") return "Recovering from an error";
  return "Idle";
}

function Workstation({ agent, now }: { agent: AgentProfile; now: Date }) {
  const stateStyle = STATE_STYLES[agent.state];
  const activityText = getActivityText(agent);
  const isWorking = agent.state === "working";
  const isIdle = agent.state === "idle";
  const isError = agent.state === "error";
  const isLead = agent.id === "barry";
  const icon = MONITOR_ICONS[agent.id] ?? "•";

  return (
    <div
      className={`group relative flex flex-col items-center gap-3 rounded-3xl border border-slate-700/60 bg-midnight-800/80 p-4 text-center transition duration-300 focus-within:-translate-y-1 focus-within:shadow-2xl hover:-translate-y-1 hover:shadow-2xl ${
        isLead ? "md:scale-[1.02]" : ""
      }`}
      tabIndex={0}
      aria-label={`${agent.name} workstation`}
    >
      <div
        className={`relative w-full rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4 shadow-inner ${
          isError ? "ring-2 ring-rose-500/40" : ""
        }`}
      >
        <span className={`absolute right-3 top-3 h-3 w-3 rounded-full ${stateStyle.light} ${
          isWorking ? "office-status-pulse" : ""
        }`} />
        <div className="flex items-center justify-between gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full border border-slate-700/60 bg-slate-950/60 text-2xl ${
            isIdle ? "opacity-50" : ""
          }`}>
            {agent.emoji}
          </div>
          <div
            className={`relative flex h-10 w-14 items-center justify-center overflow-hidden rounded-lg border ${
              stateStyle.monitor
            } ${isWorking ? "office-screen-active" : ""} ${isIdle ? "opacity-50" : ""}`}
          >
            {(agent.id === "codex" || agent.id === "devops") && isWorking ? (
              <div className="flex h-full w-full flex-col justify-center gap-1 px-2">
                <span className="h-1 w-8 rounded bg-aurora-400/80" />
                <span className="h-1 w-6 rounded bg-aurora-400/60" />
                <span className="h-1 w-5 rounded bg-aurora-400/40" />
                <span className="office-cursor absolute bottom-1 right-2 h-2 w-1 rounded bg-aurora-300" />
              </div>
            ) : (
              <span className="text-base text-slate-200">{icon}</span>
            )}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="h-2 w-12 rounded-full bg-slate-800/80" />
          {isWorking ? (
            <div className="flex items-center gap-1">
              <span className="office-typing-dot h-1.5 w-1.5 rounded-full bg-aurora-300" />
              <span
                className="office-typing-dot h-1.5 w-1.5 rounded-full bg-aurora-300"
                style={{ animationDelay: "0.2s" }}
              />
              <span
                className="office-typing-dot h-1.5 w-1.5 rounded-full bg-aurora-300"
                style={{ animationDelay: "0.4s" }}
              />
            </div>
          ) : null}
        </div>
        {isError ? (
          <span className="absolute -top-2 right-10 rounded-full bg-rose-500/90 px-2 py-1 text-xs font-semibold text-white">
            ❗
          </span>
        ) : null}
      </div>

      <div className="space-y-1">
        <p className="text-sm font-semibold text-white">{agent.name}</p>
        <p className={`text-xs ${stateStyle.text}`}>{stateStyle.label}</p>
        <p className="text-xs text-slate-400">{activityText}</p>
      </div>

      <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-3 w-64 -translate-x-1/2 rounded-2xl border border-slate-700/70 bg-slate-950/95 p-4 text-left text-xs text-slate-200 opacity-0 shadow-2xl transition duration-200 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{agent.emoji}</span>
          <div>
            <p className="text-sm font-semibold text-white">{agent.name}</p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{agent.role}</p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Current task</p>
            <p className="mt-1 text-sm text-slate-100">{agent.currentTask ?? "Idle"}</p>
            <p className="text-[11px] text-slate-400">
              Duration: {formatDuration(agent.currentTaskStarted, now)}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Last completed</p>
            <p className="mt-1 text-sm text-slate-100">{agent.lastTask ?? "None"}</p>
            <p className="text-[11px] text-slate-400">{formatTimestamp(agent.lastTaskCompleted)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Model</p>
            <p className="mt-1 text-sm text-slate-100">{agent.model}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Sessions today</p>
              <p className="mt-1 text-sm text-slate-100">{agent.sessionsToday}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Tasks today</p>
              <p className="mt-1 text-sm text-slate-100">{agent.tasksCompletedToday}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Success rate</p>
              <p className="mt-1 text-sm text-slate-100">{agent.stats.successRate.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Last status</p>
              <p className="mt-1 text-sm text-slate-100">{agent.lastTaskStatus ?? "Ok"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OfficePage() {
  const [agents, setAgents] = useState<AgentProfile[]>(teamAgents);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    let isActive = true;

    const fetchAgents = async () => {
      try {
        const res = await fetch("/api/office", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (isActive && Array.isArray(data.agents)) {
          setAgents(data.agents);
          setLastUpdated(new Date());
        }
      } catch {
        return;
      }
    };

    fetchAgents();
    const interval = window.setInterval(fetchAgents, 30000);
    return () => {
      isActive = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const ticker = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(ticker);
  }, []);

  const workingCount = useMemo(() => agents.filter((agent) => agent.state === "working").length, [agents]);
  const scheduledCount = useMemo(() => agents.filter((agent) => agent.state === "scheduled").length, [agents]);

  const secondsSinceUpdate = lastUpdated
    ? Math.floor((now.getTime() - lastUpdated.getTime()) / 1000)
    : null;

  const lastUpdatedLabel = useMemo(() => {
    if (!secondsSinceUpdate && secondsSinceUpdate !== 0) return "Awaiting sync";
    if (secondsSinceUpdate < 5) return "Updated moments ago";
    const unit = secondsSinceUpdate === 1 ? "second" : "seconds";
    return `Last updated: ${secondsSinceUpdate} ${unit} ago`;
  }, [secondsSinceUpdate]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-midnight-900 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-grid-fade opacity-70" />
      <div className="relative z-10 px-6 pb-20 pt-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-10">
          <header className="flex flex-col gap-6">
            <Navigation />
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-aurora-300/80">
                Mission Control
              </p>
              <h1 className="text-4xl font-semibold text-white">Digital Office</h1>
              <p className="max-w-2xl text-sm text-slate-300">
                A living workspace view of every agent workstation, status light, and active mission pulse.
              </p>
            </div>
          </header>

          <section className="grid gap-4 lg:grid-cols-3">
            <div className="glass-panel rounded-3xl px-6 py-5 lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Office status</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{workingCount} agents working</p>
                  <p className="mt-1 text-xs text-slate-400">Scheduled runs queued: {scheduledCount}</p>
                </div>
                <div className="rounded-2xl border border-slate-700/60 bg-slate-900/50 px-4 py-3 text-center">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Wall clock</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{formatClock(now)}</p>
                  <p className="mt-1 text-[11px] text-slate-400">Local time</p>
                </div>
              </div>
            </div>
            <div className="glass-panel rounded-3xl px-6 py-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status legend</p>
              <div className="mt-4 space-y-3 text-sm text-slate-200">
                {Object.entries(STATE_STYLES).map(([key, style]) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className={`h-2.5 w-2.5 rounded-full ${style.light}`} />
                    <span>{style.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-[36px] border border-slate-700/70 bg-[radial-gradient(circle_at_top,_rgba(84,240,193,0.12),_transparent_60%),linear-gradient(135deg,_rgba(15,23,42,0.95),_rgba(3,7,18,0.95))] p-6 shadow-[0_35px_120px_rgba(3,7,18,0.6)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-aurora-300">Office floor</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Agent workstations</h2>
              </div>
              <div className="flex items-center gap-3 rounded-full border border-slate-700/60 bg-slate-900/60 px-4 py-2 text-xs text-slate-300">
                <span className="h-2 w-2 rounded-full bg-aurora-400" />
                <span>Auto refresh every 30 seconds</span>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {agents.map((agent) => (
                <Workstation key={agent.id} agent={agent} now={now} />
              ))}
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between rounded-3xl border border-slate-700/60 bg-slate-900/50 px-6 py-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Break room</p>
                  <p className="mt-2 text-lg font-semibold text-white">Coffee corner</p>
                  <p className="mt-1 text-xs text-slate-400">Quiet zone for idle cooldowns</p>
                </div>
                <div className="text-3xl">☕</div>
              </div>
              <div className="flex items-center justify-between rounded-3xl border border-slate-700/60 bg-slate-900/50 px-6 py-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">War room</p>
                  <p className="mt-2 text-lg font-semibold text-white">Collaboration sprint</p>
                  <p className="mt-1 text-xs text-slate-400">Multi-agent deep work zone</p>
                </div>
                <div className="text-3xl">📋</div>
              </div>
            </div>
          </section>

          <footer className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
            <span>{lastUpdatedLabel}</span>
            <span>Tap a workstation to review full agent details</span>
          </footer>
        </div>
      </div>
    </main>
  );
}
