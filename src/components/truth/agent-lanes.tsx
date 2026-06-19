"use client";

import type { Agent } from "@/lib/truth/types";
import { StatusPill, agentTone } from "./status-pill";
import type { ExplainHandler } from "./explain-types";

function lastHeartbeatLabel(agent: Agent): string {
  if (!agent.lastHeartbeatAt) return "No heartbeat on record";
  return `Last heartbeat ${new Date(agent.lastHeartbeatAt).toISOString().replace("T", " ").replace(".000Z", "Z")}`;
}

export function AgentLanes({
  agents,
  onExplain,
}: {
  agents: Agent[];
  onExplain: ExplainHandler;
}) {
  return (
    <section className="glass-panel rounded-2xl p-4">
      <p className="text-[10px] uppercase tracking-[0.3em] text-aurora-400/80">Agent lanes</p>
      <h2 className="mb-3 text-sm font-semibold text-white">Agents ({agents.length})</h2>

      {agents.length === 0 ? (
        <p className="rounded-xl border border-slate-700/50 bg-slate-800/40 px-3 py-3 text-xs text-slate-400">
          No agents registered.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{agent.name}</p>
                  <p className="text-[11px] text-slate-400">{agent.role}</p>
                </div>
                <StatusPill tone={agentTone(agent.status)} label={agent.status} />
              </div>
              <p className="mt-2 text-[11px] text-slate-400">{agent.statusLabel}</p>
              <p className="text-[10px] text-slate-600">{lastHeartbeatLabel(agent)}</p>
              <button
                onClick={() =>
                  onExplain({
                    title: agent.name,
                    subtitle: agent.statusLabel,
                    claimIds: agent.claimIds,
                    evidenceIds: agent.evidenceIds,
                  })
                }
                className="mt-2 rounded-md border border-aurora-500/40 px-2 py-0.5 text-[11px] font-medium text-aurora-300 hover:bg-aurora-500/10"
              >
                Explain
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
