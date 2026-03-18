'use client';

import { useEffect, useState } from 'react';

interface FleetStats {
  total: number;
  highValue: number;
  lastRun: string;
  nextRun: string;
  avgPerDay: number;
  coverage: string;
}

interface ResellerStats {
  scraped: number;
  total: number;
  lastRun: string;
  status: string;
  daysRemaining: number;
}

export default function IntelPage() {
  const [fleetStats, setFleetStats] = useState<FleetStats | null>(null);
  const [resellerStats, setResellerStats] = useState<ResellerStats | null>(null);

  useEffect(() => {
    fetch('/api/intel/fleet')
      .then(res => res.json())
      .then(setFleetStats)
      .catch(console.error);

    fetch('/api/intel/reseller')
      .then(res => res.json())
      .then(setResellerStats)
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Intelligence Dashboard</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Fleet Intel Card */}
          <div className="bg-slate-800/50 backdrop-blur border border-cyan-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-cyan-400">Fleet Intel</h2>
              <span className="text-sm text-slate-400">Louisville 40217 + 50mi</span>
            </div>
            
            {fleetStats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Total Analyzed</p>
                    <p className="text-3xl font-bold text-cyan-400">{fleetStats.total.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">High-Value (&gt;10 trucks)</p>
                    <p className="text-3xl font-bold text-emerald-400">{fleetStats.highValue}</p>
                  </div>
                </div>
                
                <div className="border-t border-slate-700 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Last Run:</span>
                    <span>{fleetStats.lastRun}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Next Run:</span>
                    <span className="text-emerald-400">{fleetStats.nextRun}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Processing Rate:</span>
                    <span>~{fleetStats.avgPerDay}/day</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a 
                    href="/api/intel/fleet/export" 
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium text-center transition"
                    download
                  >
                    📥 Download DB
                  </a>
                  <a 
                    href="/api/intel/fleet/csv" 
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium text-center transition"
                    download
                  >
                    📄 Export CSV
                  </a>
                </div>
              </div>
            ) : (
              <div className="animate-pulse space-y-4">
                <div className="h-20 bg-slate-700/50 rounded"></div>
                <div className="h-32 bg-slate-700/50 rounded"></div>
              </div>
            )}
          </div>

          {/* Reseller Intel Card */}
          <div className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-purple-400">Reseller Intel</h2>
              <span className={`text-sm px-3 py-1 rounded-full ${
                resellerStats?.status === 'RUNNING' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {resellerStats?.status || 'Unknown'}
              </span>
            </div>
            
            {resellerStats ? (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-purple-400 font-semibold">
                      {resellerStats.scraped.toLocaleString()} / {resellerStats.total.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all"
                      style={{ width: `${(resellerStats.scraped / resellerStats.total) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {((resellerStats.scraped / resellerStats.total) * 100).toFixed(1)}% complete
                  </p>
                </div>
                
                <div className="border-t border-slate-700 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Last Activity:</span>
                    <span>{resellerStats.lastRun}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Est. Completion:</span>
                    <span className="text-emerald-400">
                      {resellerStats.daysRemaining > 0 ? `~${resellerStats.daysRemaining} days` : 'Complete'}
                    </span>
                  </div>
                </div>

                <button 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                  disabled={resellerStats.status === 'STOPPED'}
                >
                  {resellerStats.status === 'STOPPED' ? '⚠️ Restart Required' : '🔄 View Details'}
                </button>
              </div>
            ) : (
              <div className="animate-pulse space-y-4">
                <div className="h-20 bg-slate-700/50 rounded"></div>
                <div className="h-32 bg-slate-700/50 rounded"></div>
              </div>
            )}
          </div>
        </div>

        {/* Map Section */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-4">Coverage Map</h2>
          <div id="map" className="w-full h-[600px] bg-slate-900 rounded-lg border border-slate-700 flex items-center justify-center">
            <p className="text-slate-400">Loading interactive map...</p>
          </div>
          <div className="mt-4 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-slate-300">Analyzed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-slate-300">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-600"></div>
              <span className="text-slate-300">Remaining</span>
            </div>
          </div>
        </div>

        {/* High-Value Facilities Table */}
        <div className="mt-8 bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-4">Top High-Value Facilities</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-700">
                <tr className="text-left text-slate-400">
                  <th className="pb-3">DOT Number</th>
                  <th className="pb-3">Facility Type</th>
                  <th className="pb-3">Trucks</th>
                  <th className="pb-3">Trailers</th>
                  <th className="pb-3">Activity</th>
                  <th className="pb-3">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading facility data...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
