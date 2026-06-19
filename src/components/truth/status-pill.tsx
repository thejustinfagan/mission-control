import type { TruthStatus } from "@/lib/truth/types";

const STATUS_CLASS: Record<string, string> = {
  verified: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
  reported: "border-sky-400/40 bg-sky-500/15 text-sky-200",
  unverified: "border-amber-400/40 bg-amber-500/15 text-amber-200",
  stale: "border-purple-400/40 bg-purple-500/15 text-purple-200",
  unknown: "border-slate-400/40 bg-slate-500/15 text-slate-200",
  failed: "border-red-400/40 bg-red-500/15 text-red-200",
  working: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
  blocked: "border-red-400/40 bg-red-500/15 text-red-200",
  idle: "border-slate-400/40 bg-slate-500/15 text-slate-200",
  open: "border-red-400/40 bg-red-500/15 text-red-200",
  monitoring: "border-amber-400/40 bg-amber-500/15 text-amber-200",
  needs_justin: "border-amber-400/40 bg-amber-500/15 text-amber-100",
};

export function StatusPill({ status }: { status: TruthStatus | string }) {
  return <span className={`rounded-full border px-2 py-1 text-xs font-semibold uppercase tracking-wide ${STATUS_CLASS[status] ?? STATUS_CLASS.unknown}`}>{status.replaceAll("_", " ")}</span>;
}
