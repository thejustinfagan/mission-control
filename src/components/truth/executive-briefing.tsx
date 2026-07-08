"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExecutiveBriefing } from "@/lib/ai/briefing-prompt";

interface BriefingResponse {
  briefing: ExecutiveBriefing;
  configured: boolean;
  model: string | null;
}

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-400",
  medium: "bg-amber-400",
  low: "bg-slate-500",
};

export function ExecutiveBriefingPanel() {
  const [data, setData] = useState<BriefingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mission-control/briefing", { cache: "no-store" });
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

  const briefing = data?.briefing;

  return (
    <section className="glass-panel rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.3em] text-aurora-400/80">
            North star briefing
          </p>
          <h2 className="mt-1 text-sm font-semibold text-white">
            {loading ? "Generating…" : briefing?.headline ?? "Briefing unavailable"}
          </h2>
          {data && (
            <p className="mt-1 text-[10px] text-slate-500">
              {data.briefing.aiGenerated
                ? `AI · ${data.model ?? "NVIDIA NIM"}`
                : data.configured
                  ? "Rule-based fallback (AI call failed)"
                  : "Rule-based · set NVIDIA_API_KEY for AI"}
            </p>
          )}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="shrink-0 rounded-lg border border-slate-700/60 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700/40 disabled:opacity-50"
        >
          {loading ? "…" : "Refresh"}
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      )}

      {briefing && !error && (
        <>
          <p className="mt-3 text-xs leading-relaxed text-slate-300">{briefing.overallAssessment}</p>

          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-3 text-[11px] font-medium text-aurora-400 hover:text-aurora-300"
          >
            {expanded ? "Hide" : "Show"} 9 north-star answers ({briefing.sections.length})
          </button>

          {expanded && (
            <div className="mt-3 space-y-2">
              {briefing.sections.map((section) => (
                <div
                  key={section.id}
                  className="rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[section.priority] ?? PRIORITY_DOT.medium}`}
                      aria-hidden
                    />
                    <span className="text-[11px] font-semibold text-slate-200">{section.question}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-400">{section.answer}</p>
                </div>
              ))}
            </div>
          )}

          {briefing.recommendations.length > 0 && (
            <div className="mt-3 border-t border-slate-700/50 pt-3">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Recommendations
              </p>
              <ul className="space-y-1">
                {briefing.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="text-aurora-500" aria-hidden>
                      →
                    </span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
