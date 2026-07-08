"use client";

import { useCallback, useEffect, useState } from "react";

interface MonetizationLane {
  projectId: string;
  name: string;
  tagline: string;
  current: number;
  potential: number;
  currency: string;
  stage: string;
  blockers: string[];
}

interface ContentLane {
  projectId: string;
  name: string;
  lane: string;
  tagline: string;
  stage: string;
}

function formatMoney(amount: number, currency: string): string {
  if (amount >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export function StrategicLanesPanel() {
  const [monetization, setMonetization] = useState<MonetizationLane[]>([]);
  const [content, setContent] = useState<ContentLane[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mission-control/lanes", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load lanes");
      const data = await res.json();
      setMonetization(data.monetization ?? []);
      setContent(data.content ?? []);
    } catch {
      setMonetization([]);
      setContent([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <section className="glass-panel rounded-2xl p-4">
        <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-400/80">Strategic lanes</p>
        <p className="mt-2 text-xs text-slate-400">Loading…</p>
      </section>
    );
  }

  return (
    <section className="glass-panel rounded-2xl p-4">
      <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-400/80">Strategic lanes</p>
      <h2 className="mt-1 text-sm font-semibold text-white">Money & thought leadership</h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Monetization ({monetization.length})
          </p>
          {monetization.length === 0 ? (
            <p className="text-xs text-slate-500">No revenue hypotheses tracked.</p>
          ) : (
            <ul className="space-y-2">
              {monetization.map((m) => (
                <li
                  key={m.projectId}
                  className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-white">{m.name}</span>
                    <span className="shrink-0 text-[10px] font-semibold text-emerald-400">
                      {formatMoney(m.potential, m.currency)} potential
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-400">{m.tagline}</p>
                  {m.blockers.length > 0 && (
                    <p className="mt-1 text-[10px] text-amber-400/90">Blocker: {m.blockers[0]}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Content / thought leadership ({content.length})
          </p>
          {content.length === 0 ? (
            <p className="text-xs text-slate-500">No content lanes tagged.</p>
          ) : (
            <ul className="space-y-2">
              {content.map((c) => (
                <li
                  key={c.projectId}
                  className="rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-2"
                >
                  <span className="text-xs font-medium text-white">{c.name}</span>
                  <p className="mt-0.5 text-[11px] text-purple-300/90">{c.lane}</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">{c.stage}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
