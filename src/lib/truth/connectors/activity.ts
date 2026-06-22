// Activity connector.
//
// Turns durably-stored pushed updates (src/lib/db.ts -> Postgres) into evidence
// so they appear in the proof feed. A pushed update is TESTIMONY: someone/an agent
// reported that a thing happened. It is recorded faithfully and shown in the feed,
// but it is deliberately NOT wired into any project's health evidence — testimony
// never marks a project verified-healthy (that still requires a live probe / render).
//
// TTL is long: a recorded event ("Barry deployed X at 14:02") is a historical fact,
// not a perishable health check, so it does not go "stale" and never inflates the
// stale-evidence count that drives global status.

import type { ConnectorResult, Evidence } from "../types";
import { getRecentActivities, type ActivityRow } from "../../db";

const ACTIVITY_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days — an event is a fact, not a probe

/** Reported status -> proof-feed marker. Informational only; not a health signal. */
function statusToOk(status: string): boolean | null {
  const s = status.toLowerCase();
  if (["success", "ok", "done", "passed", "complete", "completed"].includes(s)) return true;
  if (["failed", "fail", "error", "broken", "down"].includes(s)) return false;
  return null; // in_progress / info / unknown
}

function rowToEvidence(row: ActivityRow): Evidence {
  const who = row.actor || "mc-push";
  return {
    id: `ev:activity:${row.id}`,
    kind: "manual",
    source: {
      type: "agent",
      label: `Pushed update — ${who}`,
      ref: row.project,
    },
    observedAt: row.ts,
    ttlSeconds: ACTIVITY_TTL_SECONDS,
    summary: row.description,
    detail: `${row.actionType} on ${row.project} (reported "${row.status}" by ${who}). Testimony — recorded as pushed, not independently verified.`,
    ok: statusToOk(row.status),
    raw: row.raw ?? { ...row },
  };
}

/**
 * Build evidence from recently-pushed activity. Pass `rows` explicitly (e.g. [])
 * to stay offline in tests; omit to read from the durable store. A DB/read failure
 * degrades to no evidence — honest "no activity yet", never a fabricated entry.
 */
export async function activityConnector(
  _now: Date = new Date(),
  rows?: ActivityRow[]
): Promise<ConnectorResult> {
  const source = rows ?? (await getRecentActivities(50).catch(() => []));
  return {
    evidence: source.map(rowToEvidence),
    claims: [],
  };
}
