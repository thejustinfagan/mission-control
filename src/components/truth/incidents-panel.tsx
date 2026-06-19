"use client";

import type { Incident } from "@/lib/truth/types";
import { ExplainButton, type ExplainRecord } from "./explain-drawer";
import { StatusPill } from "./status-pill";

export function IncidentsPanel({ incidents, onExplain }: { incidents: Incident[]; onExplain: (record: ExplainRecord) => void }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-white">Incidents / Drift</h2>
      {incidents.length === 0 ? <p className="rounded-2xl border border-white/10 p-4 text-sm text-slate-300">No open incidents.</p> : incidents.map((incident) => (
        <article key={incident.id} className="rounded-2xl border border-red-300/20 bg-red-400/[0.04] p-4">
          <div className="flex items-start justify-between gap-3"><h3 className="font-bold text-white">{incident.title}</h3><StatusPill status={incident.status} /></div>
          <p className="mt-1 text-xs text-red-200">{incident.severity} • {incident.affected}</p>
          <p className="mt-2 text-sm text-slate-300">{incident.symptom}</p>
          {incident.recommendedAction && <p className="mt-2 text-sm text-slate-400">Next: {incident.recommendedAction}</p>}
          <div className="mt-3"><ExplainButton record={{ id: incident.id, title: incident.title, status: incident.status, evidenceIds: incident.evidenceIds, claimIds: incident.claimIds }} onExplain={onExplain} /></div>
        </article>
      ))}
    </section>
  );
}
