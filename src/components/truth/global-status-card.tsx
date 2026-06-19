"use client";

import type { FreshnessReport, GlobalStatus, SnapshotSummary } from "@/lib/truth/types";
import { StatusPill, globalTone } from "./status-pill";
import type { ExplainHandler } from "./explain-types";

export function GlobalStatusCard({
  globalStatus,
  summary,
  freshness,
  generatedAt,
  onExplain,
}: {
  globalStatus: GlobalStatus;
  summary: SnapshotSummary;
  freshness: FreshnessReport;
  generatedAt: string;
  onExplain: ExplainHandler;
}) {
  const tone = globalTone(globalStatus.level);

  const stats: { label: string; value: number; definition: string }[] = [
    { label: "Verified healthy", value: summary.verifiedHealthy, definition: summary.definitions.verifiedHealthy },
    { label: "Unknown", value: summary.unknown, definition: summary.definitions.unknown },
    { label: "Degraded", value: summary.degraded, definition: summary.definitions.degraded },
    { label: "Open risks", value: summary.openIncidents, definition: summary.definitions.openIncidents },
  ];

  return (
    <section className="glass-panel rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.3em] text-aurora-400/80">Global status</p>
          <div className="mt-1.5 flex items-center gap-2">
            <StatusPill tone={tone} label={globalStatus.label} />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-300">{globalStatus.rationale}</p>
        </div>
        <button
          onClick={() =>
            onExplain({
              title: `Global status: ${globalStatus.label}`,
              subtitle: globalStatus.rationale,
              claimIds: globalStatus.claimIds,
              evidenceIds: globalStatus.evidenceIds,
            })
          }
          className="shrink-0 rounded-lg border border-slate-700/60 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700/40"
        >
          Explain
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            title={s.definition}
            className="rounded-xl border border-slate-700/50 bg-slate-800/40 px-3 py-2"
          >
            <div className="text-xl font-bold text-white">{s.value}</div>
            <div className="text-[10px] leading-tight text-slate-400">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
        <span>Generated {new Date(generatedAt).toISOString().replace("T", " ").replace(".000Z", "Z")}</span>
        <span>·</span>
        <span>{freshness.freshEvidence} fresh / {freshness.staleEvidence} stale evidence</span>
        <span>·</span>
        <span>{freshness.unknownClaims} unknown claim(s)</span>
      </div>
    </section>
  );
}
