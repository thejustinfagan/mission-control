import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import fs from "node:fs";
import path from "node:path";

export interface ActivityRecord {
  id: string;
  timestamp: string;
  actionType: string;
  description: string;
  project: string;
  status: "success" | "failed" | "pending" | string;
  agentId?: string;
}

type StoreOptions = { path?: string };

const DEFAULT_STORE_PATH = "/tmp/mission-control-activities.json";
const MAX_ACTIVITIES = 200;
const COMMITTED_FALLBACK = path.join(process.cwd(), "src/data/activities.json");

function storePath(options: StoreOptions = {}) {
  return options.path || process.env.MC_ACTIVITIES_STORE_PATH || DEFAULT_STORE_PATH;
}

function readCommittedFallback(): ActivityRecord[] {
  try {
    const raw = fs.readFileSync(COMMITTED_FALLBACK, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function readActivities(options: StoreOptions = {}): Promise<ActivityRecord[]> {
  try {
    const raw = await readFile(storePath(options), "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  return readCommittedFallback();
}

async function writeActivities(activities: ActivityRecord[], options: StoreOptions = {}) {
  const filePath = storePath(options);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(activities, null, 2), "utf8");
}

export async function appendActivity(
  input: Omit<ActivityRecord, "id" | "timestamp"> & { timestamp?: string },
  options: StoreOptions = {}
): Promise<ActivityRecord> {
  const now = input.timestamp ? new Date(input.timestamp) : new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const timeStr = now.getUTCHours().toString().padStart(2, "0");

  const activities = await readActivities(options);
  const todayPrefix = `act_${dateStr}`;
  const todayCount = activities.filter((a) => a.id.startsWith(todayPrefix)).length;

  const record: ActivityRecord = {
    id: `${todayPrefix}${timeStr}_${(todayCount + 1).toString().padStart(3, "0")}`,
    timestamp: now.toISOString(),
    actionType: input.actionType,
    description: input.description,
    project: input.project,
    status: input.status || "success",
    agentId: input.agentId,
  };

  const next = [record, ...activities].slice(0, MAX_ACTIVITIES);
  await writeActivities(next, options);
  return record;
}
