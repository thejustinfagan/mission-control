"use client";

import { useState } from "react";
import type { MissionControlSnapshot } from "@/lib/truth/types";
import { AgentLanes } from "./agent-lanes";
import { ExplainDrawer, type ExplainRecord } from "./explain-drawer";
import { GlobalStatusCard } from "./global-status-card";
import { IncidentsPanel } from "./incidents-panel";
import { JustinQueue } from "./justin-queue";
import { ProofFeed } from "./proof-feed";
import { ProjectStateGrid } from "./project-state-grid";

export function TruthCockpit({ snapshot }: { snapshot: MissionControlSnapshot }) {
  const [explain, setExplain] = useState<ExplainRecord | null>(null);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#164e63_0,transparent_35%),#020617] px-4 py-5 text-slate-100 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-cyan-300">Mission Control</p>
          <p className="text-sm text-slate-300">Truth Machine • {snapshot.freshness.label} • source: /api/mission-control</p>
        </header>

        <GlobalStatusCard snapshot={snapshot} onExplain={setExplain} />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="space-y-5">
            <JustinQueue actions={snapshot.justinQueue} onExplain={setExplain} />
            <IncidentsPanel incidents={snapshot.incidents} onExplain={setExplain} />
          </div>
          <div className="space-y-5">
            <AgentLanes agents={snapshot.agents} onExplain={setExplain} />
            <ProofFeed items={snapshot.proofFeed} />
          </div>
        </div>

        <ProjectStateGrid projects={snapshot.projects} onExplain={setExplain} />
      </div>
      <ExplainDrawer record={explain} claims={snapshot.claims} evidence={snapshot.evidence} onClose={() => setExplain(null)} />
    </main>
  );
}
