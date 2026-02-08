"use client";

import { useState } from "react";

interface DailySummary {
  date: string;
  highlights: string[];
  decisions: string[];
  shipped: string[];
  blockers: string[];
  nextSteps: string[];
}

// Today's summary data (would be fetched from API/files in production)
const summaries: DailySummary[] = [
  {
    date: "2026-02-08",
    highlights: [
      "🚀 Mission Control Projects tab deployed with stage gate view",
      "🔧 JIT Chrome Extension ready for testing (20,429 cross-refs)",
      "⚾ Baseball Showdown Phase 1 CLI complete (63/63 tests)",
      "📊 AI Calibration: Claude 90%, Gemini 70% on behavioral parameter ingestion",
      "🔍 FindTruckService scraper built (Selenium for CloudFront bypass)",
    ],
    decisions: [
      "X_Simulator → ARCHIVED as sandbox (Battle Dinghy IS the Game Factory)",
      "JIT Extension: Build scraper first, prove value, then request API access",
      "AI Calibration: Run tests NOW rather than perfect protocol",
      "Cluster Arbitrage added to 6am cron job",
      "Keep Working cron: Every 15 min ship/discover/depth cycle",
    ],
    shipped: [
      "Mission Control Projects tab (commit 2c38107)",
      "JIT Extension icons converted to PNG",
      "FindTruckService Selenium scraper",
      "Autonomous work cron system (3 crons, 15-min stagger)",
    ],
    blockers: [
      "Wife Calendar: 4 days stale, needs Justin test with real photo",
      "Google Drive Sync: Needs sudo for brew install",
    ],
    nextSteps: [
      "Justin test JIT Extension in Chrome",
      "Justin playtest Baseball Showdown CLI",
      "Continue AI Calibration (ChatGPT Web o1/o3)",
      "Polymarket paper trading validation (week 1 of 4-6)",
    ],
  },
  {
    date: "2026-02-07",
    highlights: [
      "🎮 Igor rule change pipeline deployed to Battle Dinghy",
      "🚛 Fleet Intel crash data fully integrated (4.59M records)",
      "📈 Polymarket wallet scanner Phase 4 & 5 complete",
    ],
    decisions: [
      "Battle Dinghy strategic pivot: This IS the Game Factory MVP",
      "Fleet Intel: Non-trucking facilities flagged as HIGH risk",
    ],
    shipped: [
      "Igor pipeline: parser, builder, tester, deployer, responder (2,457 lines)",
      "Crash history tab with risk scoring",
      "FITS PATTERN signal detection for Polymarket",
    ],
    blockers: [],
    nextSteps: [
      "Add Baseball Showdown as second game type",
      "Premium safety reports (PDF export)",
    ],
  },
];

interface ProjectMetrics {
  production: number;
  testing: number;
  development: number;
  planning: number;
  research: number;
  archived: number;
  total: number;
  needsAttention: number;
}

const metrics: ProjectMetrics = {
  production: 4,
  testing: 2,
  development: 4,
  planning: 2,
  research: 3,
  archived: 2,
  total: 17,
  needsAttention: 2,
};

export function SummaryView() {
  const [selectedDate, setSelectedDate] = useState(summaries[0]?.date || "");
  const currentSummary = summaries.find((s) => s.date === selectedDate) || summaries[0];

  return (
    <>
      {/* Executive Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="glass-panel rounded-2xl px-5 py-4 border-l-4 border-aurora-500">
          <p className="text-xs uppercase tracking-[0.3em] text-aurora-400">Production</p>
          <p className="mt-3 text-3xl font-semibold text-aurora-300">{metrics.production}</p>
          <p className="mt-2 text-xs text-slate-400">Live & deployed</p>
        </div>
        <div className="glass-panel rounded-2xl px-5 py-4 border-l-4 border-amber-500">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400">In Progress</p>
          <p className="mt-3 text-3xl font-semibold text-amber-300">{metrics.testing + metrics.development}</p>
          <p className="mt-2 text-xs text-slate-400">Testing + Development</p>
        </div>
        <div className="glass-panel rounded-2xl px-5 py-4 border-l-4 border-purple-500">
          <p className="text-xs uppercase tracking-[0.3em] text-purple-400">Pipeline</p>
          <p className="mt-3 text-3xl font-semibold text-purple-300">{metrics.planning + metrics.research}</p>
          <p className="mt-2 text-xs text-slate-400">Planning + Research</p>
        </div>
        <div className="glass-panel rounded-2xl px-5 py-4 border-l-4 border-rose-500">
          <p className="text-xs uppercase tracking-[0.3em] text-rose-400">Attention</p>
          <p className="mt-3 text-3xl font-semibold text-rose-300">{metrics.needsAttention}</p>
          <p className="mt-2 text-xs text-slate-400">Stale or blocked</p>
        </div>
      </div>

      {/* Date Selector */}
      <div className="mt-6 flex gap-2">
        {summaries.map((summary) => (
          <button
            key={summary.date}
            onClick={() => setSelectedDate(summary.date)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              selectedDate === summary.date
                ? "bg-aurora-500/20 text-aurora-300 border border-aurora-500/50"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            {summary.date}
          </button>
        ))}
      </div>

      {/* Daily Summary */}
      {currentSummary && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Highlights */}
          <div className="glass-panel rounded-3xl p-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span>✨</span> Highlights
            </h2>
            <ul className="mt-4 space-y-2">
              {currentSummary.highlights.map((item, i) => (
                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                  <span className="text-aurora-400 mt-1">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Decisions */}
          <div className="glass-panel rounded-3xl p-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span>⚖️</span> Decisions Made
            </h2>
            <ul className="mt-4 space-y-2">
              {currentSummary.decisions.map((item, i) => (
                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                  <span className="text-purple-400 mt-1">→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Shipped */}
          <div className="glass-panel rounded-3xl p-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span>🚀</span> Shipped
            </h2>
            <ul className="mt-4 space-y-2">
              {currentSummary.shipped.map((item, i) => (
                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Blockers & Next Steps */}
          <div className="space-y-6">
            {currentSummary.blockers.length > 0 && (
              <div className="glass-panel rounded-3xl p-6 border border-rose-500/30 bg-rose-500/5">
                <h2 className="text-lg font-semibold text-rose-300 flex items-center gap-2">
                  <span>🚨</span> Blockers
                </h2>
                <ul className="mt-4 space-y-2">
                  {currentSummary.blockers.map((item, i) => (
                    <li key={i} className="text-sm text-rose-200 flex items-start gap-2">
                      <span className="text-rose-400 mt-1">!</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="glass-panel rounded-3xl p-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span>📋</span> Next Steps
              </h2>
              <ul className="mt-4 space-y-2">
                {currentSummary.nextSteps.map((item, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-blue-400 mt-1">{i + 1}.</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Velocity */}
      <div className="mt-6 glass-panel rounded-3xl p-6">
        <h2 className="text-lg font-semibold text-white">📈 Weekly Velocity</h2>
        <p className="mt-2 text-sm text-slate-400">Shipped items by day this week</p>
        
        <div className="mt-4 flex items-end gap-2 h-32">
          {[
            { day: "Mon", count: 3 },
            { day: "Tue", count: 5 },
            { day: "Wed", count: 4 },
            { day: "Thu", count: 6 },
            { day: "Fri", count: 7 },
            { day: "Sat", count: 8 },
            { day: "Sun", count: 0 },
          ].map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
              <div 
                className="w-full bg-aurora-500/30 rounded-t-lg transition-all"
                style={{ height: `${(d.count / 8) * 100}%`, minHeight: d.count > 0 ? '8px' : '0' }}
              />
              <span className="text-xs text-slate-500">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Live Services */}
      <div className="mt-6 glass-panel rounded-3xl p-6">
        <h2 className="text-lg font-semibold text-white">🌐 Live Services</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            { name: "Fleet Intel v3", url: "https://excited-francisco-bean-guy.trycloudflare.com", status: "up" },
            { name: "Battle Dinghy", url: "https://twitter.com/BattleDinghy", status: "up" },
            { name: "ThreadChess", url: "https://powerful-optimism-production.up.railway.app", status: "up" },
            { name: "Mission Control", url: "https://mission-control-production-8b21.up.railway.app", status: "up" },
          ].map((service) => (
            <a
              key={service.name}
              href={service.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-midnight-800/80 p-3 hover:border-aurora-500/40 transition"
            >
              <div className="flex items-center gap-3">
                <span className={`h-2 w-2 rounded-full ${service.status === 'up' ? 'bg-aurora-500' : 'bg-rose-500'}`} />
                <span className="text-sm text-white">{service.name}</span>
              </div>
              <span className="text-xs text-slate-500">→</span>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
