"use client";

import { useCallback, useMemo, useState } from "react";
import type { MissionControlSnapshot, TruthStatus } from "@/lib/truth/types";
import { AgentLanes } from "./agent-lanes";
import { ExplainDrawer, type ExplainRecord } from "./explain-drawer";
import { GlobalStatusCard } from "./global-status-card";
import { IncidentsPanel } from "./incidents-panel";
import { JustinQueue } from "./justin-queue";
import { ProofFeed } from "./proof-feed";
import { ProjectStateGrid } from "./project-state-grid";
import { SelectionPanel, type ActiveSelection } from "./selection-panel";

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
  const [query, setQuery] = useState("");
  const [needsAttentionOnly, setNeedsAttentionOnly] = useState(false);
  const [selection, setSelection] = useState<ActiveSelection>(null);

  const normalizedQuery = query.trim().toLowerCase();
  const matches = useCallback((value: unknown) => !normalizedQuery || JSON.stringify(value).toLowerCase().includes(normalizedQuery), [normalizedQuery]);

  const filteredActions = useMemo(() => snapshot.justinQueue.filter(matches), [matches, snapshot.justinQueue]);
  const filteredIncidents = useMemo(() => snapshot.incidents.filter(matches), [matches, snapshot.incidents]);
  const filteredAgents = useMemo(() => snapshot.agents.filter(matches), [matches, snapshot.agents]);
  const filteredProjects = useMemo(() => {
    return snapshot.projects
      .filter((project) => matches(project))
      .filter((project) => !needsAttentionOnly || ["blocked", "degraded", "stale", "unknown"].includes(project.status))
      .slice()
      .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
  }, [matches, needsAttentionOnly, snapshot.projects]);
  const filteredProof = useMemo(() => {
    const byStatus = proofFilter === "all" ? snapshot.proofFeed : snapshot.proofFeed.filter((item) => item.status === proofFilter);
    return byStatus.filter(matches);
  }, [matches, proofFilter, snapshot.proofFeed]);

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

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-[0.25em] text-cyan-300">Search everything</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="agent, project, incident, proof, blocker..."
                className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/20"
              />
            </label>
            <button type="button" onClick={() => setNeedsAttentionOnly((value) => !value)} className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${needsAttentionOnly ? "border-amber-300 bg-amber-300 text-slate-950" : "border-white/10 text-slate-200 hover:border-amber-300/60"}`}>
              Needs attention
            </button>
            <button type="button" onClick={() => { setQuery(""); setNeedsAttentionOnly(false); setSelection(null); setSelectedAgentId(null); setSelectedProjectId(null); }} className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/60 hover:text-cyan-100">
              Clear filters
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Showing {filteredActions.length} actions • {filteredIncidents.length} incidents • {filteredAgents.length} agents • {filteredProjects.length} projects • {filteredProof.length} proof rows
          </p>
        </section>

        <SelectionPanel selection={selection} claims={snapshot.claims} evidence={snapshot.evidence} onExplain={setExplain} onClear={() => setSelection(null)} />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="space-y-5">
            {showJustin && <JustinQueue actions={filteredActions} onSelectAction={(item) => setSelection({ kind: "action", item })} onExplain={setExplain} />}
            {showIncidents && <IncidentsPanel incidents={filteredIncidents} onSelectIncident={(item) => setSelection({ kind: "incident", item })} onExplain={setExplain} />}
          </div>
          <div className="space-y-5">
            {showAgents && (
              <AgentLanes
                agents={filteredAgents}
                activeAgentId={selectedAgentId}
                onSelectAgent={(agentId) => {
                  setSelectedAgentId(agentId);
                  const agent = snapshot.agents.find((item) => item.id === agentId);
                  if (agent) setSelection({ kind: "agent", item: agent });
                }}
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
            projects={filteredProjects}
            activeProjectId={selectedProjectId}
            onSelectProject={(projectId) => {
              setSelectedProjectId(projectId);
              const project = snapshot.projects.find((item) => item.id === projectId);
              if (project) setSelection({ kind: "project", item: project });
            }}
            onExplain={setExplain}
          />
        )}
      </div>
      <ExplainDrawer record={explain} claims={snapshot.claims} evidence={snapshot.evidence} onClose={() => setExplain(null)} />
    </main>
  );
}
