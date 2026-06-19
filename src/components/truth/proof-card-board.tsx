"use client";

import type { ProofCard } from "@/lib/truth/types";
import type { ExplainHandler } from "./explain-types";
import { StatusPill, verificationTone } from "./status-pill";

export function ProofCardBoard({
  cards,
  onExplain,
}: {
  cards: ProofCard[];
  onExplain: ExplainHandler;
}) {
  return (
    <section className="glass-panel rounded-2xl p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-aurora-400/80">Thin proof plane</p>
          <h2 className="text-sm font-semibold text-white">Bot Run Proof Cards ({cards.length})</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Every autonomous run needs change, repo, branch, commit, tests, deploy/live proof, blocker, and next action.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {cards.map((card) => {
          const shownSlots = [
            card.slots.change,
            card.slots.tests,
            card.slots.liveVerification,
            card.slots.blocker,
            card.slots.nextAction,
          ];
          return (
            <article key={card.id} className="rounded-xl border border-slate-700/50 bg-slate-900/45 p-3">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">{card.projectName}</p>
                  <h3 className="truncate text-sm font-semibold text-white">{card.title}</h3>
                </div>
                <StatusPill tone={verificationTone(card.status)} label={card.status} />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {shownSlots.map((slot) => (
                  <div key={slot.id} className="rounded-lg border border-slate-700/40 bg-slate-950/35 p-2">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{slot.label}</p>
                      <StatusPill tone={verificationTone(slot.status)} label={slot.status} dot={false} />
                    </div>
                    <p className="line-clamp-2 text-xs leading-relaxed text-slate-200" title={slot.value}>{slot.value}</p>
                    {slot.ref && (
                      <a className="mt-1 inline-block text-[10px] text-aurora-300 underline decoration-aurora-500/40" href={slot.ref} target="_blank" rel="noreferrer">
                        Open proof →
                      </a>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() =>
                  onExplain({
                    title: card.title,
                    subtitle: `${card.projectName} · ${card.status} · updated ${card.updatedAt}`,
                    claimIds: card.claimIds,
                    evidenceIds: card.evidenceIds,
                  })
                }
                className="mt-3 rounded-md border border-slate-700/60 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-700/40"
              >
                Explain proof card
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
