"use client";

import { useState } from "react";
import { Navigation } from "@/components/navigation";
import { projects } from "@/data/projects";

export default function RailwayPage() {
  const [activity, setActivity] = useState<string[]>([
    "2026-06-18 10:23 - Deployed FleetPulse to Railway",
    "2026-06-18 09:15 - Barry health check passed",
    "2026-06-17 22:40 - Mission Control v1 feature-complete",
  ]);

  const handleDeploy = async (projectId: string, projectName: string) => {
    try {
      const res = await fetch("/api/railway/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      const timestamp = new Date().toISOString().slice(0, 16).replace("T", " ");
      setActivity(prev => [`${timestamp} - ${data.message || `Deploy triggered for ${projectName}`}`, ...prev]);
    } catch (e) {
      const timestamp = new Date().toISOString().slice(0, 16).replace("T", " ");
      setActivity(prev => [`${timestamp} - Deploy failed for ${projectName} (stub)`, ...prev]);
    }
  };

  const handleDeployDashboard = async () => {
    try {
      const res = await fetch("/api/railway/deploy-dashboard", {
        method: "POST",
      });
      const data = await res.json();
      const timestamp = new Date().toISOString().slice(0, 16).replace("T", " ");
      setActivity(prev => [`${timestamp} - ${data.message || "Dashboard deploy to Railway triggered"}`, ...prev]);
    } catch (e) {
      const timestamp = new Date().toISOString().slice(0, 16).replace("T", " ");
      setActivity(prev => [`${timestamp} - Dashboard deploy failed (stub)`, ...prev]);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-4">
      <Navigation />
      <div className="max-w-6xl mx-auto mt-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <span>🚂</span> Railway Deployment
        </h1>

        {/* Per-Project Deploy Buttons */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Per-Project Deploys</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 9).map((p) => (
              <div key={p.id} className="glass-panel rounded-2xl border border-slate-800/80 p-5 flex flex-col">
                <div className="flex items-center justify-between flex-1">
                  <div>
                    <span className="text-2xl mr-2">{p.emoji}</span>
                    <span className="font-semibold text-white">{p.name}</span>
                    <p className="text-xs text-slate-400 mt-1">{p.tagline}</p>
                  </div>
                  <button 
                    onClick={() => handleDeploy(p.id, p.name)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-medium transition flex-shrink-0"
                  >
                    Deploy
                  </button>
                </div>
                <div className="mt-3 text-[10px] text-slate-500">
                  Stage: {p.stage} • Priority: {p.priority}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deploy Dashboard Button */}
        <div className="mb-8">
          <div className="glass-panel rounded-2xl border border-slate-800/80 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg">Deploy Dashboard to Railway</h3>
                <p className="text-sm text-slate-400 mt-1">Push latest Mission Control build to production</p>
              </div>
              <button 
                onClick={handleDeployDashboard}
                className="px-6 py-3 bg-aurora-600 hover:bg-aurora-500 rounded-2xl font-semibold text-lg transition flex items-center gap-2 justify-center"
              >
                🚀 Deploy Dashboard to Railway
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="glass-panel rounded-2xl border border-slate-800/80 p-5 max-h-[400px] overflow-auto space-y-3 text-sm">
            {activity.length > 0 ? (
              activity.map((item, i) => (
                <div key={i} className="text-slate-300 border-b border-slate-800/60 pb-3 last:border-0 last:pb-0">
                  {item}
                </div>
              ))
            ) : (
              <p className="text-slate-500">No activity yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
