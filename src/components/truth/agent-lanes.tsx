"use client";

import type { AgentCard } from "@/lib/truth/types";
import { ExplainButton, type ExplainRecord } from "./explain-drawer";
import { StatusPill } from "./status-pill";

export function AgentLanes({ agents, onExplain }: { agents: AgentCard[]; onExplain: (record: ExplainRecord) => void }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-white">Agent Lanes</h2>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent) => (
          <article key={agent.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-white">{agent.name}</h3><p className="mt-1 text-xs text-slate-400">{agent.role}</p></div><StatusPill status={agent.status} /></div>
            <p className="mt-3 text-sm text-slate-300">{agent.lastProof ?? "No proof yet"}</p>
            {agent.blocker && <p className="mt-2 text-xs text-amber-200">{agent.blocker}</p>}
            <div className="mt-3"><ExplainButton record={{ id: agent.id, title: `${agent.name} agent lane`, status: agent.status, confidence: agent.confidence, evidenceIds: agent.evidenceIds, claimIds: agent.claimIds }} onExplain={onExplain} /></div>
          </article>
        ))}
      </div>
    </section>
  );
}
