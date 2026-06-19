"use client";

import type { JustinAction, JustinControl } from "@/lib/truth/types";
import type { ExplainHandler } from "./explain-types";

const PRIORITY_TONE: Record<JustinAction["priority"], string> = {
  high: "border-l-red-500",
  medium: "border-l-amber-500",
  low: "border-l-slate-500",
};

const KIND_LABEL: Record<JustinAction["kind"], string> = {
  decision: "Decision",
  approval: "Approval",
  unblock: "Unblock",
  verify: "Verify",
  "review-artifact": "Review",
};

function ControlButton({
  control,
  onExplain,
}: {
  control: JustinControl;
  onExplain: () => void;
}) {
  const isExplain = control.type === "explain";
  return (
    <button
      onClick={isExplain ? onExplain : undefined}
      disabled={!isExplain}
      title={isExplain ? "See evidence behind this item" : "Control is a stub in this build"}
      className={`rounded-md border px-2 py-0.5 text-[11px] font-medium transition ${
        isExplain
          ? "border-aurora-500/40 text-aurora-300 hover:bg-aurora-500/10"
          : "cursor-not-allowed border-slate-700/50 text-slate-500"
      }`}
    >
      {control.label}
    </button>
  );
}

export function JustinQueue({
  actions,
  onExplain,
}: {
  actions: JustinAction[];
  onExplain: ExplainHandler;
}) {
  return (
    <section className="glass-panel rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-aurora-400/80">Justin Queue</p>
          <h2 className="text-sm font-semibold text-white">What needs you ({actions.length})</h2>
        </div>
      </div>

      {actions.length === 0 ? (
        <p className="rounded-xl border border-slate-700/50 bg-slate-800/40 px-3 py-3 text-xs text-slate-400">
          Nothing is waiting on you right now. Decisions, approvals, and unblock requests will appear here.
        </p>
      ) : (
        <ul className="space-y-2">
          {actions.map((a) => {
            const explainReq = {
              title: a.title,
              subtitle: `${KIND_LABEL[a.kind]} · ${a.detail}`,
              claimIds: a.claimIds,
              evidenceIds: a.evidenceIds,
            };
            return (
              <li
                key={a.id}
                className={`rounded-r-xl border-l-4 bg-slate-800/40 p-3 ${PRIORITY_TONE[a.priority]}`}
              >
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  <span className="rounded bg-slate-700/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
                    {KIND_LABEL[a.kind]}
                  </span>
                  <span className="text-[10px] uppercase text-slate-500">{a.priority} priority</span>
                </div>
                <p className="text-sm font-medium text-white">{a.title}</p>
                <p className="mt-0.5 text-xs text-slate-400">{a.detail}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {a.controls.map((c) => (
                    <ControlButton
                      key={c.type}
                      control={c}
                      onExplain={() => onExplain(explainReq)}
                    />
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
