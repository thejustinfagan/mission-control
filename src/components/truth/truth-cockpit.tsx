"use client";

import { useMemo, useState } from "react";
import type { MissionControlSnapshot, TruthStatus } from "@/lib/truth/types";
import { AgentLanes } from "./agent-lanes";
import { ExplainDrawer, type ExplainRecord } from "./explain-drawer";
import { GlobalStatusCard } from "./global-status-card";
import { IncidentsPanel } from "./incidents-panel";
import { JustinQueue } from "./justin-queue";
import { ProofFeed } from "./proof-feed";
import { ProjectStateGrid } from "./project-state-grid";

type Focus = "all" | "needs-justin" | "incidents" | "agents" | "projects" | "proof";
type ProofFilter = "all" | TruthStatus;

const focusTabs: Array<{ id: Focus; label: string }> = [
  { id: "all", label: "All" },
  { id: "needs-justin", label: "Justin" },
  { id: "incidents", label: "Drift" },
  { id: "agents", label: "Agents" },
  { id: "projects", label: "Projects" },
  { id: "proof", label: "Proof" },
];

const proofFilters: Array<{ id: ProofFilter; label: string }> = [
  { id: "all", label: "All proof" },
  { id: "verified", label: "Verified" },
  { id: "unknown", label: "Unknown" },
  { id: "stale", label: "Stale" },
  { id: "failed", label: "Failed" },
  { id: "unverified", label: "Unverified" },
];

export function TruthCockpit({ snapshot }: { snapshot: MissionControlSnapshot }) {
  const [explain, setExplain] = useState<ExplainRecord | null>(null);
  const [focus, setFocus] = useState<Focus>("all");
  const [proofFilter, setProofFilter] = useState<ProofFilter>("all");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const filteredProof = useMemo(() => {
    if (proofFilter === "all") return snapshot.proofFeed;
    return snapshot.proofFeed.filter((item) => item.status === proofFilter);
  }, [proofFilter, snapshot.proofFeed]);

  const showJustin = focus === "all" || focus === "needs-justin";
  const showIncidents = focus === "all" || focus === "incidents";
  const showAgents = focus === "all" || focus === "agents";
  const showProjects = focus === "all" || focus === "projects";
  const showProof = focus === "all" || focus === "proof";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#164e63_0,transparent_35%),#020617] px-4 py-5 text-slate-100 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="space-y-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-cyan-300">Mission Control</p>
            <p className="text-sm text-slate-300">Truth Machine • {snapshot.freshness.label} • source: /api/mission-control</p>
          </div>
          <nav aria-label="Mission Control focus" className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
            {focusTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFocus(tab.id)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  focus === tab.id
                    ? "border-cyan-300 bg-cyan-300 text-slate-950"
                    : "border-white/10 bg-white/[0.03] text-slate-200 hover:border-cyan-300/60 hover:text-cyan-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </header>

        <GlobalStatusCard snapshot={snapshot} onExplain={setExplain} onFocus={setFocus} />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="space-y-5">
            {showJustin && <JustinQueue actions={snapshot.justinQueue} onExplain={setExplain} />}
            {showIncidents && <IncidentsPanel incidents={snapshot.incidents} onExplain={setExplain} />}
          </div>
          <div className="space-y-5">
            {showAgents && (
              <AgentLanes
                agents={snapshot.agents}
                activeAgentId={selectedAgentId}
                onSelectAgent={setSelectedAgentId}
                onExplain={setExplain}
              />
            )}
            {showProof && (
              <ProofFeed
                items={filteredProof}
                filter={proofFilter}
                filters={proofFilters}
                onFilterChange={setProofFilter}
                onExplain={setExplain}
              />
            )}
          </div>
        </div>

        {showProjects && (
          <ProjectStateGrid
            projects={snapshot.projects}
            activeProjectId={selectedProjectId}
            onSelectProject={setSelectedProjectId}
            onExplain={setExplain}
          />
        )}
      </div>
      <ExplainDrawer record={explain} claims={snapshot.claims} evidence={snapshot.evidence} onClose={() => setExplain(null)} />
    </main>
  );
}
