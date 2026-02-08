"use client";

import { useState, useMemo } from "react";

interface SearchResult {
  id: string;
  type: "memory" | "project" | "activity" | "file";
  title: string;
  snippet: string;
  path?: string;
  score: number;
}

// Mock searchable content - in production this would query files/memory
const searchableContent = [
  {
    id: "mem_001",
    type: "memory" as const,
    title: "Core Directives",
    content: "Always finish things. 24/7 business partner mode. Use subscriptions not APIs. Finish before starting. Cognitive Cage Fighting.",
    path: "MEMORY.md",
  },
  {
    id: "mem_002",
    type: "memory" as const,
    title: "Model Preferences",
    content: "Gemini Flash for research. Codex CLI for code. Grok for social. Claude Opus for strategy. Never use Opus for grunt work.",
    path: "MEMORY.md",
  },
  {
    id: "proj_001",
    type: "project" as const,
    title: "Fleet Intel v3",
    content: "4.38M carriers. 4.59M crash records. Geographic search. Cloudflare tunnel. Local SQLite database.",
    path: "projects/fleet-intel/",
  },
  {
    id: "proj_002",
    type: "project" as const,
    title: "Battle Dinghy",
    content: "Twitter battleship game. @BattleDinghy. ORE protocol integration planned. Igor rule change pipeline.",
    path: "projects/Battle_Dinghy/",
  },
  {
    id: "proj_003",
    type: "project" as const,
    title: "X_Simulator + ThreadChess",
    content: "Twitter clone. ThreadChess game engine. Image generation. Next.js frontend port 3001.",
    path: "projects/X_Simulator/",
  },
  {
    id: "proj_004",
    type: "project" as const,
    title: "Polymarket Scanner",
    content: "Paper trading 130 positions. Whale tracking. FITS PATTERN signal detection. 4-6 week validation.",
    path: "projects/polymarket/",
  },
  {
    id: "proj_005",
    type: "project" as const,
    title: "JIT Chrome Extension",
    content: "Intercept competitor part searches. Show JIT inventory and pricing. Manifest V3. Needs API access.",
    path: "projects/jit-extension/",
  },
  {
    id: "file_001",
    type: "file" as const,
    title: "AGENTS.md",
    content: "Barry's operating manual. Memory architecture. Project status tracking. Heartbeat behavior. Skill installation audit.",
    path: "AGENTS.md",
  },
  {
    id: "file_002",
    type: "file" as const,
    title: "SOUL.md",
    content: "Barry's coding soul. Chief of Staff upgrade. Git workflow. Commit standards. Division of labor.",
    path: "SOUL.md",
  },
  {
    id: "file_003",
    type: "file" as const,
    title: "USER.md",
    content: "Justin Fagan. West Point. Army Infantry Captain. Iraq tours. Director of Marketing. JTBD expert. Enneagram 7.",
    path: "USER.md",
  },
  {
    id: "act_001",
    type: "activity" as const,
    title: "Crash Database Import",
    content: "Imported 4.89M crash records to Fleet Intel database. SQLite. FMCSA data.",
    path: "memory/2026-02-06.md",
  },
  {
    id: "act_002",
    type: "activity" as const,
    title: "Igor Pipeline Built",
    content: "Rule change pipeline for Battle Dinghy. Custom game modes via Twitter. Parser, builder, tester, deployer.",
    path: "memory/2026-02-07.md",
  },
];

function searchContent(query: string): SearchResult[] {
  if (!query.trim()) return [];
  
  const lowerQuery = query.toLowerCase();
  const words = lowerQuery.split(/\s+/).filter(w => w.length > 1);
  
  const results: (SearchResult | null)[] = searchableContent
    .map(item => {
      const lowerContent = item.content.toLowerCase();
      const lowerTitle = item.title.toLowerCase();
      
      let score = 0;
      
      // Title matches are worth more
      if (lowerTitle.includes(lowerQuery)) {
        score += 100;
      }
      
      // Count word matches
      for (const word of words) {
        if (lowerTitle.includes(word)) score += 20;
        if (lowerContent.includes(word)) score += 5;
      }
      
      // Exact phrase match in content
      if (lowerContent.includes(lowerQuery)) {
        score += 50;
      }
      
      if (score === 0) return null;
      
      // Create snippet around match
      let snippet = item.content;
      const matchIndex = lowerContent.indexOf(words[0] || lowerQuery);
      if (matchIndex > 30) {
        snippet = "..." + item.content.slice(matchIndex - 20, matchIndex + 100) + "...";
      } else if (snippet.length > 120) {
        snippet = snippet.slice(0, 120) + "...";
      }
      
      return {
        id: item.id,
        type: item.type,
        title: item.title,
        snippet,
        path: item.path,
        score,
      };
    });
  
  return results
    .filter((r): r is SearchResult => r !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

const typeStyles: Record<string, string> = {
  memory: "bg-purple-500/20 text-purple-300 border-purple-400/30",
  project: "bg-indigo-500/20 text-indigo-300 border-indigo-400/30",
  activity: "bg-aurora-500/20 text-aurora-300 border-aurora-400/30",
  file: "bg-comet-500/20 text-comet-300 border-comet-400/30",
};

export function SearchView() {
  const [query, setQuery] = useState("");
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  const results = useMemo(() => searchContent(query), [query]);

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="glass-panel rounded-3xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Global Search</h2>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search memory, projects, files, activities..."
            className="w-full rounded-xl border border-slate-700/60 bg-midnight-700/60 px-4 py-3 pl-10 text-slate-100 outline-none transition focus:border-aurora-500/70"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        </div>
        
        <div className="mt-4 flex gap-2 text-xs">
          <span className="text-slate-400">Try:</span>
          {["Fleet Intel", "Claude", "heartbeat", "FMCSA", "Justin"].map((term) => (
            <button
              key={term}
              onClick={() => setQuery(term)}
              className="rounded-lg bg-slate-800/50 px-2 py-1 text-slate-300 hover:bg-slate-700/50 transition"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {query.trim() && (
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">
              {results.length > 0 ? `${results.length} results` : "No results"}
            </h3>
            {results.length > 0 && (
              <span className="text-xs text-slate-400">Ranked by relevance</span>
            )}
          </div>

          {results.length === 0 ? (
            <p className="text-sm text-slate-400">
              No matches found for &ldquo;{query}&rdquo;. Try different keywords.
            </p>
          ) : (
            <div className="space-y-3">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => setSelectedResult(selectedResult?.id === result.id ? null : result)}
                  className={`w-full text-left rounded-2xl border p-4 transition ${
                    selectedResult?.id === result.id
                      ? "border-aurora-500/50 bg-aurora-500/10"
                      : "border-slate-800/80 bg-midnight-800/80 hover:border-slate-700/80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`rounded-full border px-2 py-0.5 text-xs uppercase tracking-wider ${typeStyles[result.type]}`}>
                          {result.type}
                        </span>
                        <span className="text-xs text-slate-500">{result.path}</span>
                      </div>
                      <h4 className="font-medium text-white">{result.title}</h4>
                      <p className="text-sm text-slate-400 mt-1 line-clamp-2">{result.snippet}</p>
                    </div>
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      Score: {result.score}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Access */}
      {!query.trim() && (
        <div className="glass-panel rounded-3xl p-6">
          <h3 className="font-semibold text-white mb-4">Quick Access</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: "📋", title: "MEMORY.md", desc: "Long-term memory" },
              { icon: "🎯", title: "STATUS.md", desc: "Project tracking" },
              { icon: "📥", title: "INCOMPLETE.md", desc: "Unfinished work" },
              { icon: "🚀", title: "PIPELINE.md", desc: "Ideas backlog" },
              { icon: "💭", title: "SOUL.md", desc: "Barry's identity" },
              { icon: "👤", title: "USER.md", desc: "About Justin" },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-3 cursor-pointer hover:border-aurora-500/40 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
