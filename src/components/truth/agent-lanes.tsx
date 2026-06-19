"use client";

import type { AgentCard } from "@/lib/truth/types";
import { ExplainButton, type ExplainRecord } from "./explain-drawer";
import { StatusPill } from "./status-pill";

export function AgentLanes({
  agents,
  activeAgentId,
  onSelectAgent,
  onExplain,
}: {
  agents: AgentCard[];
  activeAgentId?: string | null;
  onSelectAgent?: (agent: AgentCard) => void;
  onExplain: (record: ExplainRecord) => void;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-white">Agent Lanes</h2>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">tap a lane</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent) => {
          const selected = activeAgentId === agent.id;
          const record = {
            id: agent.id,
            title: `${agent.name} agent lane`,
            status: agent.status,
            confidence: agent.confidence,
            evidenceIds: agent.evidenceIds,
            claimIds: agent.claimIds,
          };

          return (
            <article key={agent.id} className={`rounded-2xl border p-4 transition ${selected ? "border-cyan-300/70 bg-cyan-400/[0.08]" : "border-white/10 bg-white/[0.03] hover:border-cyan-300/40 hover:bg-white/[0.05]"}`}>
              <button
                type="button"
                onClick={() => onSelectAgent?.(agent)}
                className="block w-full text-left"
                aria-pressed={selected}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-white">{agent.name}</h3>
                    <p className="mt-1 text-xs text-slate-400">{agent.role}</p>
                  </div>
                  <StatusPill status={agent.status} />
                </div>
                <p className="mt-3 text-sm text-slate-300">{agent.lastProof ?? "No proof yet"}</p>
                {agent.currentTask && <p className="mt-2 text-xs text-cyan-200">Task: {agent.currentTask}</p>}
                {agent.lastHeartbeatAt && <p className="mt-2 text-xs text-slate-500">Heartbeat: {agent.lastHeartbeatAt}</p>}
                {agent.blocker && <p className="mt-2 text-xs text-amber-200">{agent.blocker}</p>}
              </button>
              <div className="mt-3 flex flex-wrap gap-2">
                <ExplainButton record={record} onExplain={onExplain} />
                <button
                  type="button"
                  onClick={() => onExplain(record)}
                  className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/60 hover:text-cyan-100"
                >
                  Evidence
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
