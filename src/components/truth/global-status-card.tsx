"use client";

import type { MissionControlSnapshot } from "@/lib/truth/types";
import { ExplainButton, type ExplainRecord } from "./explain-drawer";
import { StatusPill } from "./status-pill";

export function GlobalStatusCard({ snapshot, onExplain }: { snapshot: MissionControlSnapshot; onExplain: (record: ExplainRecord) => void }) {
  return (
    <section className="rounded-3xl border border-amber-300/20 bg-gradient-to-br from-slate-900 to-slate-950 p-5 shadow-xl shadow-black/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Global command status</p>
          <h1 className="mt-3 text-4xl font-black text-white">{snapshot.headline}</h1>
          <p className="mt-3 text-sm text-slate-300">
            {snapshot.summary.justinActions} action • {snapshot.summary.openIncidents} incidents • {snapshot.summary.agentsUnknown} agents unknown • {snapshot.freshness.label}
          </p>
        </div>
        <StatusPill status={snapshot.globalStatus} />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
        <Metric label="Justin actions" value={snapshot.summary.justinActions} />
        <Metric label="Open incidents" value={snapshot.summary.openIncidents} />
        <Metric label="Working agents" value={snapshot.summary.agentsWorking} />
        <Metric label="Unknown agents" value={snapshot.summary.agentsUnknown} />
        <Metric label="Verified proofs" value={snapshot.summary.verifiedProofs} />
      </div>
      <div className="mt-5"><ExplainButton record={{ id: "global", title: "Global command status", status: snapshot.globalStatus, confidence: snapshot.freshness.worstStatus, evidenceIds: snapshot.evidence.slice(0, 6).map((row) => row.id), claimIds: snapshot.claims.slice(0, 6).map((claim) => claim.id) }} onExplain={onExplain} /></div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"><div className="text-2xl font-bold text-white">{value}</div><div className="text-xs text-slate-400">{label}</div></div>;
}
