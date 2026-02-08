"use client";

import { useMemo, useState } from "react";

interface ScheduledTask {
  id: string;
  name: string;
  schedule: string;
  time: string;
  dayOfWeek?: number | "daily" | "weekdays";
  description: string;
  status: "active" | "paused";
}

const scheduledTasks: ScheduledTask[] = [
  {
    id: "task_001",
    name: "Nightly Amazement Build",
    schedule: "Daily",
    time: "01:00",
    dayOfWeek: "daily",
    description: "Overnight development builds and deployments",
    status: "active",
  },
  {
    id: "task_002",
    name: "Strategic Review",
    schedule: "Daily",
    time: "03:00",
    dayOfWeek: "daily",
    description: "Deep research and planning session",
    status: "active",
  },
  {
    id: "task_003",
    name: "Morning Briefing",
    schedule: "Daily",
    time: "06:00",
    dayOfWeek: "daily",
    description: "Daily summary delivered to Telegram",
    status: "active",
  },
  {
    id: "task_004",
    name: "Tracker Update",
    schedule: "Every 30 min",
    time: "08:00-21:00",
    dayOfWeek: "daily",
    description: "GitHub gist tracker updates during active hours",
    status: "active",
  },
  {
    id: "task_005",
    name: "Heartbeat Check",
    schedule: "Every 30 min",
    time: "07:00-22:00",
    dayOfWeek: "daily",
    description: "Check for pending work, staleness, blockers",
    status: "active",
  },
  {
    id: "task_006",
    name: "Polymarket Daily Report",
    schedule: "Daily",
    time: "06:00",
    dayOfWeek: "daily",
    description: "Paper trading positions and signal analysis",
    status: "active",
  },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatHour(hour: number): string {
  if (hour === 0) return "12am";
  if (hour === 12) return "12pm";
  if (hour < 12) return `${hour}am`;
  return `${hour - 12}pm`;
}

function getTasksForHour(hour: number, tasks: ScheduledTask[]): ScheduledTask[] {
  return tasks.filter((task) => {
    if (task.time.includes("-")) {
      // Range like "08:00-21:00"
      const [start, end] = task.time.split("-").map((t) => parseInt(t.split(":")[0]));
      return hour >= start && hour <= end;
    } else {
      // Specific time like "06:00"
      const taskHour = parseInt(task.time.split(":")[0]);
      return taskHour === hour;
    }
  });
}

export function CalendarView() {
  const [selectedTask, setSelectedTask] = useState<ScheduledTask | null>(null);

  const today = new Date();
  const currentHour = today.getHours();
  const currentDay = today.getDay();

  return (
    <div className="glass-panel rounded-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Weekly Schedule</h2>
          <p className="text-sm text-slate-400 mt-1">
            {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="glass-panel flex items-center gap-2 rounded-full px-4 py-2 text-xs text-slate-200">
          <span className="h-2 w-2 rounded-full bg-aurora-500 animate-pulse" />
          {scheduledTasks.filter((t) => t.status === "active").length} active jobs
        </div>
      </div>

      {/* Task Legend */}
      <div className="flex flex-wrap gap-2 mb-6">
        {scheduledTasks.map((task) => (
          <button
            key={task.id}
            onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              selectedTask?.id === task.id
                ? "bg-aurora-500/30 text-aurora-200 border border-aurora-500/50"
                : task.status === "active"
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-400/30"
                : "bg-slate-700/30 text-slate-400 border border-slate-600/30"
            }`}
          >
            {task.name}
          </button>
        ))}
      </div>

      {/* Selected Task Details */}
      {selectedTask && (
        <div className="mb-6 rounded-2xl border border-aurora-500/30 bg-aurora-500/10 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-aurora-200">{selectedTask.name}</h3>
              <p className="text-sm text-slate-300 mt-1">{selectedTask.description}</p>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-xs uppercase tracking-wider ${
                selectedTask.status === "active"
                  ? "bg-aurora-500/20 text-aurora-300"
                  : "bg-slate-700/50 text-slate-400"
              }`}
            >
              {selectedTask.status}
            </span>
          </div>
          <div className="mt-3 flex gap-4 text-xs text-slate-400">
            <span>⏱ {selectedTask.schedule}</span>
            <span>🕐 {selectedTask.time} CT</span>
          </div>
        </div>
      )}

      {/* Timeline View */}
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Hour Grid */}
          <div className="grid grid-cols-[60px_1fr] gap-2">
            {HOURS.map((hour) => {
              const tasks = getTasksForHour(hour, scheduledTasks);
              const isCurrentHour = hour === currentHour;
              const isActiveHours = hour >= 7 && hour <= 22;

              return (
                <div
                  key={hour}
                  className={`contents ${hour % 3 !== 0 ? "hidden md:contents" : ""}`}
                >
                  <div
                    className={`text-right pr-2 text-xs ${
                      isCurrentHour ? "text-aurora-400 font-semibold" : "text-slate-500"
                    }`}
                  >
                    {formatHour(hour)}
                  </div>
                  <div
                    className={`rounded-lg px-3 py-2 min-h-[36px] flex flex-wrap items-center gap-2 ${
                      isCurrentHour
                        ? "bg-aurora-500/10 border border-aurora-500/30"
                        : isActiveHours
                        ? "bg-slate-800/50"
                        : "bg-slate-900/30"
                    }`}
                  >
                    {tasks.map((task) => (
                      <span
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className={`cursor-pointer rounded-md px-2 py-0.5 text-xs font-medium transition hover:scale-105 ${
                          selectedTask?.id === task.id
                            ? "bg-aurora-500/40 text-aurora-100"
                            : "bg-indigo-500/30 text-indigo-200"
                        }`}
                      >
                        {task.name}
                      </span>
                    ))}
                    {isActiveHours && tasks.length === 0 && (
                      <span className="text-xs text-slate-600">Active hours</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-slate-800/50 p-3 text-center">
          <p className="text-2xl font-semibold text-white">{scheduledTasks.length}</p>
          <p className="text-xs text-slate-400">Scheduled Jobs</p>
        </div>
        <div className="rounded-xl bg-slate-800/50 p-3 text-center">
          <p className="text-2xl font-semibold text-aurora-400">
            {scheduledTasks.filter((t) => t.schedule === "Daily").length}
          </p>
          <p className="text-xs text-slate-400">Daily Tasks</p>
        </div>
        <div className="rounded-xl bg-slate-800/50 p-3 text-center">
          <p className="text-2xl font-semibold text-comet-400">~48</p>
          <p className="text-xs text-slate-400">Runs/Day</p>
        </div>
      </div>
    </div>
  );
}
