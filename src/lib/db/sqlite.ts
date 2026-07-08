// SQLite persistence for Mission Control runtime state.
// Single DB file on Railway (/tmp by default). better-sqlite3 is sync — wrap at call sites.

import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DEFAULT_DB_PATH = "/tmp/mission-control.db";

const dbByPath = new Map<string, Database.Database>();

export function getDbPath(override?: string): string {
  return override || process.env.MC_DB_PATH || DEFAULT_DB_PATH;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS heartbeats (
      agent_id TEXT PRIMARY KEY,
      observed_at TEXT NOT NULL,
      ok INTEGER NOT NULL DEFAULT 1,
      current_task TEXT,
      metadata TEXT
    );

    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      action_type TEXT NOT NULL,
      description TEXT NOT NULL,
      project TEXT NOT NULL,
      status TEXT NOT NULL,
      agent_id TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_activities_ts ON activities(timestamp DESC);

    CREATE TABLE IF NOT EXISTS action_decisions (
      id TEXT PRIMARY KEY,
      action_id TEXT NOT NULL,
      control_type TEXT NOT NULL,
      status TEXT NOT NULL,
      label TEXT NOT NULL,
      title TEXT NOT NULL,
      subject TEXT,
      decided_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_decisions_action ON action_decisions(action_id);

    CREATE TABLE IF NOT EXISTS sweep_reports (
      id TEXT PRIMARY KEY,
      generated_at TEXT NOT NULL,
      report_json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sweep_ts ON sweep_reports(generated_at DESC);

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      project TEXT NOT NULL,
      assignee TEXT NOT NULL,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT,
      blocked_reason TEXT,
      tags TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_updated ON tasks(updated_at DESC);
  `);
}

export function getDb(dbPathOverride?: string): Database.Database {
  const path = getDbPath(dbPathOverride);
  let db = dbByPath.get(path);
  if (!db) {
    mkdirSync(dirname(path), { recursive: true });
    db = new Database(path);
    db.pragma("journal_mode = WAL");
    migrate(db);
    dbByPath.set(path, db);
  }
  return db;
}

/** Close and drop a DB handle (tests only). */
export function closeDb(dbPathOverride?: string) {
  const path = getDbPath(dbPathOverride);
  const db = dbByPath.get(path);
  if (db) {
    db.close();
    dbByPath.delete(path);
  }
}
