import { describe, it, expect } from "vitest";
import { activityConnector } from "../connectors/activity";
import { buildMissionControlSnapshot } from "../snapshot";
import type { ActivityRow } from "../../db";

const NOW = new Date("2026-06-22T12:00:00.000Z");

function row(partial: Partial<ActivityRow> & { id: string; description: string }): ActivityRow {
  return {
    ts: NOW.toISOString(),
    actionType: "deploy",
    project: "mission-control",
    status: "success",
    actor: "barry-cli",
    raw: null,
    ...partial,
  };
}

describe("activityConnector", () => {
  it("turns pushed activity rows into manual/agent evidence", async () => {
    const rows = [row({ id: "a1", description: "Deployed Mission Control v2" })];
    const { evidence, claims } = await activityConnector(NOW, rows);

    expect(evidence).toHaveLength(1);
    const e = evidence[0];
    expect(e.id).toBe("ev:activity:a1");
    expect(e.kind).toBe("manual");
    expect(e.source.type).toBe("agent");
    expect(e.summary).toBe("Deployed Mission Control v2");
    // Produces no claims — activity is testimony for the feed, not a health claim.
    expect(claims).toHaveLength(0);
  });

  it("maps reported status to a feed marker without inventing pass/fail", async () => {
    const { evidence } = await activityConnector(NOW, [
      row({ id: "ok", description: "x", status: "success" }),
      row({ id: "bad", description: "y", status: "failed" }),
      row({ id: "mid", description: "z", status: "in_progress" }),
    ]);
    expect(evidence.find((e) => e.id === "ev:activity:ok")?.ok).toBe(true);
    expect(evidence.find((e) => e.id === "ev:activity:bad")?.ok).toBe(false);
    expect(evidence.find((e) => e.id === "ev:activity:mid")?.ok).toBeNull();
  });

  it("returns nothing for an empty store (honest: no activity yet)", async () => {
    const { evidence } = await activityConnector(NOW, []);
    expect(evidence).toHaveLength(0);
  });
});

describe("snapshot surfaces pushed activity in the proof feed", () => {
  it("shows injected activity rows in the proof feed, newest first", async () => {
    const snapshot = await buildMissionControlSnapshot({
      now: NOW,
      probeTargets: [], // stay offline
      localTargets: [],
      activityRows: [
        row({ id: "old", description: "older event", ts: "2026-06-22T10:00:00.000Z" }),
        row({ id: "new", description: "newest event", ts: "2026-06-22T11:59:00.000Z" }),
      ],
    });

    const activityItems = snapshot.proofFeed.filter((p) => p.evidenceId.startsWith("ev:activity:"));
    expect(activityItems.length).toBe(2);
    // Newest first.
    expect(activityItems[0].title).toBe("newest event");
    // Recorded activity is fresh (long TTL) — it is a fact, not a perishable probe.
    expect(activityItems[0].freshness.state).toBe("fresh");
  });

  it("pushed activity never marks a project verified-healthy", async () => {
    const snapshot = await buildMissionControlSnapshot({
      now: NOW,
      probeTargets: [],
      localTargets: [],
      activityRows: [row({ id: "deploy1", description: "deployed", status: "success" })],
    });
    // Testimony does not flip any project to verified.
    expect(snapshot.projects.every((p) => p.verified === false)).toBe(true);
  });
});
