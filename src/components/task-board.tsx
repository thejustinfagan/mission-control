"use client";

import { useEffect, useMemo, useState } from "react";
import { type Task } from "@/data/tasks";

interface ProjectMeta {
  label: string;
  emoji: string;
  badge: string;
  accent: string;
}

const PROJECT_META: Record<string, ProjectMeta> = {
  "fleet-intel": {
    label: "Fleet Intel",
    emoji: "🚛",
    badge: "bg-aurora-500/15 text-aurora-300 border-aurora-500/40",
    accent: "border-aurora-400/50",
  },
  "battle-dinghy": {
    label: "Battle Dinghy",
    emoji: "⚔️",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/40",
    accent: "border-amber-400/50",
  },
  "dc-land-intel": {
    label: "DC Land Intel",
    emoji: "🏛️",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/40",
    accent: "border-sky-400/50",
  },
  polymarket: {
    label: "Polymarket",
    emoji: "📊",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
    accent: "border-emerald-400/50",
  },
  "public-data": {
    label: "Public Data",
    emoji: "🔍",
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/40",
    accent: "border-purple-400/50",
  },
  "ai-calibration": {
    label: "AI Calibration",
    emoji: "🧪",
    badge: "bg-comet-500/15 text-comet-300 border-comet-500/40",
    accent: "border-comet-400/50",
  },
};

const DEFAULT_PROJECT_META: ProjectMeta = {
  label: "Unassigned",
  emoji: "📌",
  badge: "bg-slate-500/15 text-slate-300 border-slate-500/40",
  accent: "border-slate-600/50",
};

const ASSIGNEE_META: Record<Task["assignee"], { label: string; badge: string }> = {
  barry: {
    label: "🤖 Barry",
    badge: "bg-aurora-500/15 text-aurora-300 border-aurora-500/40",
  },
  justin: {
    label: "👤 Justin",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  },
  both: {
    label: "👥 Both",
    badge: "bg-slate-500/15 text-slate-200 border-slate-500/40",
  },
};

const PRIORITY_META: Record<Task["priority"], { label: string; badge: string; order: number }> = {
  critical: {
    label: "🔴 Critical",
    badge: "bg-red-500/20 text-red-300 border-red-500/40",
    order: 0,
  },
  high: {
    label: "🟠 High",
    badge: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    order: 1,
  },
  medium: {
    label: "🟡 Medium",
    badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
    order: 2,
  },
  low: {
    label: "⚪ Low",
    badge: "bg-slate-500/20 text-slate-300 border-slate-500/40",
    order: 3,
  },
};

const STATUS_META: Record<Task["status"], { label: string; badge: string; hint: string }> = {
  todo: {
    label: "Todo",
    badge: "bg-slate-700/60 text-slate-200 border-slate-600/40",
    hint: "Up next",
  },
  "in-progress": {
    label: "In Progress",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    hint: "Active work",
  },
  blocked: {
    label: "Blocked",
    badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    hint: "Needs help",
  },
  done: {
    label: "Done",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    hint: "Recently finished",
  },
};

const STATUSES: Task["status"][] = ["todo", "in-progress", "blocked", "done"];

type AssigneeFilter = "all" | "justin" | "barry";
type PriorityFilter = "all" | Task["priority"];

type ProjectOption = {
  id: string;
  label: string;
};

function formatProjectLabel(projectId: string): string {
  return projectId
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function matchesAssignee(task: Task, filter: AssigneeFilter): boolean {
  if (filter === "all") return true;
  if (filter === "justin") return task.assignee === "justin" || task.assignee === "both";
  return task.assignee === "barry" || task.assignee === "both";
}

function prioritySort(a: Task, b: Task): number {
  const priorityDelta = PRIORITY_META[a.priority].order - PRIORITY_META[b.priority].order;
  if (priorityDelta !== 0) return priorityDelta;
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

function doneSort(a: Task, b: Task): number {
  const aDate = new Date(a.completedAt || a.updatedAt).getTime();
  const bDate = new Date(b.completedAt || b.updatedAt).getTime();
  return bDate - aDate;
}

function TaskCard({ task }: { task: Task }) {
  const projectMeta = PROJECT_META[task.project] || {
    ...DEFAULT_PROJECT_META,
    label: formatProjectLabel(task.project),
  };
  const assigneeMeta = ASSIGNEE_META[task.assignee];
  const priorityMeta = PRIORITY_META[task.priority];

  return (
    <article
      className={`rounded-xl border bg-midnight-800/70 p-4 shadow-panel transition hover:-translate-y-0.5 hover:shadow-glow ${projectMeta.accent}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-white leading-snug">{task.title}</h3>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${priorityMeta.badge}`}>
          {priorityMeta.label}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${projectMeta.badge}`}>
          <span className="mr-1">{projectMeta.emoji}</span>
          {projectMeta.label}
        </span>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${assigneeMeta.badge}`}>
          {assigneeMeta.label}
        </span>
      </div>

      {task.description && <p className="mt-2 text-xs text-slate-300">{task.description}</p>}

      {task.tags && task.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-slate-600/40 bg-slate-700/40 px-2 py-0.5 text-[10px] text-slate-200"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {task.status === "blocked" && task.blockedReason && (
        <p className="mt-3 text-xs text-rose-300">Blocked: {task.blockedReason}</p>
      )}

      <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
        <span>Updated {formatDate(task.updatedAt)}</span>
        {task.status === "done" && task.completedAt ? (
          <span className="text-emerald-300">Completed {formatDate(task.completedAt)}</span>
        ) : null}
      </div>
    </article>
  );
}

export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilter>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [search, setSearch] = useState<string>("");
  const [showDone, setShowDone] = useState<boolean>(true);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    const loadTasks = async () => {
      try {
        const response = await fetch("/api/tasks", { signal: controller.signal });
        if (!response.ok) throw new Error("Failed to fetch tasks");
        const data = (await response.json()) as Task[];
        if (isActive) setTasks(Array.isArray(data) ? data : []);
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        console.error("Failed to load tasks:", error);
      }
    };

    loadTasks();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  const projectOptions = useMemo<ProjectOption[]>(() => {
    const ids = Array.from(new Set(tasks.map((task) => task.project)));
    return ids
      .map((id) => ({
        id,
        label: PROJECT_META[id]?.label || formatProjectLabel(id),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => {
      if (!matchesAssignee(task, assigneeFilter)) return false;
      if (projectFilter !== "all" && task.project !== projectFilter) return false;
      if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
      if (query) {
        const inTitle = task.title.toLowerCase().includes(query);
        const inDescription = task.description?.toLowerCase().includes(query) || false;
        const inTags = task.tags?.some((tag) => tag.toLowerCase().includes(query)) || false;
        if (!inTitle && !inDescription && !inTags) return false;
      }
      return true;
    });
  }, [assigneeFilter, priorityFilter, projectFilter, search, tasks]);

  const tasksByStatus = useMemo<Record<Task["status"], Task[]>>(() => {
    const grouped: Record<Task["status"], Task[]> = {
      todo: [],
      "in-progress": [],
      blocked: [],
      done: [],
    };

    for (const task of filteredTasks) {
      grouped[task.status].push(task);
    }

    grouped.todo.sort(prioritySort);
    grouped["in-progress"].sort(prioritySort);
    grouped.blocked.sort(prioritySort);
    grouped.done.sort(doneSort);

    return grouped;
  }, [filteredTasks]);

  const summary = useMemo(() => {
    const total = tasks.length;
    const justinTasks = tasks.filter(
      (task) => task.assignee === "justin" || task.assignee === "both"
    );
    const barryTasks = tasks.filter(
      (task) => task.assignee === "barry" || task.assignee === "both"
    );
    const justinBlocked = justinTasks.filter((task) => task.status === "blocked").length;
    const barryInProgress = barryTasks.filter((task) => task.status === "in-progress").length;
    const todayKey = new Date().toISOString().split("T")[0];
    const completedToday = tasks.filter(
      (task) => task.status === "done" && task.completedAt?.startsWith(todayKey)
    ).length;

    return {
      total,
      justinCount: justinTasks.length,
      barryCount: barryTasks.length,
      justinBlocked,
      barryInProgress,
      completedToday,
    };
  }, [tasks]);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="glass-panel rounded-2xl px-5 py-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Total Tasks</p>
          <p className="mt-3 text-3xl font-semibold text-white">{summary.total}</p>
          <p className="mt-2 text-xs text-slate-400">Across all projects</p>
        </div>
        <div className="glass-panel rounded-2xl px-5 py-4">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Justin&apos;s Tasks</p>
          <p className="mt-3 text-3xl font-semibold text-amber-300">{summary.justinCount}</p>
          <p className="mt-2 text-xs text-slate-400">{summary.justinBlocked} blocked</p>
        </div>
        <div className="glass-panel rounded-2xl px-5 py-4">
          <p className="text-xs uppercase tracking-[0.3em] text-aurora-400">Barry&apos;s Tasks</p>
          <p className="mt-3 text-3xl font-semibold text-aurora-300">{summary.barryCount}</p>
          <p className="mt-2 text-xs text-slate-400">{summary.barryInProgress} in progress</p>
        </div>
        <div className="glass-panel rounded-2xl px-5 py-4">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Completed Today</p>
          <p className="mt-3 text-3xl font-semibold text-emerald-300">{summary.completedToday}</p>
          <p className="mt-2 text-xs text-slate-400">Tasks closed today</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel rounded-2xl p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <label className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Assignee</label>
              <select
                value={assigneeFilter}
                onChange={(event) => setAssigneeFilter(event.target.value as AssigneeFilter)}
                className="mt-2 w-full rounded-xl border border-slate-700/60 bg-midnight-700/60 px-3 py-2 text-xs text-slate-100 outline-none transition focus:border-aurora-500/70"
              >
                <option value="all">All</option>
                <option value="justin">Justin</option>
                <option value="barry">Barry</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Project</label>
              <select
                value={projectFilter}
                onChange={(event) => setProjectFilter(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-700/60 bg-midnight-700/60 px-3 py-2 text-xs text-slate-100 outline-none transition focus:border-aurora-500/70"
              >
                <option value="all">All Projects</option>
                {projectOptions.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Priority</label>
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value as PriorityFilter)}
                className="mt-2 w-full rounded-xl border border-slate-700/60 bg-midnight-700/60 px-3 py-2 text-xs text-slate-100 outline-none transition focus:border-aurora-500/70"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Search</label>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tasks..."
                className="mt-2 w-full rounded-xl border border-slate-700/60 bg-midnight-700/60 px-3 py-2 text-xs text-slate-100 outline-none transition focus:border-aurora-500/70"
              />
            </div>
          </div>
          <div className="text-xs text-slate-400">
            Showing {filteredTasks.length} of {tasks.length} tasks
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STATUSES.map((status) => {
          const meta = STATUS_META[status];
          const tasksForStatus = tasksByStatus[status];
          const isDone = status === "done";
          const visibleTasks = isDone && !showDone ? [] : isDone ? tasksForStatus.slice(0, 10) : tasksForStatus;

          return (
            <section key={status} className="rounded-2xl border border-slate-800/70 bg-midnight-800/40 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-white">{meta.label}</h3>
                  <p className="text-[10px] text-slate-400">{meta.hint}</p>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.badge}`}>
                  {tasksForStatus.length}
                </span>
              </div>

              {isDone && (
                <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Showing latest 10</span>
                  <button
                    onClick={() => setShowDone((prev) => !prev)}
                    className="rounded-full border border-slate-700/60 px-2 py-0.5 text-slate-200 transition hover:border-aurora-500/40 hover:text-aurora-200"
                  >
                    {showDone ? "Collapse" : "Expand"}
                  </button>
                </div>
              )}

              <div className="mt-4 space-y-3">
                {visibleTasks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-700/60 bg-midnight-900/40 px-3 py-6 text-center text-xs text-slate-500">
                    {isDone
                      ? "Done tasks hidden"
                      : "No tasks here yet"}
                  </div>
                ) : (
                  visibleTasks.map((task) => <TaskCard key={task.id} task={task} />)
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
