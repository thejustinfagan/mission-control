import { getDb } from "@/lib/db/sqlite";
import type { ActionDecision, ActionDecisionStatus, JustinAction, JustinControlType } from "./types";

type StoreOptions = {
  dbPath?: string;
  now?: Date;
};

type RecordInput = {
  actionId: string;
  controlType: Exclude<JustinControlType, "explain">;
  label: string;
  title: string;
  subject?: string;
};

const RESOLVING_STATUSES = new Set<ActionDecisionStatus>([
  "approved",
  "rejected",
  "deferred",
  "unblocked",
  "verification-requested",
  "assigned",
]);

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

function rowToDecision(row: {
  id: string;
  action_id: string;
  control_type: string;
  status: string;
  label: string;
  title: string;
  subject: string | null;
  decided_at: string;
}): ActionDecision {
  return {
    id: row.id,
    actionId: row.action_id,
    controlType: row.control_type as Exclude<JustinControlType, "explain">,
    status: row.status as ActionDecisionStatus,
    label: row.label,
    title: row.title,
    subject: row.subject ?? undefined,
    decidedAt: row.decided_at,
  };
}

export async function readActionDecisions(options: StoreOptions = {}): Promise<ActionDecision[]> {
  const db = getDb(options.dbPath);
  const rows = db
    .prepare(
      `SELECT id, action_id, control_type, status, label, title, subject, decided_at
       FROM action_decisions ORDER BY decided_at DESC`
    )
    .all() as Parameters<typeof rowToDecision>[0][];
  return rows.map(rowToDecision);
}

export async function recordActionDecision(
  input: RecordInput,
  options: StoreOptions = {}
): Promise<ActionDecision> {
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

  const db = getDb(options.dbPath);
  db.prepare(`DELETE FROM action_decisions WHERE action_id = ?`).run(input.actionId);
  db.prepare(
    `INSERT INTO action_decisions (id, action_id, control_type, status, label, title, subject, decided_at)
     VALUES (@id, @actionId, @controlType, @status, @label, @title, @subject, @decidedAt)`
  ).run({
    id: decision.id,
    actionId: decision.actionId,
    controlType: decision.controlType,
    status: decision.status,
    label: decision.label,
    title: decision.title,
    subject: decision.subject ?? null,
    decidedAt: decision.decidedAt,
  });

  return decision;
}

export function applyActionDecisionsToQueue(actions: JustinAction[], decisions: ActionDecision[]) {
  const resolvingByActionId = new Map(
    decisions
      .filter((decision) => RESOLVING_STATUSES.has(decision.status))
      .map((decision) => [decision.actionId, decision])
  );
  const openActions = actions.filter((action) => !resolvingByActionId.has(action.id));
  const appliedDecisions = actions
    .map((action) => resolvingByActionId.get(action.id))
    .filter((decision): decision is ActionDecision => Boolean(decision));
  return { openActions, appliedDecisions };
}
