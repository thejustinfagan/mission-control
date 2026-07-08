"use client";

import { useCallback, useEffect, useState } from "react";
import type { NightlySweepReport } from "@/lib/truth/sweep-store";

interface SweepResponse {
  report: NightlySweepReport;
  configured: boolean;
  model: string | null;
  cached: boolean;
}

function SweepList({ title, items }: { title: string; items: { title: string; detail: string }[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">{title}</p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2">
            <p className="text-xs font-medium text-slate-200">{item.title}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">{item.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function NightlySweepPanel() {
  const [data, setData] = useState<SweepResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = force
        ? "/api/mission-control/sweep?force=true"
        : "/api/mission-control/sweep";
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? body.error ?? `HTTP ${res.status}`);
      }
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const report = data?.report;

  return (
    <section className="glass-panel rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.3em] text-purple-400/80">Nightly sweep</p>
          <h2 className="mt-1 text-sm font-semibold text-white">
            {loading ? "Running sweep…" : report?.headline ?? "Sweep unavailable"}
          </h2>
          {data && (
            <p className="mt-1 text-[10px] text-slate-500">
              {data.cached ? "Cached (last 20h)" : data.report.aiGenerated ? `AI · ${data.model ?? "NVIDIA"}` : "Rule-based"}
            </p>
          )}
        </div>
        <button
          onClick={() => load(true)}
          disabled={loading}
          className="shrink-0 rounded-lg border border-slate-700/60 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700/40 disabled:opacity-50"
        >
          {loading ? "…" : "Run sweep"}
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      )}

      {report && !error && (
        <>
          <p className="mt-3 text-xs leading-relaxed text-slate-300">{report.overallAssessment}</p>

          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-3 text-[11px] font-medium text-purple-400 hover:text-purple-300"
          >
            {expanded ? "Hide" : "Show"} promote / pause / kill recommendations
          </button>

          {expanded && (
            <div className="mt-3 space-y-4">
              <SweepList title="Stale / unverified" items={report.staleProjects} />
              <SweepList title="Risks" items={report.risks} />
              <SweepList title="Promote" items={report.promote} />
              <SweepList title="Pause" items={report.pause} />
              <SweepList title="Kill" items={report.kill} />
              <SweepList title="Next actions" items={report.nextActions} />
              {report.osCritique && (
                <div className="border-t border-slate-700/50 pt-3">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    OS critique
                  </p>
                  <p className="text-xs leading-relaxed text-slate-400">{report.osCritique}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
