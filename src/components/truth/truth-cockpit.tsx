"use client";

import { useState, useCallback } from "react";
import type { MissionControlSnapshot } from "@/lib/truth/types";
import { resolveRefs } from "@/lib/truth/explain";
import { ExplainDrawer, type ExplainTarget } from "./explain-drawer";
import { GlobalStatusCard } from "./global-status-card";
import { JustinQueue } from "./justin-queue";
import { IncidentsPanel } from "./incidents-panel";
import { AgentLanes } from "./agent-lanes";
import { ProofCardBoard } from "./proof-card-board";
import { ProofFeed } from "./proof-feed";
import { ProjectStateGrid } from "./project-state-grid";
import { ExecutiveBriefingPanel } from "./executive-briefing";
import { NightlySweepPanel } from "./nightly-sweep-panel";
import { StrategicLanesPanel } from "./strategic-lanes-panel";
import type { ExplainRequest } from "./explain-types";

const NAV_PAGES = [
  { href: "/tasks", label: "Task Board", icon: "📋" },
  { href: "/projects", label: "Projects", icon: "🗂️" },
  { href: "/calendar", label: "Calendar", icon: "📅" },
  { href: "/team", label: "Team", icon: "👥" },
  { href: "/memory", label: "Memory", icon: "🧠" },
];

export function TruthCockpit({ snapshot }: { snapshot: MissionControlSnapshot }) {
  const [target, setTarget] = useState<ExplainTarget | null>(null);

  const onExplain = useCallback(
    (req: ExplainRequest) => {
      const { claims, evidence } = resolveRefs(snapshot, req.claimIds, req.evidenceIds);
      setTarget({
        title: req.title,
        subtitle: req.subtitle,
        claims,
        evidence,
      });
    },
    [snapshot]
  );

  const closeDrawer = useCallback(() => setTarget(null), []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-midnight-900">
      <div className="absolute inset-0 bg-grid-fade" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-3xl px-3 py-5 sm:px-4 sm:py-6">
        {/* Header */}
        <header className="mb-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-aurora-400/80">Mission Control</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Truth Cockpit</h1>
          <p className="mt-1 text-xs text-slate-400">
            Evidence-backed snapshot · every claim has source, freshness, and proof. Tap Explain on anything.
          </p>

          <nav className="mt-3 flex flex-wrap gap-2">
            {NAV_PAGES.map((page) => (
              <a
                key={page.href}
                href={page.href}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700/50 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-300 transition hover:border-aurora-500/40 hover:text-aurora-300"
              >
                <span aria-hidden="true">{page.icon}</span>
                <span>{page.label}</span>
              </a>
            ))}
          </nav>
        </header>

        {/* Above the fold: briefing, status, queue, risks, agents, proof */}
        <div className="space-y-3">
          <ExecutiveBriefingPanel />
          <NightlySweepPanel />
          <StrategicLanesPanel />
          <GlobalStatusCard
            globalStatus={snapshot.globalStatus}
            summary={snapshot.summary}
            freshness={snapshot.freshness}
            generatedAt={snapshot.generatedAt}
            onExplain={onExplain}
          />
          <JustinQueue actions={snapshot.justinQueue} actionDecisions={snapshot.actionDecisions} onExplain={onExplain} />
          <IncidentsPanel incidents={snapshot.incidents} onExplain={onExplain} />
          <AgentLanes agents={snapshot.agents} onExplain={onExplain} />
          <ProofCardBoard cards={snapshot.proofCards} onExplain={onExplain} />
          <ProofFeed items={snapshot.proofFeed} onExplain={onExplain} />
          <ProjectStateGrid projects={snapshot.projects} onExplain={onExplain} />
        </div>

        <footer className="mt-6 border-t border-slate-800 pt-4 text-[10px] leading-relaxed text-slate-600">
          <p>
            Truth doctrine: No claim without evidence · Unknown beats fake green · Agent reports are
            testimony, not proof · Stale evidence expires · Deploy green ≠ product working.
          </p>
        </footer>
      </div>

      <ExplainDrawer target={target} onClose={closeDrawer} />
    </main>
  );
}
