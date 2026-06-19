"use client";

import type { ProofFeedItem, TruthStatus } from "@/lib/truth/types";
import { type ExplainRecord } from "./explain-drawer";
import { StatusPill } from "./status-pill";

type ProofFilter = "all" | TruthStatus;

export function ProofFeed({
  items,
  filter,
  filters,
  onFilterChange,
  onExplain,
}: {
  items: ProofFeedItem[];
  filter: ProofFilter;
  filters: Array<{ id: ProofFilter; label: string }>;
  onFilterChange: (filter: ProofFilter) => void;
  onExplain: (record: ExplainRecord) => void;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-white">Proof Feed</h2>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">{items.length} rows</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onFilterChange(option.id)}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition ${
              filter === option.id
                ? "border-cyan-300 bg-cyan-300 text-slate-950"
                : "border-white/10 bg-white/[0.03] text-slate-200 hover:border-cyan-300/60 hover:text-cyan-100"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {items.length === 0 ? <p className="rounded-2xl border border-white/10 p-4 text-sm text-slate-300">No proof matches this filter.</p> : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => onExplain({ id: item.id, title: item.label, status: item.status, confidence: item.confidence, evidenceIds: [item.id], claimIds: [] })}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") onExplain({ id: item.id, title: item.label, status: item.status, confidence: item.confidence, evidenceIds: [item.id], claimIds: [] });
              }}
              className="block w-full cursor-pointer rounded-2xl border border-cyan-300/10 bg-cyan-400/[0.03] p-3 text-left transition hover:border-cyan-300/50 hover:bg-cyan-400/[0.07] focus:outline-none focus:ring-2 focus:ring-cyan-300/50"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-cyan-100">{item.label}</p>
                <StatusPill status={item.status} />
              </div>
              <p className="mt-1 text-xs text-slate-400">{item.source} • {item.capturedAt} • {item.confidence} • {item.subjectLabel}</p>
              {item.artifactUrl && (
                <a
                  href={item.artifactUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="mt-2 inline-block text-xs text-cyan-200 underline decoration-cyan-300/40 underline-offset-2"
                >
                  Open artifact →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
