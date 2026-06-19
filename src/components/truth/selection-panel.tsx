"use client";

import type { AgentCard, Claim, Evidence, Incident, JustinAction, ProjectCard } from "@/lib/truth/types";
import { ExplainButton, type ExplainRecord } from "./explain-drawer";
import { StatusPill } from "./status-pill";

export type ActiveSelection =
  | { kind: "agent"; item: AgentCard }
  | { kind: "project"; item: ProjectCard }
  | { kind: "action"; item: JustinAction }
  | { kind: "incident"; item: Incident }
  | null;

export function SelectionPanel({
  selection,
  claims,
  evidence,
  onExplain,
  onClear,
}: {
  selection: ActiveSelection;
  claims: Claim[];
  evidence: Evidence[];
  onExplain: (record: ExplainRecord) => void;
  onClear: () => void;
}) {
  if (!selection) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Active selection</p>
        <h2 className="mt-2 text-lg font-bold text-white">Tap any card to inspect it</h2>
        <p className="mt-2 text-sm text-slate-400">Cards, proof rows, metrics, options, API links, and explain paths are now controls—not static labels.</p>
      </section>
    );
  }

  const base = buildRecord(selection);
  const relatedClaims = claims.filter((claim) => base.claimIds.includes(claim.id));
  const evidenceIds = new Set([...base.evidenceIds, ...relatedClaims.flatMap((claim) => claim.evidenceIds)]);
  const relatedEvidence = evidence.filter((row) => evidenceIds.has(row.id));

  return (
    <section className="rounded-3xl border border-cyan-300/20 bg-cyan-400/[0.04] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Active selection</p>
          <h2 className="mt-2 text-xl font-black text-white">{base.title}</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {base.status && <StatusPill status={base.status} />}
            <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-slate-300">{selection.kind}</span>
          </div>
        </div>
        <button type="button" onClick={onClear} className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-300 hover:border-cyan-300/60 hover:text-cyan-100">Clear</button>
      </div>

      <p className="mt-3 text-sm text-slate-300">{base.summary}</p>
      {base.next && <p className="mt-2 text-sm text-cyan-100">Next: {base.next}</p>}
      {base.blocker && <p className="mt-2 text-sm text-amber-100">Blocker: {base.blocker}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        <ExplainButton record={base} onExplain={onExplain} />
        {base.liveUrl && <a className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-cyan-200 hover:border-cyan-300/60 hover:text-cyan-100" href={base.liveUrl} target="_blank" rel="noreferrer">Open live</a>}
        {base.repoUrl && <a className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-200 hover:border-cyan-300/60 hover:text-cyan-100" href={base.repoUrl} target="_blank" rel="noreferrer">Open repo</a>}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {relatedClaims.slice(0, 4).map((claim) => (
          <button key={claim.id} type="button" onClick={() => onExplain({ id: claim.id, title: claim.title, status: claim.status, confidence: claim.confidence, evidenceIds: claim.evidenceIds, claimIds: [claim.id] })} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left hover:border-cyan-300/50">
            <div className="flex items-start justify-between gap-2"><strong className="text-sm text-white">{claim.title}</strong><StatusPill status={claim.status} /></div>
            <p className="mt-1 text-xs text-slate-400">{claim.summary}</p>
          </button>
        ))}
        {relatedEvidence.slice(0, 4).map((row) => (
          <button key={row.id} type="button" onClick={() => onExplain({ id: row.id, title: row.summary, status: row.status, confidence: row.confidence, evidenceIds: [row.id], claimIds: [] })} className="rounded-2xl border border-cyan-300/10 bg-cyan-400/[0.03] p-3 text-left hover:border-cyan-300/50">
            <div className="flex items-start justify-between gap-2"><strong className="text-sm text-cyan-100">{row.sourceName}</strong><StatusPill status={row.status} /></div>
            <p className="mt-1 text-xs text-slate-400">{row.summary}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function buildRecord(selection: NonNullable<ActiveSelection>): ExplainRecord & { summary: string; next?: string; blocker?: string; liveUrl?: string; repoUrl?: string } {
  if (selection.kind === "project") {
    const item = selection.item;
    return {
      id: item.id,
      title: `${item.emoji ?? ""} ${item.name}`.trim(),
      status: item.status,
      evidenceIds: item.evidenceIds,
      claimIds: item.claimIds,
      summary: item.objective,
      next: item.nextAction,
      blocker: item.blocker,
      liveUrl: item.liveUrl,
      repoUrl: item.repoUrl,
    };
  }
  if (selection.kind === "agent") {
    const item = selection.item;
    return {
      id: item.id,
      title: item.name,
      status: item.status,
      confidence: item.confidence,
      evidenceIds: item.evidenceIds,
      claimIds: item.claimIds,
      summary: item.lastProof ?? item.role,
      next: item.currentTask,
      blocker: item.blocker,
    };
  }
  if (selection.kind === "action") {
    const item = selection.item;
    return {
      id: item.id,
      title: item.title,
      status: item.urgency,
      evidenceIds: item.evidenceIds,
      claimIds: item.claimIds,
      summary: item.whyJustin,
      next: item.recommendation,
      blocker: item.risk,
    };
  }
  const item = selection.item;
  return {
    id: item.id,
    title: item.title,
    status: item.status,
    evidenceIds: item.evidenceIds,
    claimIds: item.claimIds,
    summary: item.symptom,
    next: item.recommendedAction,
    blocker: item.suspectedCause,
  };
}
