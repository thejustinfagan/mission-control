import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { ActionDecision, ActionDecisionStatus, JustinAction, JustinControlType } from "./types";

type StoreOptions = {
  path?: string;
  now?: Date;
};

type RecordInput = {
  actionId: string;
  controlType: Exclude<JustinControlType, "explain">;
  label: string;
  title: string;
  subject?: string;
};

const DEFAULT_STORE_PATH = "/tmp/mission-control-action-decisions.json";
const RESOLVING_STATUSES = new Set<ActionDecisionStatus>([
  "approved",
  "rejected",
  "deferred",
  "unblocked",
  "verification-requested",
  "assigned",
]);

function storePath(path?: string) {
  return path || process.env.MC_ACTION_DECISIONS_PATH || DEFAULT_STORE_PATH;
}

function statusFor(controlType: Exclude<JustinControlType, "explain">): ActionDecisionStatus {
  switch (controlType) {
    case "approve":
      return "approved";
    case "reject":
      return "rejected";
    case "defer":
      return "deferred";
    case "unblock":
      return "unblocked";
    case "rerun-verification":
      return "verification-requested";
    case "assign-to-agent":
      return "assigned";
    case "view-artifact":
      return "artifact-opened";
  }
}

export async function readActionDecisions(options: StoreOptions = {}): Promise<ActionDecision[]> {
  try {
    const raw = await readFile(storePath(options.path), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeActionDecisions(decisions: ActionDecision[], options: StoreOptions = {}) {
  const path = storePath(options.path);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(decisions, null, 2), "utf8");
}

export async function recordActionDecision(input: RecordInput, options: StoreOptions = {}): Promise<ActionDecision> {
  const decisions = await readActionDecisions(options);
  const decision: ActionDecision = {
    id: `decision:${input.actionId}`,
    actionId: input.actionId,
    controlType: input.controlType,
    status: statusFor(input.controlType),
    label: input.label,
    title: input.title,
    subject: input.subject,
    decidedAt: (options.now || new Date()).toISOString(),
  };
  const next = [decision, ...decisions.filter((existing) => existing.actionId !== input.actionId)];
  await writeActionDecisions(next, options);
  return decision;
}

export function applyActionDecisionsToQueue(actions: JustinAction[], decisions: ActionDecision[]) {
  const resolvingByActionId = new Map(
    decisions.filter((decision) => RESOLVING_STATUSES.has(decision.status)).map((decision) => [decision.actionId, decision])
  );
  const openActions = actions.filter((action) => !resolvingByActionId.has(action.id));
  const appliedDecisions = actions
    .map((action) => resolvingByActionId.get(action.id))
    .filter((decision): decision is ActionDecision => Boolean(decision));
  return { openActions, appliedDecisions };
}
