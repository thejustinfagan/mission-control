import { getDb, getDbPath } from "@/lib/db/sqlite";

export interface AgentHeartbeatRecord {
  agentId: string;
  observedAt: string;
  ok: boolean;
  currentTask?: string;
  metadata?: Record<string, unknown>;
}

type StoreOptions = { dbPath?: string };

const KNOWN_AGENT_IDS = new Set(["barry", "harry"]);

export function isKnownAgentId(agentId: string): boolean {
  return KNOWN_AGENT_IDS.has(agentId);
}

function dbPath(options: StoreOptions = {}) {
  return getDbPath(options.dbPath);
}

export async function readHeartbeats(options: StoreOptions = {}): Promise<AgentHeartbeatRecord[]> {
  const db = getDb(options.dbPath);
  const rows = db
    .prepare(
      `SELECT agent_id, observed_at, ok, current_task, metadata FROM heartbeats ORDER BY observed_at DESC`
    )
    .all() as {
    agent_id: string;
    observed_at: string;
    ok: number;
    current_task: string | null;
    metadata: string | null;
  }[];

  return rows.map((row) => ({
    agentId: row.agent_id,
    observedAt: row.observed_at,
    ok: row.ok === 1,
    currentTask: row.current_task ?? undefined,
    metadata: row.metadata ? (JSON.parse(row.metadata) as Record<string, unknown>) : undefined,
  }));
}

export async function recordHeartbeat(
  input: Omit<AgentHeartbeatRecord, "observedAt"> & { observedAt?: string },
  options: StoreOptions = {}
): Promise<AgentHeartbeatRecord> {
  if (!isKnownAgentId(input.agentId)) {
    throw new Error(`Unknown agentId: ${input.agentId}`);
  }
  const record: AgentHeartbeatRecord = {
    agentId: input.agentId,
    observedAt: input.observedAt ?? new Date().toISOString(),
    ok: input.ok !== false,
    currentTask: input.currentTask,
    metadata: input.metadata,
  };

  const db = getDb(options.dbPath);
  db.prepare(
    `INSERT INTO heartbeats (agent_id, observed_at, ok, current_task, metadata)
     VALUES (@agentId, @observedAt, @ok, @currentTask, @metadata)
     ON CONFLICT(agent_id) DO UPDATE SET
       observed_at = excluded.observed_at,
       ok = excluded.ok,
       current_task = excluded.current_task,
       metadata = excluded.metadata`
  ).run({
    agentId: record.agentId,
    observedAt: record.observedAt,
    ok: record.ok ? 1 : 0,
    currentTask: record.currentTask ?? null,
    metadata: record.metadata ? JSON.stringify(record.metadata) : null,
  });

  return record;
}

/** Latest heartbeat per agent (most recent observedAt wins). */
export function latestHeartbeatsByAgent(records: AgentHeartbeatRecord[]): Map<string, AgentHeartbeatRecord> {
  const byAgent = new Map<string, AgentHeartbeatRecord>();
  for (const record of records) {
    const prev = byAgent.get(record.agentId);
    if (!prev || record.observedAt > prev.observedAt) {
      byAgent.set(record.agentId, record);
    }
  }
  return byAgent;
}

// Re-export for tests that assert store path resolution
export { dbPath as heartbeatDbPath };
