"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { type ScheduledJob } from "@/data/schedule";

const CATEGORY_STYLES: Record<ScheduledJob["category"], { chip: string; dot: string; text: string }> = {
  briefing: {
    chip: "bg-sky-500/20 text-sky-200 border-sky-400/40",
    dot: "bg-sky-400",
    text: "text-sky-200",
  },
  polymarket: {
    chip: "bg-emerald-500/20 text-emerald-200 border-emerald-400/40",
    dot: "bg-emerald-400",
    text: "text-emerald-200",
  },
  maintenance: {
    chip: "bg-amber-500/20 text-amber-200 border-amber-400/40",
    dot: "bg-amber-400",
    text: "text-amber-200",
  },
  build: {
    chip: "bg-purple-500/20 text-purple-200 border-purple-400/40",
    dot: "bg-purple-400",
    text: "text-purple-200",
  },
  research: {
    chip: "bg-red-500/20 text-red-200 border-red-400/40",
    dot: "bg-red-400",
    text: "text-red-200",
  },
};

const STATUS_LABELS = {
  ok: "✅",
  error: "❌",
  paused: "⏸️",
};

function parseCronField(field: string, min: number, max: number): number[] {
  if (field === "*") {
    return Array.from({ length: max - min + 1 }, (_, i) => i + min);
  }

  const values = field
    .split(",")
    .flatMap((part) => {
      if (part.includes("-")) {
        const [startRaw, endRaw] = part.split("-");
        const start = Number(startRaw);
        const end = Number(endRaw);
        if (Number.isNaN(start) || Number.isNaN(end)) return [];
        const safeStart = Math.max(min, start);
        const safeEnd = Math.min(max, end);
        return Array.from({ length: safeEnd - safeStart + 1 }, (_, i) => i + safeStart);
      }
      const value = Number(part);
      if (Number.isNaN(value)) return [];
      return [value];
    })
    .map((value) => (value === 7 ? 0 : value))
    .filter((value) => value >= min && value <= max);

  return Array.from(new Set(values)).sort((a, b) => a - b);
}

function parseCron(expr: string) {
  const parts = expr.trim().split(/\s+/);
  const [minuteField, hourField, , , dayOfWeekField] = parts;

  return {
    minutes: parseCronField(minuteField ?? "*", 0, 59),
    hours: parseCronField(hourField ?? "*", 0, 23),
    daysOfWeek: dayOfWeekField && dayOfWeekField !== "*" ? parseCronField(dayOfWeekField, 0, 6) : null,
  };
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const copy = new Date(date.getTime());
  copy.setDate(copy.getDate() + days);
  return copy;
}

function getOccurrencesForDate(job: ScheduledJob, date: Date) {
  const { minutes, hours, daysOfWeek } = parseCron(job.cronExpr);
  if (daysOfWeek && !daysOfWeek.includes(date.getDay())) return [];

  const occurrences: Date[] = [];
  hours.forEach((hour) => {
    minutes.forEach((minute) => {
      occurrences.push(new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute));
    });
  });

  return occurrences.sort((a, b) => a.getTime() - b.getTime());
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function getLastNextRun(job: ScheduledJob, now: Date) {
  let last: Date | null = null;
  let next: Date | null = null;

  for (let offset = -7; offset <= 7; offset += 1) {
    const day = addDays(startOfDay(now), offset);
    const occurrences = getOccurrencesForDate(job, day);
    occurrences.forEach((occurrence) => {
      if (occurrence.getTime() <= now.getTime()) {
        if (!last || occurrence.getTime() > last.getTime()) last = occurrence;
      }
      if (occurrence.getTime() > now.getTime()) {
        if (!next || occurrence.getTime() < next.getTime()) next = occurrence;
      }
    });
  }

  return { lastRun: last, nextRun: next };
}

function getStatusIcon(job: ScheduledJob) {
  if (!job.enabled) return STATUS_LABELS.paused;
  if (job.lastStatus === "error") return STATUS_LABELS.error;
  return STATUS_LABELS.ok;
}

export default function CalendarPage() {
  const [scheduledJobs, setScheduledJobs] = useState<ScheduledJob[]>([]);
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const [selected, setSelected] = useState<{ job: ScheduledJob; time: Date } | null>(null);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    const loadSchedule = async () => {
      try {
        const response = await fetch("/api/schedule", { signal: controller.signal });
        if (!response.ok) throw new Error("Failed to fetch schedule");
        const data = (await response.json()) as ScheduledJob[];
        if (isActive) setScheduledJobs(Array.isArray(data) ? data : []);
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        console.error("Failed to load schedule:", error);
      }
    };

    loadSchedule();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  const now = useMemo(() => new Date(), []);
  const today = useMemo(() => startOfDay(now), [now]);

  const jobRunInfo = useMemo<Array<{ job: ScheduledJob; lastRun: Date | null; nextRun: Date | null }>>(
    () =>
      scheduledJobs.map((job) => ({
        job,
        ...getLastNextRun(job, now),
      })),
    [now, scheduledJobs],
  );

  const runInfoMap = useMemo(() => {
    return new Map(jobRunInfo.map((entry) => [entry.job.id, entry]));
  }, [jobRunInfo]);

  const occurrencesToday = useMemo(() => {
    return scheduledJobs
      .flatMap((job) => getOccurrencesForDate(job, today).map((time) => ({ job, time })))
      .sort((a, b) => a.time.getTime() - b.time.getTime());
  }, [scheduledJobs, today]);

  const occurrencesByHour = useMemo(() => {
    const map = new Map<number, { job: ScheduledJob; time: Date }[]>();
    occurrencesToday.forEach((occurrence) => {
      const hour = occurrence.time.getHours();
      const items = map.get(hour) ?? [];
      items.push(occurrence);
      map.set(hour, items);
    });
    return map;
  }, [occurrencesToday]);

  const summary = useMemo(() => {
    const total = scheduledJobs.length;
    const enabled = scheduledJobs.filter((job) => job.enabled).length;
    const disabled = total - enabled;

    const errorsLast24h = jobRunInfo.filter((entry) => {
      if (entry.job.lastStatus !== "error" || !entry.lastRun) return false;
      return now.getTime() - entry.lastRun.getTime() <= 24 * 60 * 60 * 1000;
    }).length;

    const nextUpcoming = jobRunInfo
      .filter((entry) => entry.nextRun)
      .sort((a, b) => (a.nextRun?.getTime() ?? 0) - (b.nextRun?.getTime() ?? 0))[0];

    return { total, enabled, disabled, errorsLast24h, nextUpcoming };
  }, [jobRunInfo, now, scheduledJobs]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(today, i));
  }, [today]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-midnight-900">
      <div className="absolute inset-0 bg-grid-fade" />
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-aurora-400/80">Mission Control</p>
              <h1 className="mt-2 text-2xl font-semibold text-white">Calendar</h1>
              <p className="mt-1 text-xs text-slate-400">
                Full timeline of scheduled automation for Barry and the team.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-midnight-800/60 px-3 py-1 text-xs text-slate-300 transition hover:border-aurora-500/40 hover:text-aurora-200"
              >
                ← Command Center
              </Link>
              <div className="glass-panel rounded-full px-3 py-1.5 text-[10px] text-slate-200">
                {formatDayLabel(today)}
              </div>
            </div>
          </div>
          <Navigation />
        </header>

        <section className="grid gap-3 md:grid-cols-4">
          <div className="glass-panel rounded-2xl px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Total Jobs</p>
            <p className="mt-2 text-2xl font-semibold text-white">{summary.total}</p>
          </div>
          <div className="glass-panel rounded-2xl px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Enabled</p>
            <p className="mt-2 text-2xl font-semibold text-aurora-300">{summary.enabled}</p>
          </div>
          <div className="glass-panel rounded-2xl px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Disabled</p>
            <p className="mt-2 text-2xl font-semibold text-slate-200">{summary.disabled}</p>
          </div>
          <div className="glass-panel rounded-2xl px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Errors 24h</p>
            <p className="mt-2 text-2xl font-semibold text-red-300">{summary.errorsLast24h}</p>
          </div>
        </section>

        <section className="glass-panel rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Schedule Timeline</h2>
              <p className="text-xs text-slate-400">
                {viewMode === "day" ? "Daily timeline" : "Weekly overview"} with category color bands.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-slate-700/60 bg-midnight-800/60 p-1 text-xs">
              {(["day", "week"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`rounded-full px-3 py-1 transition ${
                    viewMode === mode
                      ? "bg-aurora-500/20 text-aurora-200"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {mode === "day" ? "Day" : "Week"}
                </button>
              ))}
            </div>
          </div>

          {selected ? (
            <div className="mt-5 rounded-2xl border border-aurora-500/30 bg-aurora-500/10 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getStatusIcon(selected.job)}</span>
                    <h3 className="text-base font-semibold text-aurora-100">{selected.job.name}</h3>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{selected.job.description}</p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] ${
                    CATEGORY_STYLES[selected.job.category].chip
                  }`}
                >
                  {selected.job.category}
                </span>
              </div>
              <div className="mt-4 grid gap-3 text-xs text-slate-300 md:grid-cols-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Scheduled</p>
                  <p className="mt-1 text-sm text-slate-200">{selected.job.schedule}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Last Run</p>
                  <p className="mt-1 text-sm text-slate-200">
                    {runInfoMap.get(selected.job.id)?.lastRun
                      ? formatTime(runInfoMap.get(selected.job.id)!.lastRun!)
                      : "Not yet"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Next Run</p>
                  <p className="mt-1 text-sm text-slate-200">
                    {runInfoMap.get(selected.job.id)?.nextRun
                      ? formatTime(runInfoMap.get(selected.job.id)!.nextRun!)
                      : "Queued"}
                  </p>
                </div>
              </div>
              {selected.job.lastStatus === "error" && selected.job.lastError ? (
                <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  Last error: {selected.job.lastError}
                </div>
              ) : null}
            </div>
          ) : null}

          {viewMode === "day" ? (
            <div className="mt-6 grid gap-2">
              {Array.from({ length: 24 }, (_, hour) => {
                const items = occurrencesByHour.get(hour) ?? [];
                const isCurrentHour = hour === now.getHours();

                return (
                  <div key={hour} className="grid grid-cols-[70px_1fr] gap-3">
                    <div className={`text-right text-xs ${isCurrentHour ? "text-aurora-300" : "text-slate-500"}`}>
                      {new Date(0, 0, 0, hour).toLocaleTimeString("en-US", { hour: "numeric" })}
                    </div>
                    <div
                      className={`min-h-[44px] rounded-2xl border px-3 py-2 transition ${
                        isCurrentHour
                          ? "border-aurora-500/40 bg-aurora-500/10"
                          : "border-slate-800/80 bg-slate-900/40"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        {items.length === 0 ? (
                          <span className="text-xs text-slate-600">No scheduled jobs</span>
                        ) : (
                          items.map((occurrence) => {
                            const style = CATEGORY_STYLES[occurrence.job.category];
                            const isError = occurrence.job.lastStatus === "error";
                            return (
                              <button
                                key={`${occurrence.job.id}-${occurrence.time.toISOString()}`}
                                onClick={() => setSelected(occurrence)}
                                className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition hover:scale-[1.01] ${
                                  style.chip
                                } ${isError ? "border-red-400/60" : ""}`}
                              >
                                <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                                <span className="font-medium text-slate-100">{occurrence.job.name}</span>
                                <span className="text-[10px] text-slate-300">{formatTime(occurrence.time)}</span>
                                <span>{getStatusIcon(occurrence.job)}</span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 grid gap-3 md:grid-cols-7">
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-3"
                >
                  <div className="text-xs font-semibold text-slate-200">{formatDayLabel(day)}</div>
                  <div className="mt-3 flex flex-col gap-2">
                    {scheduledJobs
                      .filter((job) => getOccurrencesForDate(job, day).length > 0)
                      .map((job) => {
                        const style = CATEGORY_STYLES[job.category];
                        return (
                          <div
                            key={`${job.id}-${day.toISOString()}`}
                            className={`rounded-xl border px-3 py-2 text-xs ${style.chip}`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                              <span className="font-medium text-slate-100">{job.name}</span>
                            </div>
                            <div className="mt-1 text-[10px] text-slate-300">{job.schedule}</div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {summary.nextUpcoming?.nextRun ? (
            <div className="mt-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 px-4 py-3 text-xs text-slate-300">
              Next upcoming: <span className="font-semibold text-slate-100">{summary.nextUpcoming.job.name}</span> at {formatTime(summary.nextUpcoming.nextRun)}
            </div>
          ) : null}
        </section>

        <section className="glass-panel rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Daily Schedule</h2>
              <p className="mt-1 text-xs text-slate-400">Chronological list of today&apos;s runs.</p>
            </div>
            <div className="text-[10px] text-slate-500">{occurrencesToday.length} runs scheduled</div>
          </div>

          <div className="mt-4 max-h-[520px] space-y-2 overflow-y-auto pr-2">
            {occurrencesToday.map((occurrence) => {
              const style = CATEGORY_STYLES[occurrence.job.category];
              const runInfo = runInfoMap.get(occurrence.job.id);
              return (
                <details
                  key={`${occurrence.job.id}-${occurrence.time.toISOString()}-list`}
                  className="group rounded-2xl border border-slate-800/80 bg-slate-900/40 px-4 py-3"
                >
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-100">{formatTime(occurrence.time)}</span>
                      <span className="text-sm text-slate-200">{occurrence.job.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] ${style.chip}`}>
                        {occurrence.job.category}
                      </span>
                      <span className="text-sm">{getStatusIcon(occurrence.job)}</span>
                    </div>
                  </summary>
                  <div className="mt-3 grid gap-2 text-xs text-slate-300 md:grid-cols-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Schedule</p>
                      <p className="mt-1 text-slate-200">{occurrence.job.schedule}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Last Run</p>
                      <p className="mt-1 text-slate-200">
                        {runInfo?.lastRun ? formatTime(runInfo.lastRun) : "Not yet"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Next Run</p>
                      <p className="mt-1 text-slate-200">
                        {runInfo?.nextRun ? formatTime(runInfo.nextRun) : "Queued"}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-slate-400">{occurrence.job.description}</p>
                  {occurrence.job.lastStatus === "error" && occurrence.job.lastError ? (
                    <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                      Last error: {occurrence.job.lastError}
                    </div>
                  ) : null}
                </details>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
