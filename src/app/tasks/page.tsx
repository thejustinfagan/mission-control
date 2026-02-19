import Link from "next/link";
import { TaskBoard } from "@/components/task-board";

export default function TasksPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-midnight-900">
      <div className="absolute inset-0 bg-grid-fade"></div>
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-midnight-800/60 px-3 py-1 text-xs text-slate-300 transition hover:border-aurora-500/40 hover:text-aurora-200"
          >
            ← Back to Command Center
          </Link>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-aurora-400/80">Mission Control</p>
              <h1 className="mt-1 text-2xl font-semibold text-white">Task Board</h1>
              <p className="mt-1 text-xs text-slate-400">
                Live view of active workstreams across Justin and Barry.
              </p>
            </div>
            <div className="glass-panel rounded-full px-3 py-1.5 text-[10px] text-slate-200">
              Updated in real time
            </div>
          </div>
        </header>

        <TaskBoard />
      </div>
    </main>
  );
}
