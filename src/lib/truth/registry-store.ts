import { getDb } from "@/lib/db/sqlite";
import { loadRegistry, type RegistryProject } from "./registry";
import type { Project } from "@/data/projects";

export interface RegistryPushUpdate {
  projectId: string;
  claimedStatus?: string;
  lastWorked?: string;
  blockers?: string[];
  tagline?: string;
  liveUrl?: string;
  stage?: Project["stage"];
}

export interface RegistryPushRecord extends RegistryPushUpdate {
  pushedAt: string;
  pushedBy: string;
}

type StoreOptions = { dbPath?: string };

export function pushRegistryUpdate(
  update: RegistryPushUpdate,
  pushedBy = "barry",
  options: StoreOptions = {}
): RegistryPushRecord {
  const db = getDb(options.dbPath);
  const pushedAt = new Date().toISOString();
  const record: RegistryPushRecord = {
    ...update,
    pushedAt,
    pushedBy,
  };
  db.prepare(
    `INSERT INTO agent_registry_pushes (project_id, pushed_at, pushed_by, payload_json)
     VALUES (@projectId, @pushedAt, @pushedBy, @payload)
     ON CONFLICT(project_id) DO UPDATE SET
       pushed_at = excluded.pushed_at,
       pushed_by = excluded.pushed_by,
       payload_json = excluded.payload_json`
  ).run({
    projectId: update.projectId,
    pushedAt,
    pushedBy,
    payload: JSON.stringify(record),
  });
  return record;
}

export function readRegistryPushes(options: StoreOptions = {}): RegistryPushRecord[] {
  const db = getDb(options.dbPath);
  const rows = db
    .prepare(`SELECT payload_json FROM agent_registry_pushes ORDER BY pushed_at DESC`)
    .all() as { payload_json: string }[];
  return rows.map((r) => JSON.parse(r.payload_json) as RegistryPushRecord);
}

export function readRegistryPushMap(options: StoreOptions = {}): Map<string, RegistryPushRecord> {
  const map = new Map<string, RegistryPushRecord>();
  for (const record of readRegistryPushes(options)) {
    if (!map.has(record.projectId)) {
      map.set(record.projectId, record);
    }
  }
  return map;
}

/** Merge committed registry with latest agent pushes. Agent testimony wins for pushed fields. */
export function loadEffectiveRegistry(options: StoreOptions = {}): RegistryProject[] {
  const base = loadRegistry();
  const pushes = readRegistryPushMap(options);

  return base.map((project) => {
    const push = pushes.get(project.id);
    if (!push) return project;

    return {
      ...project,
      claimedStatus: push.claimedStatus ?? project.claimedStatus,
      lastWorked: push.lastWorked ?? project.lastWorked,
      blockers: push.blockers ?? project.blockers,
      tagline: push.tagline ?? project.tagline,
      liveUrl: push.liveUrl ?? project.liveUrl,
      stage: push.stage ?? project.stage,
    };
  });
}

export function saveAgentStatusSnapshot(payload: unknown, options: StoreOptions = {}): string {
  const db = getDb(options.dbPath);
  const pushedAt = new Date().toISOString();
  const json = JSON.stringify({ ...payload as object, timestamp: pushedAt });
  db.prepare(`DELETE FROM agent_status_snapshot`).run();
  db.prepare(`INSERT INTO agent_status_snapshot (id, pushed_at, payload_json) VALUES (1, ?, ?)`).run(
    pushedAt,
    json
  );
  return pushedAt;
}

export function readAgentStatusSnapshot(options: StoreOptions = {}): Record<string, unknown> | null {
  const db = getDb(options.dbPath);
  const row = db
    .prepare(`SELECT payload_json FROM agent_status_snapshot WHERE id = 1`)
    .get() as { payload_json: string } | undefined;
  if (!row) return null;
  return JSON.parse(row.payload_json) as Record<string, unknown>;
}
