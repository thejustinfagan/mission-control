"use client";

import type { ProofFeedItem } from "@/lib/truth/types";
import { StatusPill } from "./status-pill";

export function ProofFeed({ items }: { items: ProofFeedItem[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-white">Proof Feed</h2>
      {items.length === 0 ? <p className="rounded-2xl border border-white/10 p-4 text-sm text-slate-300">No fresh proof yet.</p> : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-cyan-300/10 bg-cyan-400/[0.03] p-3">
              <div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold text-cyan-100">{item.label}</p><StatusPill status={item.status} /></div>
              <p className="mt-1 text-xs text-slate-400">{item.source} • {item.capturedAt} • {item.confidence} • {item.subjectLabel}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
