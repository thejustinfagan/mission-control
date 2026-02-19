export interface Task {
  id: string;
  title: string;
  description?: string;
  project: string; // project id (fleet-intel, battle-dinghy, etc.)
  assignee: "barry" | "justin" | "both";
  status: "todo" | "in-progress" | "blocked" | "done";
  priority: "critical" | "high" | "medium" | "low";
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  completedAt?: string;
  blockedReason?: string;
  tags?: string[]; // e.g. ["deploy", "bug", "feature"]
}

const FEB_14 = "2026-02-14T15:00:00Z";
const FEB_16 = "2026-02-16T18:30:00Z";
const FEB_17 = "2026-02-17T19:15:00Z";
const FEB_18 = "2026-02-18T20:10:00Z";
const FEB_19 = "2026-02-19T14:05:00Z";

export const tasks: Task[] = [
  {
    id: "fleet-reseller-intel-rendering-error",
    title: "Fix Reseller Intel client-side rendering error",
    description: "Resolve the CSR error impacting Reseller Intel views.",
    project: "fleet-intel",
    assignee: "barry",
    status: "todo",
    priority: "high",
    createdAt: FEB_14,
    updatedAt: FEB_18,
    tags: ["bug", "frontend", "reseller-intel"],
  },
  {
    id: "fleet-deploy-territory-command-center",
    title: "Deploy Territory Command Center to Railway",
    project: "fleet-intel",
    assignee: "justin",
    status: "todo",
    priority: "medium",
    createdAt: FEB_16,
    updatedAt: FEB_18,
    tags: ["deploy", "railway"],
  },
  {
    id: "fleet-google-maps-key-restriction",
    title: "Google Maps API key restriction",
    project: "fleet-intel",
    assignee: "justin",
    status: "todo",
    priority: "medium",
    createdAt: FEB_16,
    updatedAt: FEB_18,
    tags: ["maps", "security"],
  },
  {
    id: "fleet-route-planner-drag-fix",
    title: "Route Planner drag behavior fix",
    project: "fleet-intel",
    assignee: "barry",
    status: "done",
    priority: "medium",
    createdAt: FEB_14,
    updatedAt: FEB_19,
    completedAt: FEB_19,
    tags: ["maps", "ux"],
  },
  {
    id: "fleet-polk-vin-data-display",
    title: "Polk VIN data display in Fleet tab",
    project: "fleet-intel",
    assignee: "barry",
    status: "done",
    priority: "medium",
    createdAt: FEB_14,
    updatedAt: FEB_19,
    completedAt: FEB_19,
    tags: ["data", "ui"],
  },
  {
    id: "fleet-google-maps-multi-stop",
    title: "Google Maps multi-stop routing",
    project: "fleet-intel",
    assignee: "barry",
    status: "done",
    priority: "medium",
    createdAt: FEB_14,
    updatedAt: FEB_19,
    completedAt: FEB_19,
    tags: ["maps", "routing"],
  },
  {
    id: "fleet-export-buttons-mobile",
    title: "Export buttons visible on mobile",
    project: "fleet-intel",
    assignee: "barry",
    status: "done",
    priority: "medium",
    createdAt: FEB_14,
    updatedAt: FEB_19,
    completedAt: FEB_19,
    tags: ["mobile", "ui"],
  },
  {
    id: "fleet-carrier-detail-fullscreen",
    title: "Full-screen expand for carrier detail",
    project: "fleet-intel",
    assignee: "barry",
    status: "done",
    priority: "medium",
    createdAt: FEB_14,
    updatedAt: FEB_19,
    completedAt: FEB_19,
    tags: ["ui", "feature"],
  },
  {
    id: "fleet-merge-facility-scoreboard",
    title: "Merge feature/facility-scoreboard -> main",
    project: "fleet-intel",
    assignee: "barry",
    status: "in-progress",
    priority: "medium",
    createdAt: FEB_17,
    updatedAt: FEB_18,
    tags: ["merge", "release"],
  },
  {
    id: "fleet-batch-enrichment-remaining",
    title: "Batch enrichment: 145/14,472 remaining",
    project: "fleet-intel",
    assignee: "barry",
    status: "in-progress",
    priority: "low",
    createdAt: FEB_16,
    updatedAt: FEB_18,
    tags: ["data", "pipeline"],
  },
  {
    id: "battle-dinghy-state-persistence",
    title: "Game state persistence mechanism",
    project: "battle-dinghy",
    assignee: "barry",
    status: "todo",
    priority: "medium",
    createdAt: FEB_17,
    updatedAt: FEB_18,
    tags: ["backend", "state"],
  },
  {
    id: "battle-dinghy-turn-based-mechanics",
    title: "Turn-based game mechanics",
    project: "battle-dinghy",
    assignee: "barry",
    status: "todo",
    priority: "medium",
    createdAt: FEB_17,
    updatedAt: FEB_18,
    tags: ["gameplay"],
  },
  {
    id: "dc-land-intel-mobile-verification",
    title: "User verification of mobile experience",
    project: "dc-land-intel",
    assignee: "justin",
    status: "todo",
    priority: "high",
    createdAt: FEB_16,
    updatedAt: FEB_18,
    tags: ["mobile", "qa"],
  },
  {
    id: "dc-land-intel-download-datasets",
    title: "Download remaining datasets (HIFLD, RTO queues, USDA)",
    project: "dc-land-intel",
    assignee: "barry",
    status: "in-progress",
    priority: "low",
    createdAt: FEB_16,
    updatedAt: FEB_18,
    tags: ["data", "ingestion"],
  },
  {
    id: "polymarket-resolve-open-positions",
    title: "Resolve open positions - 273 open",
    project: "polymarket",
    assignee: "barry",
    status: "in-progress",
    priority: "low",
    createdAt: FEB_16,
    updatedAt: FEB_18,
    tags: ["ops", "positions"],
  },
  {
    id: "public-data-apply-3q-filter",
    title: "Apply 3-question filter to top niche opportunities",
    project: "public-data",
    assignee: "barry",
    status: "todo",
    priority: "medium",
    createdAt: FEB_17,
    updatedAt: FEB_18,
    tags: ["analysis", "filter"],
  },
  {
    id: "ai-calibration-resume",
    title: "Resume calibration: ChatGPT, Gemini, Claude",
    project: "ai-calibration",
    assignee: "barry",
    status: "todo",
    priority: "low",
    createdAt: FEB_17,
    updatedAt: FEB_18,
    tags: ["evaluation", "llm"],
  },
];

let runtimeTasks: Task[] = [...tasks];

export function getTasks(): Task[] {
  return runtimeTasks;
}

export function createTask(task: Task): Task {
  runtimeTasks = [task, ...runtimeTasks];
  return task;
}

export function updateTask(id: string, updates: Partial<Task>): Task | null {
  const index = runtimeTasks.findIndex((task) => task.id === id);
  if (index === -1) return null;

  const current = runtimeTasks[index];
  const next: Task = { ...current, ...updates, id: current.id };

  if ("completedAt" in updates && updates.completedAt === undefined) {
    delete next.completedAt;
  }
  if ("blockedReason" in updates && updates.blockedReason === undefined) {
    delete next.blockedReason;
  }
  if ("tags" in updates && updates.tags === undefined) {
    delete next.tags;
  }
  if ("description" in updates && updates.description === undefined) {
    delete next.description;
  }

  runtimeTasks = runtimeTasks.map((task) => (task.id === id ? next : task));
  return next;
}
