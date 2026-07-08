import fs from "node:fs";
import path from "node:path";
import { getDb } from "@/lib/db/sqlite";

export interface ActivityRecord {
  id: string;
  timestamp: string;
  actionType: string;
  description: string;
  project: string;
  status: "success" | "failed" | "pending" | string;
  agentId?: string;
}

type StoreOptions = { dbPath?: string };

const MAX_ACTIVITIES = 200;
const COMMITTED_FALLBACK = path.join(process.cwd(), "src/data/activities.json");

function readCommittedFallback(): ActivityRecord[] {
  try {
    const raw = fs.readFileSync(COMMITTED_FALLBACK, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function rowToActivity(row: {
  id: string;
  timestamp: string;
  action_type: string;
  description: string;
  project: string;
  status: string;
  agent_id: string | null;
}): ActivityRecord {
  return {
    id: row.id,
    timestamp: row.timestamp,
    actionType: row.action_type,
    description: row.description,
    project: row.project,
    status: row.status,
    agentId: row.agent_id ?? undefined,
  };
}

export async function readActivities(options: StoreOptions = {}): Promise<ActivityRecord[]> {
  const db = getDb(options.dbPath);
  const count = db.prepare(`SELECT COUNT(*) as c FROM activities`).get() as { c: number };

  if (count.c === 0) {
    const fallback = readCommittedFallback();
    if (fallback.length > 0) {
      const insert = db.prepare(
        `INSERT OR IGNORE INTO activities (id, timestamp, action_type, description, project, status, agent_id)
         VALUES (@id, @timestamp, @actionType, @description, @project, @status, @agentId)`
      );
      for (const activity of fallback.slice(0, MAX_ACTIVITIES)) {
        insert.run({
          id: activity.id,
          timestamp: activity.timestamp,
          actionType: activity.actionType,
          description: activity.description,
          project: activity.project,
          status: activity.status,
          agentId: activity.agentId ?? null,
        });
      }
      return fallback.slice(0, MAX_ACTIVITIES);
    }
    return [];
  }

  const rows = db
    .prepare(
      `SELECT id, timestamp, action_type, description, project, status, agent_id
       FROM activities ORDER BY timestamp DESC LIMIT ?`
    )
    .all(MAX_ACTIVITIES) as Parameters<typeof rowToActivity>[0][];

  return rows.map(rowToActivity);
}

export async function appendActivity(
  input: Omit<ActivityRecord, "id" | "timestamp"> & { id?: string; timestamp?: string },
  options: StoreOptions = {}
): Promise<ActivityRecord> {
  const now = input.timestamp ? new Date(input.timestamp) : new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const timeStr = now.getUTCHours().toString().padStart(2, "0");

  const db = getDb(options.dbPath);
  const todayPrefix = `act_${dateStr}`;
  const todayCount = (
    db.prepare(`SELECT COUNT(*) as c FROM activities WHERE id LIKE ?`).get(`${todayPrefix}%`) as {
      c: number;
    }
  ).c;

  const record: ActivityRecord = {
    id: input.id ?? `${todayPrefix}${timeStr}_${(todayCount + 1).toString().padStart(3, "0")}`,
    timestamp: now.toISOString(),
    actionType: input.actionType,
    description: input.description,
    project: input.project,
    status: input.status || "success",
    agentId: input.agentId,
  };

  db.prepare(
    `INSERT OR REPLACE INTO activities (id, timestamp, action_type, description, project, status, agent_id)
     VALUES (@id, @timestamp, @actionType, @description, @project, @status, @agentId)`
  ).run({
    id: record.id,
    timestamp: record.timestamp,
    actionType: record.actionType,
    description: record.description,
    project: record.project,
    status: record.status,
    agentId: record.agentId ?? null,
  });

  // Trim old rows
  db.prepare(
    `DELETE FROM activities WHERE id NOT IN (
       SELECT id FROM activities ORDER BY timestamp DESC LIMIT ?
     )`
  ).run(MAX_ACTIVITIES);

  return record;
}
