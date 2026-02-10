// Project data - synced from STATUS.md
// This is the source of truth for Mission Control

export interface ProjectFile {
  name: string;
  path: string;
  description?: string;
}

export interface ProjectAction {
  label: string;
  owner: "barry" | "justin";
  priority: "high" | "medium" | "low";
  completed?: boolean;
}

export interface ProjectMetric {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "flat";
}

export interface Project {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  stage: "production" | "testing" | "development" | "planning" | "research" | "archived";
  priority: number;
  status: string;
  lastWorked: string;
  liveUrl?: string;
  repoUrl?: string;
  localPath?: string;
  
  // Deep dive info
  currentMilestone: string;
  progress?: number; // 0-100
  nextActions: ProjectAction[];
  blockers: string[];
  needsDecision?: { question: string; options?: string[] };
  
  // Metrics
  metrics?: ProjectMetric[];
  revenueStatus?: {
    current: number;
    potential: number;
    currency: string;
  };
  
  // Technical
  techStack?: string[];
  keyFiles?: ProjectFile[];
  
  // History
  recentUpdates?: string[];
  keyDecisions?: { date: string; decision: string }[];
}

export const projects: Project[] = [
  // ============ PRODUCTION ============
  {
    id: "fleet-intel",
    name: "Fleet Intel v3",
    emoji: "🚛",
    tagline: "4.38M carrier database with crash data",
    stage: "production",
    priority: 1,
    status: "Deployed + Enhanced",
    lastWorked: "2026-02-09",
    liveUrl: "https://sphere-scsi-wait-submitting.trycloudflare.com",
    repoUrl: "https://github.com/thejustinfagan/fleet-intel",
    localPath: "~/projects/fleet-intel",
    
    currentMilestone: "Authority tab + Sortable columns shipped",
    progress: 85,
    nextActions: [
      { label: "Decide: FMCSA registration OR change-detection for Latest Updates", owner: "justin", priority: "high" },
      { label: "Build premium safety report PDF export", owner: "barry", priority: "medium" },
      { label: "Configure Stripe for $25/report pricing", owner: "justin", priority: "medium" },
    ],
    blockers: [],
    needsDecision: {
      question: "Latest Updates feature approach?",
      options: ["FMCSA API registration ($0, 2-4 weeks)", "Build change-detection (faster, manual)"]
    },
    
    metrics: [
      { label: "Carriers", value: "4.38M", trend: "flat" },
      { label: "Crash Records", value: "4.59M", trend: "flat" },
      { label: "Database Size", value: "9GB", trend: "flat" },
      { label: "States", value: "50", trend: "flat" },
    ],
    revenueStatus: { current: 0, potential: 12000, currency: "USD" },
    
    techStack: ["Next.js", "SQLite", "Tailwind", "Cloudflare Tunnel"],
    keyFiles: [
      { name: "Main DB", path: "~/projects/fleet-intel/data/fmcsa_carriers.db", description: "3.6GB carriers" },
      { name: "Crash DB", path: "~/projects/fleet-intel/data/crashes.db", description: "4.59M crashes" },
      { name: "Authority Tab", path: "~/projects/fleet-intel/components/CarrierAuthority.tsx" },
    ],
    
    recentUpdates: [
      "2026-02-09: Added Authority tab (SAFER, insurance, operating auth)",
      "2026-02-09: Added sortable columns (click headers)",
      "2026-02-09: Fixed table header cutoff",
      "2026-02-08: Imported 4.59M crash records",
    ],
    keyDecisions: [
      { date: "2026-02-09", decision: "Authority tab prioritized over Latest Updates" },
      { date: "2026-02-08", decision: "Cloudflare Tunnel over Railway (size limits)" },
    ],
  },

  {
    id: "battle-dinghy",
    name: "Battle Dinghy",
    emoji: "⚔️",
    tagline: "Multi-game Twitter bot (Game Factory)",
    stage: "production",
    priority: 2,
    status: "Production + ThreadChess Integration",
    lastWorked: "2026-02-09",
    liveUrl: "https://twitter.com/BattleDinghy",
    repoUrl: "https://github.com/thejustinfagan/Battle_Dinghy",
    localPath: "~/projects/Battle_Dinghy",
    
    currentMilestone: "ThreadChess integration complete - PR ready",
    progress: 90,
    nextActions: [
      { label: "Merge PR #3 (ThreadChess integration)", owner: "justin", priority: "high" },
      { label: "Test ThreadChess via @battle_dinghy", owner: "barry", priority: "high" },
      { label: "Add Baseball Showdown as third game", owner: "barry", priority: "low" },
    ],
    blockers: [],
    
    metrics: [
      { label: "Games Supported", value: 2, trend: "up" },
      { label: "Active Matches", value: "TBD" },
    ],
    
    techStack: ["Python", "Tweepy", "Pillow", "Railway"],
    keyFiles: [
      { name: "Main Polling", path: "~/projects/Battle_Dinghy/main_polling.py" },
      { name: "Game Detector", path: "~/projects/Battle_Dinghy/game_type_detector.py" },
      { name: "Chess Logic", path: "~/projects/Battle_Dinghy/chess_logic.py" },
      { name: "PR #3", path: "https://github.com/thejustinfagan/Battle_Dinghy/pull/3" },
    ],
    
    recentUpdates: [
      "2026-02-09: ThreadChess integration complete",
      "2026-02-09: Created PR #3 with full integration",
      "2026-02-07: Igor rule pipeline deployed",
    ],
    keyDecisions: [
      { date: "2026-02-09", decision: "ThreadChess via Battle Dinghy (one bot, multiple games)" },
      { date: "2026-02-07", decision: "This IS the Game Factory MVP" },
    ],
  },

  {
    id: "public-data",
    name: "License Reminders",
    emoji: "🔍",
    tagline: "Texas + Florida professional license renewal alerts",
    stage: "production",
    priority: 3,
    status: "Launch Ready - Both States",
    lastWorked: "2026-02-09",
    liveUrl: "https://thejustinfagan.github.io/texas-license-reminders/",
    localPath: "~/projects/public-data-research",
    
    currentMilestone: "Full launch package complete + Florida expansion",
    progress: 95,
    nextActions: [
      { label: "Set up Formspree for TX + FL landing pages", owner: "justin", priority: "high" },
      { label: "Send 3 CE provider emails (templates ready)", owner: "justin", priority: "high" },
      { label: "Send Florida public records request for emails", owner: "justin", priority: "medium" },
    ],
    blockers: [],
    
    metrics: [
      { label: "Texas Licenses", value: "110K" },
      { label: "Texas Expiring 60d", value: "12,806" },
      { label: "Florida Licenses", value: "325K" },
      { label: "Florida Expiring 60d", value: "58,425" },
    ],
    revenueStatus: { current: 0, potential: 425000, currency: "USD" },
    
    techStack: ["Python", "SQLite", "GitHub Pages"],
    keyFiles: [
      { name: "Texas Landing", path: "https://thejustinfagan.github.io/texas-license-reminders/" },
      { name: "Florida Landing", path: "https://thejustinfagan.github.io/florida-license-reminders/" },
      { name: "CE Provider Emails", path: "~/projects/public-data-research/outreach/ce-provider-emails.md" },
      { name: "Florida Analysis", path: "~/projects/public-data-research/docs/FLORIDA-ANALYSIS.md" },
      { name: "Whitepaper", path: "~/projects/public-data-research/docs/Texas-License-Reminders-Whitepaper.pdf" },
    ],
    
    recentUpdates: [
      "2026-02-09: Florida landing page deployed",
      "2026-02-09: Florida analysis complete (4.5x Texas opportunity)",
      "2026-02-09: Public records request template created",
      "2026-02-09: Texas whitepaper PDF generated",
    ],
    keyDecisions: [
      { date: "2026-02-09", decision: "CE referral model ($25-50/enrollment) over direct subscription" },
      { date: "2026-02-09", decision: "Florida expansion (4.5x larger opportunity)" },
    ],
  },

  {
    id: "jit-extension",
    name: "JIT Truck Parts Extension",
    emoji: "💼",
    tagline: "Chrome extension for parts cross-reference",
    stage: "testing",
    priority: 2,
    status: "v1.1.0 Ready for Testing",
    lastWorked: "2026-02-09",
    localPath: "~/projects/jit-chrome-extension",
    
    currentMilestone: "Rebranded + Google Search support",
    progress: 60,
    nextActions: [
      { label: "Reload extension in Chrome to get v1.1.0", owner: "justin", priority: "high" },
      { label: "Test on competitor sites", owner: "justin", priority: "medium" },
      { label: "Add more cross-reference data", owner: "barry", priority: "medium" },
    ],
    blockers: [],
    
    metrics: [
      { label: "Parts in DB", value: 279 },
      { label: "Cross-refs", value: 248 },
      { label: "Brands", value: 36 },
    ],
    
    techStack: ["JavaScript", "Chrome Extension", "JSON"],
    keyFiles: [
      { name: "Extension", path: "~/projects/jit-chrome-extension/extension/" },
      { name: "Cross-ref DB", path: "~/projects/truck-parts-crossref/" },
      { name: "Community Research", path: "~/projects/public-data-research/docs/TRUCK-PARTS-COMMUNITY-RESEARCH.md" },
    ],
    
    recentUpdates: [
      "2026-02-09: Rebranded to 'JIT TRUCK PARTS'",
      "2026-02-09: Added Google Search detection",
      "2026-02-09: Cross-ref DB expanded to 279 parts",
      "2026-02-09: Reddit monitor tool created",
    ],
  },

  {
    id: "baseball-showdown",
    name: "Baseball Showdown",
    emoji: "⚾",
    tagline: "Card-based baseball game with crypto integration",
    stage: "testing",
    priority: 3,
    status: "Phase 1 CLI Complete",
    lastWorked: "2026-02-08",
    localPath: "~/projects/baseball-showdown",
    
    currentMilestone: "CLI complete, ready for playtest",
    progress: 40,
    nextActions: [
      { label: "Playtest CLI game", owner: "justin", priority: "medium" },
      { label: "Phase 2: Ore Protocol integration", owner: "barry", priority: "low" },
    ],
    blockers: [],
    
    metrics: [
      { label: "Tests Passing", value: "63/63" },
      { label: "Games Validated", value: 10 },
    ],
    
    techStack: ["Python", "SQLite"],
    keyFiles: [
      { name: "CLI Entry", path: "~/projects/baseball-showdown/cli/main.py" },
    ],
    
    recentUpdates: [
      "2026-02-08: Phase 1 CLI complete",
      "2026-02-08: All 63 tests passing",
    ],
  },

  {
    id: "polymarket",
    name: "Polymarket Scanner",
    emoji: "📊",
    tagline: "Whale wallet tracking + paper trading",
    stage: "testing",
    priority: 3,
    status: "Paper Trading Week 1/6",
    lastWorked: "2026-02-09",
    localPath: "~/projects/polymarket",
    
    currentMilestone: "Paper trading validation in progress",
    progress: 25,
    nextActions: [
      { label: "Run paper_trader.py --update daily", owner: "barry", priority: "medium" },
      { label: "Validate edge over 4-6 weeks", owner: "barry", priority: "medium" },
    ],
    blockers: [],
    
    metrics: [
      { label: "Open Positions", value: 20 },
      { label: "Portfolio Value", value: "$9,044" },
      { label: "Unrealized P&L", value: "-$955 (-9.6%)" },
    ],
    
    techStack: ["Python", "SQLite", "requests"],
    keyFiles: [
      { name: "Paper Trader", path: "~/projects/polymarket/wallet-scanner/paper_trader.py" },
      { name: "Crypto Timing", path: "~/projects/polymarket/wallet-scanner/crypto_timing_tracker.py" },
    ],
    
    recentUpdates: [
      "2026-02-09: Paper trading status updated (20 open)",
      "2026-02-08: Paper trading system shipped",
    ],
  },

  {
    id: "truck-crossref",
    name: "Truck Parts Cross-Ref DB",
    emoji: "🔧",
    tagline: "OEM to aftermarket part number mapping",
    stage: "development",
    priority: 4,
    status: "Database Built + API + Web UI",
    lastWorked: "2026-02-09",
    localPath: "~/projects/truck-parts-crossref",
    
    currentMilestone: "279 parts, 248 cross-refs, 36 brands - API running",
    progress: 40,
    nextActions: [
      { label: "Parse PDF catalogs for more data", owner: "barry", priority: "medium" },
      { label: "Integrate with JIT extension", owner: "barry", priority: "medium" },
    ],
    blockers: [],
    
    metrics: [
      { label: "Parts", value: 279 },
      { label: "Cross-refs", value: 248 },
      { label: "Brands", value: 36 },
    ],
    
    techStack: ["Python", "Flask", "SQLite"],
    keyFiles: [
      { name: "API", path: "~/projects/truck-parts-crossref/api.py" },
      { name: "Lookup CLI", path: "~/projects/truck-parts-crossref/lookup.py" },
    ],
    
    recentUpdates: [
      "2026-02-09: Built Flask API + Web UI",
      "2026-02-09: Expanded to 279 parts, 36 brands",
      "2026-02-09: Added Autocar, Caterpillar, brake, electrical parts",
    ],
  },

  {
    id: "mission-control",
    name: "Mission Control",
    emoji: "🎛️",
    tagline: "Project dashboard and activity tracker",
    stage: "production",
    priority: 2,
    status: "Live - Upgrading",
    lastWorked: "2026-02-09",
    liveUrl: "https://mission-control-production-8b21.up.railway.app",
    localPath: "~/projects/mission-control",
    
    currentMilestone: "Adding project deep-dive pages",
    progress: 70,
    nextActions: [
      { label: "Deploy project detail pages", owner: "barry", priority: "high" },
    ],
    blockers: [],
    
    techStack: ["Next.js", "TypeScript", "Tailwind", "Railway"],
    
    recentUpdates: [
      "2026-02-09: Building project detail pages",
      "2026-02-09: Activity logging API working",
    ],
  },
];

export function getProject(id: string): Project | undefined {
  return projects.find(p => p.id === id);
}

export function getJustinActions(): { project: Project; action: ProjectAction }[] {
  const actions: { project: Project; action: ProjectAction }[] = [];
  for (const project of projects) {
    for (const action of project.nextActions) {
      if (action.owner === "justin" && !action.completed) {
        actions.push({ project, action });
      }
    }
  }
  return actions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.action.priority] - priorityOrder[b.action.priority];
  });
}
