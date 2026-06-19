"use client";

import type { JustinAction } from "@/lib/truth/types";
import { ExplainButton, type ExplainRecord } from "./explain-drawer";
import { StatusPill } from "./status-pill";

export function JustinQueue({ actions, onExplain }: { actions: JustinAction[]; onExplain: (record: ExplainRecord) => void }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-white">Justin Queue</h2>
      {actions.length === 0 ? <p className="rounded-2xl border border-white/10 p-4 text-sm text-slate-300">No Justin actions. Agents can continue.</p> : actions.map((action) => (
        <article key={action.id} className="rounded-2xl border border-amber-300/20 bg-amber-400/[0.04] p-4">
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-wide text-amber-200">{action.type}</p><h3 className="mt-1 font-bold text-white">{action.title}</h3></div><StatusPill status={action.urgency} /></div>
          <p className="mt-2 text-sm text-slate-300">{action.whyJustin}</p>
          {action.recommendation && <p className="mt-2 text-sm text-amber-100">Recommendation: {action.recommendation}</p>}
          <div className="mt-3"><ExplainButton record={{ id: action.id, title: action.title, status: action.urgency, evidenceIds: action.evidenceIds, claimIds: action.claimIds }} onExplain={onExplain} /></div>
        </article>
      ))}
    </section>
  );
}
