"use client";

import { useEffect } from "react";
import type { Claim, Evidence } from "@/lib/truth/types";
import { computeFreshness } from "@/lib/truth/ttl";
import {
  StatusPill,
  verificationTone,
  freshnessTone,
  freshnessLabel,
} from "./status-pill";

export interface ExplainTarget {
  title: string;
  subtitle?: string;
  claims: Claim[];
  evidence: Evidence[];
}

const KIND_LABEL: Record<string, string> = {
  "static-registry": "Static registry",
  "http-probe": "HTTP probe",
  "local-path": "Local path",
  "agent-heartbeat": "Agent heartbeat",
  "deploy-status": "Deploy status",
  "browser-render": "Browser render",
  "test-result": "Test result",
  manual: "Manual",
};

function fmt(ts: string | null): string {
  if (!ts) return "—";
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? ts : d.toISOString().replace("T", " ").replace(".000Z", "Z");
}

export function ExplainDrawer({
  target,
  onClose,
}: {
  target: ExplainTarget | null;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (target) {
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
  }, [target, onClose]);

  if (!target) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative h-full w-full max-w-md overflow-y-auto border-l border-slate-700/60 bg-midnight-800 shadow-panel">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-700/50 bg-midnight-800/95 px-4 py-3 backdrop-blur">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.3em] text-aurora-400/80">Explain</p>
            <h2 className="truncate text-base font-semibold text-white">{target.title}</h2>
            {target.subtitle && <p className="mt-0.5 text-xs text-slate-400">{target.subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700/60 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700/40"
            aria-label="Close explanation"
          >
            Close ✕
          </button>
        </div>

        <div className="space-y-5 px-4 py-4">
          {/* Claims */}
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Claims ({target.claims.length})
            </h3>
            {target.claims.length === 0 ? (
              <p className="rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2 text-xs text-slate-400">
                No claims reference this item. With no claim there is nothing verified — treat as Unknown.
              </p>
            ) : (
              <div className="space-y-2">
                {target.claims.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2"
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <StatusPill tone={verificationTone(c.status)} label={c.status} />
                      <span className="text-[10px] text-slate-500">confidence: {c.confidence}</span>
                    </div>
                    <p className="text-xs text-slate-200">{c.statement}</p>
                    {c.definition && (
                      <p className="mt-1 text-[11px] italic text-slate-500">{c.definition}</p>
                    )}
                    <p className="mt-1 text-[10px] text-slate-600">
                      Evidence: {c.evidenceIds.length ? c.evidenceIds.join(", ") : "none"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Evidence */}
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Evidence ({target.evidence.length})
            </h3>
            {target.evidence.length === 0 ? (
              <p className="rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2 text-xs text-slate-400">
                No evidence attached. Nothing here is proven.
              </p>
            ) : (
              <div className="space-y-2">
                {target.evidence.map((e) => {
                  const fresh = computeFreshness(e.observedAt, e.ttlSeconds);
                  return (
                  <div
                    key={e.id}
                    className="rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2"
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <StatusPill tone={freshnessTone(fresh)} label={freshnessLabel(fresh)} />
                      <span className="rounded bg-slate-700/50 px-1.5 py-0.5 text-[10px] text-slate-300">
                        {KIND_LABEL[e.kind] ?? e.kind}
                      </span>
                      {e.ok === true && <span className="text-[10px] text-aurora-400">pass</span>}
                      {e.ok === false && <span className="text-[10px] text-red-400">fail</span>}
                      {e.ok == null && <span className="text-[10px] text-slate-500">no pass/fail</span>}
                    </div>
                    <p className="text-xs text-slate-200">{e.summary}</p>
                    {e.detail && <p className="mt-1 text-[11px] text-slate-500">{e.detail}</p>}
                    <p className="mt-1 text-[10px] text-slate-600">
                      Source: {e.source.label}
                      {e.source.ref ? ` · ${e.source.ref}` : ""}
                    </p>
                    <p className="text-[10px] text-slate-600">
                      Observed: {fmt(e.observedAt)} · TTL: {e.ttlSeconds}s
                    </p>
                  </div>
                  );
                })}
              </div>
            )}
          </section>

          <p className="border-t border-slate-700/50 pt-3 text-[10px] leading-relaxed text-slate-600">
            Truth doctrine: no claim without evidence. Agent reports are testimony, not proof.
            Stale evidence expires. Deploy green does not mean the product works.
          </p>
        </div>
      </div>
    </div>
  );
}
