"use client";

import { useState } from "react";
import type { JustinAction } from "@/lib/truth/types";
import { ExplainButton, type ExplainRecord } from "./explain-drawer";
import { StatusPill } from "./status-pill";

export function JustinQueue({ actions, onExplain }: { actions: JustinAction[]; onExplain: (record: ExplainRecord) => void }) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-white">Justin Queue</h2>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">tap an action</span>
      </div>
      {selectedOption && (
        <div className="rounded-2xl border border-amber-200/20 bg-amber-300/[0.08] p-3 text-sm text-amber-100">
          Selected: {selectedOption}
        </div>
      )}
      {actions.length === 0 ? <p className="rounded-2xl border border-white/10 p-4 text-sm text-slate-300">No Justin actions. Agents can continue.</p> : actions.map((action) => {
        const record = { id: action.id, title: action.title, status: action.urgency, evidenceIds: action.evidenceIds, claimIds: action.claimIds };
        return (
          <article key={action.id} className="rounded-2xl border border-amber-300/20 bg-amber-400/[0.04] p-4 transition hover:border-amber-200/50 hover:bg-amber-400/[0.07]">
            <button type="button" onClick={() => onExplain(record)} className="block w-full text-left">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-amber-200">{action.type}</p>
                  <h3 className="mt-1 font-bold text-white">{action.title}</h3>
                </div>
                <StatusPill status={action.urgency} />
              </div>
              <p className="mt-2 text-sm text-slate-300">{action.whyJustin}</p>
              {action.recommendation && <p className="mt-2 text-sm text-amber-100">Recommendation: {action.recommendation}</p>}
              {action.risk && <p className="mt-2 text-xs text-slate-400">Risk: {action.risk}</p>}
            </button>
            {action.options.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {action.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSelectedOption(`${action.title}: ${option}`)}
                    className="rounded-full border border-amber-200/20 px-2 py-1 text-xs text-amber-100 transition hover:border-amber-100 hover:bg-amber-200/10"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <ExplainButton record={record} onExplain={onExplain} />
              <button type="button" onClick={() => onExplain(record)} className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/60 hover:text-cyan-100">Evidence</button>
            </div>
          </article>
        );
      })}
    </section>
  );
}
