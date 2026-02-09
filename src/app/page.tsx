"use client";

import { useEffect, useMemo, useState } from "react";
import { Navigation, ViewType } from "@/components/navigation";
import { CalendarView } from "@/components/calendar-view";
import { SearchView } from "@/components/search-view";
import { ProjectsView } from "@/components/projects-view";
import { SummaryView } from "@/components/summary-view";

interface Activity {
  id: string;
  timestamp: string;
  actionType: string;
  description: string;
  project: string;
  status: string;
}

const actionTypes = ["all", "research", "code", "message", "file", "deploy"] as const;
const statuses = ["all", "success", "pending", "failed"] as const;

const statusStyles: Record<string, string> = {
  success: "bg-aurora-500/15 text-aurora-400 border-aurora-500/30",
  pending: "bg-comet-500/15 text-comet-400 border-comet-500/30",
  failed: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    actionType: "all",
    project: "all",
    status: "all",
  });
  const [visibleCount, setVisibleCount] = useState(8);

  // Fetch activities from static JSON (updated by Barry)
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await fetch("/api/activities?" + Date.now());
        const data = await res.json();
        setActivities(data);
        setLastUpdate(new Date());
      } catch (err) {
        console.error("Failed to load activities:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
    // Refresh every 5 minutes
    const interval = setInterval(fetchActivities, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const projects = useMemo(() => {
    const unique = new Set(activities.map((activity) => activity.project));
    return ["all", ...Array.from(unique).sort()];
  }, [activities]);

  const filtered = useMemo(() => {
    return activities.filter((activity) => {
      if (filters.actionType !== "all" && activity.actionType !== filters.actionType) {
        return false;
      }
      if (filters.project !== "all" && activity.project !== filters.project) {
        return false;
      }
      if (filters.status !== "all" && activity.status !== filters.status) {
        return false;
      }
      if (filters.startDate) {
        const start = new Date(filters.startDate).getTime();
        if (activity.timestamp && new Date(activity.timestamp).getTime() < start) {
          return false;
        }
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate).getTime() + 24 * 60 * 60 * 1000 - 1;
        if (activity.timestamp && new Date(activity.timestamp).getTime() > end) {
          return false;
        }
      }
      return true;
    });
  }, [filters, activities]);

  const visibleActivities = filtered.slice(0, visibleCount);

  const successRate = Math.round(
    (filtered.filter((activity) => activity.status === "success").length /
      Math.max(filtered.length, 1)) *
      100,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400">Loading activities...</div>
      </div>
    );
  }

  return (
    <>
      {lastUpdate && (
        <p className="mb-4 text-xs text-slate-500">
          Last updated: {lastUpdate.toLocaleString()}
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-panel rounded-2xl px-5 py-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Total Events</p>
          <p className="mt-3 text-3xl font-semibold text-white">{filtered.length}</p>
          <p className="mt-2 text-xs text-slate-400">Showing filtered results</p>
        </div>
        <div className="glass-panel rounded-2xl px-5 py-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Success Rate</p>
          <p className="mt-3 text-3xl font-semibold text-white">{successRate}%</p>
          <p className="mt-2 text-xs text-slate-400">Across selected activities</p>
        </div>
        <div className="glass-panel rounded-2xl px-5 py-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Active Projects</p>
          <p className="mt-3 text-3xl font-semibold text-white">{projects.length - 1}</p>
          <p className="mt-2 text-xs text-slate-400">Distinct workstreams</p>
        </div>
      </div>

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
        <div className="glass-panel rounded-3xl p-6">
          <h2 className="text-lg font-semibold text-white">Filters</h2>
          <p className="mt-2 text-sm text-slate-400">
            Slice by timeframe, signal type, project, and status.
          </p>

          <div className="mt-6 grid gap-4 text-sm">
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Start Date</span>
              <input
                type="date"
                value={filters.startDate}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, startDate: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-700/60 bg-midnight-700/60 px-3 py-2 text-slate-100 outline-none transition focus:border-aurora-500/70"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400">End Date</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, endDate: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-700/60 bg-midnight-700/60 px-3 py-2 text-slate-100 outline-none transition focus:border-aurora-500/70"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Action Type</span>
              <select
                value={filters.actionType}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, actionType: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-700/60 bg-midnight-700/60 px-3 py-2 text-slate-100 outline-none transition focus:border-aurora-500/70"
              >
                {actionTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === "all" ? "All" : type}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Project</span>
              <select
                value={filters.project}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, project: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-700/60 bg-midnight-700/60 px-3 py-2 text-slate-100 outline-none transition focus:border-aurora-500/70"
              >
                {projects.map((project) => (
                  <option key={project} value={project}>
                    {project === "all" ? "All" : project}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Status</span>
              <select
                value={filters.status}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, status: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-700/60 bg-midnight-700/60 px-3 py-2 text-slate-100 outline-none transition focus:border-aurora-500/70"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status === "all" ? "All" : status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            type="button"
            onClick={() => {
              setFilters({
                startDate: "",
                endDate: "",
                actionType: "all",
                project: "all",
                status: "all",
              });
              setVisibleCount(8);
            }}
            className="mt-6 w-full rounded-xl border border-aurora-500/50 bg-aurora-500/10 px-4 py-2 text-sm text-aurora-200 transition hover:bg-aurora-500/20"
          >
            Reset filters
          </button>
        </div>

        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              {visibleActivities.length} / {filtered.length}
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {visibleActivities.map((activity) => (
              <article
                key={activity.id}
                className="rounded-2xl border border-slate-800/80 bg-midnight-800/80 p-4 transition hover:border-aurora-500/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="rounded-lg bg-indigo-500/20 border border-indigo-400/40 px-3 py-1 text-sm font-medium text-indigo-300">
                      {activity.project}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs uppercase tracking-[0.15em] ${
                        statusStyles[activity.status]
                      }`}
                    >
                      {activity.status}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(activity.timestamp).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    · {new Date(activity.timestamp).toLocaleDateString("en-US", {
                      month: "short",
                      day: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-200">{activity.description}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-full bg-slate-800/60 px-2 py-0.5 text-xs text-slate-400">
                    {activity.actionType}
                  </span>
                </div>
              </article>
            ))}
          </div>

          {visibleActivities.length < filtered.length && (
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 4)}
              className="mt-6 w-full rounded-xl border border-slate-700/70 bg-midnight-700/50 px-4 py-2 text-sm text-slate-200 transition hover:border-aurora-500/40"
            >
              Load more activity
            </button>
          )}
        </div>
      </section>
    </>
  );
}

export default function MissionControlPage() {
  const [activeView, setActiveView] = useState<ViewType>("summary");

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-grid-fade" />
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-10">
        <header className="flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-aurora-400/80">
                Mission Control
              </p>
              <h1 className="mt-2 text-4xl font-semibold text-white">
                {activeView === "summary" && "Executive Summary"}
                {activeView === "activity" && "Activity Feed"}
                {activeView === "projects" && "Project Tracker"}
                {activeView === "calendar" && "Schedule Calendar"}
                {activeView === "search" && "Global Search"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-300">
                {activeView === "summary" &&
                  "Daily highlights, decisions, shipped items, and blockers. The executive view."}
                {activeView === "activity" &&
                  "Live telemetry from Barry's sessions. Track intent, context, and delivery status."}
                {activeView === "projects" &&
                  "Stage gate view of all projects. Research → Planning → Development → Testing → Production."}
                {activeView === "calendar" &&
                  "Visualize scheduled tasks, cron jobs, and automated workflows."}
                {activeView === "search" &&
                  "Search across memory, projects, files, and activity logs."}
              </p>
            </div>
            <div className="glass-panel flex items-center gap-3 rounded-full px-4 py-2 text-xs text-slate-200">
              <span className="h-2 w-2 rounded-full bg-aurora-500 shadow-[0_0_12px_rgba(84,240,193,0.8)]" />
              System operational
            </div>
          </div>

          <Navigation activeView={activeView} onViewChange={setActiveView} />
        </header>

        <div className="mt-8">
          {activeView === "summary" && <SummaryView />}
          {activeView === "activity" && <ActivityFeed />}
          {activeView === "projects" && <ProjectsView />}
          {activeView === "calendar" && <CalendarView />}
          {activeView === "search" && <SearchView />}
        </div>
      </div>
    </main>
  );
}
