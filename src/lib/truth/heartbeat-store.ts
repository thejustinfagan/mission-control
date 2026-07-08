import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export interface AgentHeartbeatRecord {
  agentId: string;
  observedAt: string;
  ok: boolean;
  currentTask?: string;
  metadata?: Record<string, unknown>;
}

type StoreOptions = { path?: string };

const DEFAULT_STORE_PATH = "/tmp/mission-control-heartbeats.json";
const KNOWN_AGENT_IDS = new Set(["barry", "harry"]);

function storePath(path?: string) {
  return path || process.env.MC_HEARTBEAT_STORE_PATH || DEFAULT_STORE_PATH;
}

export function isKnownAgentId(agentId: string): boolean {
  return KNOWN_AGENT_IDS.has(agentId);
}

export async function readHeartbeats(options: StoreOptions = {}): Promise<AgentHeartbeatRecord[]> {
  try {
    const raw = await readFile(storePath(options.path), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeHeartbeats(records: AgentHeartbeatRecord[], options: StoreOptions = {}) {
  const path = storePath(options.path);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(records, null, 2), "utf8");
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
  const existing = await readHeartbeats(options);
  const next = [record, ...existing.filter((r) => r.agentId !== record.agentId)];
  await writeHeartbeats(next, options);
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
