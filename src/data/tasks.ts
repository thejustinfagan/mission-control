// Task data — synced from INCOMPLETE.md + workspace reality
// Last updated: 2026-03-31 by Barry (Nightly Amazement Build)

export interface Task {
  id: string;
  title: string;
  description?: string;
  project: string;
  assignee: "barry" | "justin" | "both";
  status: "todo" | "in-progress" | "blocked" | "done";
  priority: "critical" | "high" | "medium" | "low";
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  blockedReason?: string;
  tags?: string[];
}

const MAR_31 = "2026-03-31T06:00:00Z";
const MAR_30 = "2026-03-30T12:00:00Z";
const MAR_24 = "2026-03-24T12:00:00Z";
const MAR_16 = "2026-03-16T12:00:00Z";
const MAR_14 = "2026-03-14T12:00:00Z";
const FEB_09 = "2026-02-09T12:00:00Z";

export const tasks: Task[] = [
  // ===== BLOCKED =====
  {
    id: "apfs-deadlocks",
    title: "Fix APFS file-level deadlocks (4 local-only repos)",
    description: "~/projects/ repos still deadlocked. 22 repos recovered via ~/dev/ clones. 4 local-only repos (ai-whiteboard, railway-deploy, sportsmap, truck-parts-crossref) need Disk Utility or reboot.",
    project: "infrastructure",
    assignee: "justin",
    status: "blocked",
    priority: "high",
    createdAt: MAR_14,
    updatedAt: MAR_24,
    blockedReason: "Needs Justin: Disk Utility First Aid or reboot",
    tags: ["infra", "apfs"],
  },
  {
    id: "gh-actions-minutes",
    title: "Fix GitHub Actions minutes for beast-mode repo",
    description: "Private repo CI runners don't allocate — free-tier Actions minutes exhausted.",
    project: "beast-mode",
    assignee: "justin",
    status: "blocked",
    priority: "high",
    createdAt: MAR_16,
    updatedAt: MAR_16,
    blockedReason: "Needs billing update or make repo public",
    tags: ["ci", "github"],
  },

  // ===== IN PROGRESS =====
  {
    id: "mc-projects-page",
    title: "Build Projects page for Mission Control",
    description: "New /projects page with expandable project cards, stage filters, Justin's action items summary.",
    project: "mission-control",
    assignee: "barry",
    status: "in-progress",
    priority: "high",
    createdAt: MAR_31,
    updatedAt: MAR_31,
    tags: ["feature", "frontend"],
  },
  {
    id: "polymarket-validation",
    title: "Continue paper trading validation (4-6 weeks)",
    project: "polymarket",
    assignee: "barry",
    status: "in-progress",
    priority: "medium",
    createdAt: FEB_09,
    updatedAt: MAR_30,
    tags: ["validation"],
  },

  // ===== TODO (Justin) =====
  {
    id: "bd-merge-pr3",
    title: "Merge Battle Dinghy PR #3 (ThreadChess integration)",
    project: "battle-dinghy",
    assignee: "justin",
    status: "todo",
    priority: "high",
    createdAt: FEB_09,
    updatedAt: MAR_30,
    tags: ["pr", "merge"],
  },
  {
    id: "license-formspree",
    title: "Set up Formspree for TX + FL landing pages",
    project: "public-data",
    assignee: "justin",
    status: "todo",
    priority: "high",
    createdAt: FEB_09,
    updatedAt: FEB_09,
    tags: ["launch", "forms"],
  },
  {
    id: "license-ce-emails",
    title: "Send 3 CE provider outreach emails",
    project: "public-data",
    assignee: "justin",
    status: "todo",
    priority: "high",
    createdAt: FEB_09,
    updatedAt: FEB_09,
    tags: ["outreach", "revenue"],
  },
  {
    id: "dc-land-mobile",
    title: "Verify DC Land Intel mobile experience",
    project: "dc-land-intel",
    assignee: "justin",
    status: "todo",
    priority: "high",
    createdAt: MAR_24,
    updatedAt: MAR_24,
    tags: ["mobile", "ux"],
  },
  {
    id: "fleet-gmaps-key",
    title: "Set up Google Maps API key for Fleet Intel production",
    project: "fleet-intel",
    assignee: "justin",
    status: "todo",
    priority: "medium",
    createdAt: MAR_24,
    updatedAt: MAR_24,
    tags: ["deploy", "api"],
  },

  // ===== TODO (Barry) =====
  {
    id: "bd-i18n",
    title: "Implement Battle Dinghy i18n (JSON translation files)",
    project: "battle-dinghy",
    assignee: "barry",
    status: "todo",
    priority: "medium",
    createdAt: MAR_30,
    updatedAt: MAR_30,
    tags: ["feature", "i18n"],
  },
  {
    id: "mc-live-push",
    title: "Wire live data push from Barry's heartbeat to Mission Control",
    project: "mission-control",
    assignee: "barry",
    status: "todo",
    priority: "medium",
    createdAt: MAR_31,
    updatedAt: MAR_31,
    tags: ["feature", "api"],
  },

  // ===== DONE (recent) =====
  {
    id: "fleet-stripe-removed",
    title: "Remove Stripe billing from Fleet Intel",
    project: "fleet-intel",
    assignee: "barry",
    status: "done",
    priority: "high",
    createdAt: MAR_30,
    updatedAt: MAR_30,
    completedAt: MAR_30,
    tags: ["billing", "cleanup"],
  },
  {
    id: "apfs-mass-recovery",
    title: "APFS mass repo recovery (21 repos recloned)",
    project: "infrastructure",
    assignee: "barry",
    status: "done",
    priority: "critical",
    createdAt: MAR_14,
    updatedAt: MAR_24,
    completedAt: "2026-03-21T06:00:00Z",
    tags: ["infra", "recovery"],
  },
  {
    id: "beast-mode-github",
    title: "Push beast-mode to GitHub (data loss prevention)",
    project: "beast-mode",
    assignee: "barry",
    status: "done",
    priority: "critical",
    createdAt: MAR_14,
    updatedAt: MAR_14,
    completedAt: MAR_14,
    tags: ["git", "backup"],
  },
];
