"use client";

import type { ProofFeedItem } from "@/lib/truth/types";
import { StatusPill, freshnessTone, freshnessLabel } from "./status-pill";
import { formatAge } from "@/lib/truth/time";
import type { ExplainHandler } from "./explain-types";

const SOURCE_LABEL: Record<string, string> = {
  static: "Registry",
  http: "HTTP",
  local: "Local",
  agent: "Agent",
  deploy: "Deploy",
  browser: "Browser",
  test: "Test",
  manual: "Manual",
};

export function ProofFeed({
  items,
  onExplain,
}: {
  items: ProofFeedItem[];
  onExplain: ExplainHandler;
}) {
  return (
    <section className="glass-panel rounded-2xl p-4">
      <p className="text-[10px] uppercase tracking-[0.3em] text-aurora-400/80">Proof feed</p>
      <h2 className="mb-3 text-sm font-semibold text-white">Evidence stream ({items.length})</h2>

      {items.length === 0 ? (
        <p className="rounded-xl border border-slate-700/50 bg-slate-800/40 px-3 py-3 text-xs text-slate-400">
          No evidence has been collected yet.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-2 rounded-lg border border-slate-700/40 bg-slate-800/30 px-3 py-2"
            >
              <div className="min-w-0">
                <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
                  <span className="rounded bg-slate-700/50 px-1.5 py-0.5 text-[10px] text-slate-300">
                    {SOURCE_LABEL[item.source.type] ?? item.source.type}
                  </span>
                  <StatusPill tone={freshnessTone(item.freshness)} label={freshnessLabel(item.freshness)} dot={false} />
                  {item.ok === true && <span className="text-[10px] text-aurora-400">pass</span>}
                  {item.ok === false && <span className="text-[10px] text-red-400">fail</span>}
                  <span className="text-[10px] text-slate-500">{formatAge(item.at)}</span>
                </div>
                <p className="truncate text-xs text-slate-200" title={item.title}>
                  {item.title}
                </p>
              </div>
              <button
                onClick={() =>
                  onExplain({
                    title: item.title,
                    subtitle: `Source: ${item.source.label}`,
                    claimIds: [],
                    evidenceIds: [item.evidenceId],
                  })
                }
                className="shrink-0 rounded-md border border-slate-700/60 px-2 py-0.5 text-[11px] text-slate-300 hover:bg-slate-700/40"
              >
                Explain
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
