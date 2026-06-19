"use client";

import type { Incident, IncidentSeverity } from "@/lib/truth/types";
import { StatusPill, type Tone } from "./status-pill";
import type { ExplainHandler } from "./explain-types";

const SEVERITY_TONE: Record<IncidentSeverity, Tone> = {
  critical: "red",
  high: "amber",
  medium: "amber",
  low: "slate",
};

export function IncidentsPanel({
  incidents,
  onExplain,
}: {
  incidents: Incident[];
  onExplain: ExplainHandler;
}) {
  const open = incidents.filter((i) => i.state === "open" || i.state === "investigating");

  return (
    <section className="glass-panel rounded-2xl p-4">
      <p className="text-[10px] uppercase tracking-[0.3em] text-aurora-400/80">Incidents &amp; risks</p>
      <h2 className="mb-3 text-sm font-semibold text-white">Open risks ({open.length})</h2>

      {open.length === 0 ? (
        <p className="rounded-xl border border-slate-700/50 bg-slate-800/40 px-3 py-3 text-xs text-slate-400">
          No open incidents or risks on record. (Absence of recorded risk is not proof of health — see project states.)
        </p>
      ) : (
        <ul className="space-y-2">
          {[...open]
            .sort(
              (a, b) =>
                severityRank(a.severity) - severityRank(b.severity)
            )
            .map((inc) => (
              <li
                key={inc.id}
                className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <StatusPill tone={SEVERITY_TONE[inc.severity]} label={inc.severity} />
                      <span className="text-[10px] uppercase text-slate-500">{inc.state}</span>
                    </div>
                    <p className="text-sm text-white">{inc.title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{inc.detail}</p>
                  </div>
                  <button
                    onClick={() =>
                      onExplain({
                        title: inc.title,
                        subtitle: inc.detail,
                        claimIds: inc.claimIds,
                        evidenceIds: inc.evidenceIds,
                      })
                    }
                    className="shrink-0 rounded-lg border border-slate-700/60 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700/40"
                  >
                    Explain
                  </button>
                </div>
              </li>
            ))}
        </ul>
      )}
    </section>
  );
}

function severityRank(s: IncidentSeverity): number {
  return { critical: 0, high: 1, medium: 2, low: 3 }[s];
}
