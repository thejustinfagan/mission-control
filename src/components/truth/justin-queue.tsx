"use client";

import { useMemo, useState } from "react";
import type { ActionDecision, JustinAction, JustinControl } from "@/lib/truth/types";
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

const DECISION_TONE: Record<ActionDecision["status"], string> = {
  approved: "text-aurora-300 border-aurora-500/40 bg-aurora-500/10",
  rejected: "text-red-300 border-red-500/40 bg-red-500/10",
  deferred: "text-amber-300 border-amber-500/40 bg-amber-500/10",
  unblocked: "text-aurora-300 border-aurora-500/40 bg-aurora-500/10",
  "verification-requested": "text-cyan-300 border-cyan-500/40 bg-cyan-500/10",
  assigned: "text-violet-300 border-violet-500/40 bg-violet-500/10",
  "artifact-opened": "text-slate-300 border-slate-500/40 bg-slate-500/10",
};

function ControlButton({
  action,
  control,
  busy,
  onAct,
  onExplain,
}: {
  action: JustinAction;
  control: JustinControl;
  busy: boolean;
  onAct: (action: JustinAction, control: JustinControl) => void;
  onExplain: () => void;
}) {
  const isExplain = control.type === "explain";
  return (
    <button
      onClick={isExplain ? onExplain : () => onAct(action, control)}
      disabled={busy}
      title={isExplain ? "See evidence behind this item" : `${control.label} and record the decision`}
      className={`rounded-md border px-2 py-0.5 text-[11px] font-medium transition ${
        isExplain
          ? "border-aurora-500/40 text-aurora-300 hover:bg-aurora-500/10"
          : "border-slate-600/70 text-slate-200 hover:border-aurora-500/50 hover:bg-aurora-500/10 disabled:cursor-wait disabled:opacity-50"
      }`}
    >
      {busy && !isExplain ? "Working…" : control.label}
    </button>
  );
}

export function JustinQueue({
  actions,
  actionDecisions = [],
  onExplain,
}: {
  actions: JustinAction[];
  actionDecisions?: ActionDecision[];
  onExplain: ExplainHandler;
}) {
  const [localActions, setLocalActions] = useState(actions);
  const [decisions, setDecisions] = useState(actionDecisions);
  const [busyActionId, setBusyActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recentDecisions = useMemo(() => decisions.slice(0, 4), [decisions]);

  async function actOn(action: JustinAction, control: JustinControl) {
    if (control.type === "explain") return;
    setBusyActionId(action.id);
    setError(null);
    try {
      const response = await fetch("/api/mission-control/actions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          actionId: action.id,
          controlType: control.type,
          label: control.label,
          title: action.title,
          subject: action.subject,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Action failed");
      setLocalActions((current) => current.filter((item) => item.id !== action.id));
      setDecisions((current) => [payload.decision, ...current.filter((item) => item.actionId !== action.id)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyActionId(null);
    }
  }

  return (
    <section className="glass-panel rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-aurora-400/80">Justin Queue</p>
          <h2 className="text-sm font-semibold text-white">What needs you ({localActions.length})</h2>
        </div>
      </div>

      {error && <p className="mb-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</p>}

      {localActions.length === 0 ? (
        <p className="rounded-xl border border-slate-700/50 bg-slate-800/40 px-3 py-3 text-xs text-slate-400">
          Nothing is waiting on you right now. Decisions, approvals, and unblock requests will appear here.
        </p>
      ) : (
        <ul className="space-y-2">
          {localActions.map((a) => {
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
                      action={a}
                      control={c}
                      busy={busyActionId === a.id}
                      onAct={actOn}
                      onExplain={() => onExplain(explainReq)}
                    />
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {recentDecisions.length > 0 && (
        <div className="mt-3 rounded-xl border border-slate-700/50 bg-slate-950/35 p-3">
          <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-slate-500">Acted upon</p>
          <ul className="space-y-1.5">
            {recentDecisions.map((decision) => (
              <li key={decision.id} className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${DECISION_TONE[decision.status]}`}>{decision.status}</span>
                <span className="min-w-0 flex-1 truncate" title={decision.title}>{decision.title}</span>
                <span className="text-[10px] text-slate-500">{new Date(decision.decidedAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
