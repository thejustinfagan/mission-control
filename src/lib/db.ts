// Durable storage for Mission Control.
//
// Backed by Postgres (Railway provides DATABASE_URL). This is the ONLY durable
// store — never /tmp, which Railway wipes on every redeploy and does not share
// across instances. When DATABASE_URL is absent (local dev, tests, or a misconfigured
// deploy) every function degrades honestly: reads return [], writes throw a clear
// "not configured" error. We never silently pretend a write succeeded.

import { Pool } from "pg";

export interface ActivityInput {
  actionType: string;
  description: string;
  project: string;
  /** success | failed | in_progress | info — reported outcome, not verified. */
  status?: string;
  /** Who pushed it, e.g. "barry-cli", "mc-push". */
  actor?: string;
  raw?: unknown;
}

export interface ActivityRow {
  id: string;
  /** ISO-8601. */
  ts: string;
  actionType: string;
  description: string;
  project: string;
  status: string;
  actor: string | null;
  raw: unknown;
}

let pool: Pool | null = null;
let schemaReady: Promise<void> | null = null;

export function isDbConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}

function getPool(): Pool | null {
  if (!isDbConfigured()) return null;
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  // Railway's private network (*.railway.internal) does not use TLS; the public
  // proxy does. Default to permissive TLS off the private network, and let
  // DATABASE_SSL=disable force it off (e.g. a local Postgres).
  const sslDisabled = process.env.DATABASE_SSL === "disable";
  const isInternal = !!connectionString && connectionString.includes("railway.internal");
  pool = new Pool({
    connectionString,
    ssl: sslDisabled || isInternal ? undefined : { rejectUnauthorized: false },
    max: 4,
    connectionTimeoutMillis: 5000,
  });
  return pool;
}

/** Create the activities table once per process. Safe to call repeatedly. */
export function ensureSchema(): Promise<void> {
  const p = getPool();
  if (!p) return Promise.resolve();
  if (schemaReady) return schemaReady;
  schemaReady = p
    .query(
      `CREATE TABLE IF NOT EXISTS activities (
         id          TEXT PRIMARY KEY,
         ts          TIMESTAMPTZ NOT NULL DEFAULT now(),
         action_type TEXT NOT NULL,
         description TEXT NOT NULL,
         project     TEXT NOT NULL,
         status      TEXT NOT NULL DEFAULT 'info',
         actor       TEXT,
         raw         JSONB
       );
       CREATE INDEX IF NOT EXISTS activities_ts_idx ON activities (ts DESC);`
    )
    .then(() => undefined)
    .catch((err) => {
      // Reset so a later call can retry rather than caching a failed promise.
      schemaReady = null;
      throw err;
    });
  return schemaReady;
}

function rowToActivity(r: Record<string, unknown>): ActivityRow {
  const ts = r.ts;
  return {
    id: String(r.id),
    ts: ts instanceof Date ? ts.toISOString() : String(ts),
    actionType: String(r.action_type),
    description: String(r.description),
    project: String(r.project),
    status: String(r.status),
    actor: r.actor == null ? null : String(r.actor),
    raw: r.raw ?? null,
  };
}

/** Insert one activity. Throws if the DB is not configured — never a fake success. */
export async function insertActivity(input: ActivityInput): Promise<ActivityRow> {
  const p = getPool();
  if (!p) {
    throw new Error(
      "Mission Control database is not configured (DATABASE_URL is unset). The update was NOT stored."
    );
  }
  await ensureSchema();
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const id = `act_${dateStr}_${now.getTime()}_${Math.random().toString(36).slice(2, 6)}`;
  const status = input.status || "info";
  const res = await p.query(
    `INSERT INTO activities (id, ts, action_type, description, project, status, actor, raw)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, ts, action_type, description, project, status, actor, raw`,
    [
      id,
      now.toISOString(),
      input.actionType,
      input.description,
      input.project,
      status,
      input.actor ?? null,
      input.raw == null ? null : JSON.stringify(input.raw),
    ]
  );
  return rowToActivity(res.rows[0]);
}

/** Most recent activities, newest first. Returns [] when the DB is unconfigured. */
export async function getRecentActivities(limit = 50): Promise<ActivityRow[]> {
  const p = getPool();
  if (!p) return [];
  await ensureSchema();
  const res = await p.query(
    `SELECT id, ts, action_type, description, project, status, actor, raw
       FROM activities
      ORDER BY ts DESC
      LIMIT $1`,
    [limit]
  );
  return res.rows.map(rowToActivity);
}
