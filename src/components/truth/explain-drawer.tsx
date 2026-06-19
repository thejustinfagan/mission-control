"use client";

import { StatusPill } from "./status-pill";
import type { Claim, Evidence } from "@/lib/truth/types";

export type ExplainRecord = {
  id: string;
  title: string;
  status?: string;
  confidence?: string;
  ruleId?: string;
  evidenceIds: string[];
  claimIds: string[];
};

export function ExplainButton({ record, onExplain }: { record: ExplainRecord; onExplain: (record: ExplainRecord) => void }) {
  return (
    <button type="button" onClick={() => onExplain(record)} className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/60 hover:text-cyan-100">
      Explain
    </button>
  );
}

export function ExplainDrawer({ record, claims, evidence, onClose }: { record: ExplainRecord | null; claims: Claim[]; evidence: Evidence[]; onClose: () => void }) {
  if (!record) return null;
  const relatedClaims = claims.filter((claim) => record.claimIds.includes(claim.id) || claim.evidenceIds.some((id) => record.evidenceIds.includes(id)));
  const evidenceIds = new Set([...record.evidenceIds, ...relatedClaims.flatMap((claim) => claim.evidenceIds)]);
  const relatedEvidence = evidence.filter((row) => evidenceIds.has(row.id));

  return (
    <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose}>
      <aside className="absolute bottom-0 right-0 max-h-[88vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-slate-950 p-5 shadow-2xl md:top-0 md:h-full md:max-h-full md:w-[440px] md:rounded-l-3xl md:rounded-tr-none" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Explain</p>
            <h2 className="mt-2 text-xl font-bold text-white">{record.title}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {record.status && <StatusPill status={record.status} />}
              {record.confidence && <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-slate-300">confidence: {record.confidence}</span>}
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-300">Close</button>
        </div>

        <section className="space-y-3">
          {relatedClaims.map((claim) => (
            <div key={claim.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center justify-between gap-2"><strong className="text-sm text-white">{claim.title}</strong><StatusPill status={claim.status} /></div>
              <p className="mt-2 text-sm text-slate-300">{claim.summary}</p>
              <p className="mt-2 text-xs text-slate-500">Rule: {claim.ruleId} • Evidence: {claim.evidenceIds.join(", ") || "none"}</p>
            </div>
          ))}
          {relatedEvidence.map((row) => (
            <div key={row.id} className="rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.04] p-3">
              <div className="flex items-center justify-between gap-2"><strong className="text-sm text-cyan-100">{row.sourceName}</strong><StatusPill status={row.status} /></div>
              <p className="mt-2 text-sm text-slate-300">{row.summary}</p>
              <dl className="mt-2 space-y-1 text-xs text-slate-400">
                <div>Captured: {row.capturedAt}</div>
                <div>TTL: {row.ttlSeconds}s</div>
                <div>Confidence: {row.confidence}</div>
                {row.artifactUrl && <div>Artifact: <a className="text-cyan-300 underline" href={row.artifactUrl}>{row.artifactUrl}</a></div>}
                {row.rawRef && <div>Raw ref: {row.rawRef}</div>}
              </dl>
            </div>
          ))}
          {relatedClaims.length === 0 && relatedEvidence.length === 0 && <p className="text-sm text-slate-400">No related proof found for this record.</p>}
        </section>
      </aside>
    </div>
  );
}
