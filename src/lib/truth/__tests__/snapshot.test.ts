import { describe, expect, it } from "vitest";
import { normalizeIncomplete } from "../legacy-status";
import { buildMissionControlSnapshot } from "../snapshot";

describe("mission control snapshot", () => {
  it("normalizes legacy incomplete string array to object rows", () => {
    expect(normalizeIncomplete(["Do the thing"])).toEqual([{ project: "Legacy STATUS.md", completed: false, task: "Do the thing" }]);
  });

  it("has needs_justin when Justin queue is non-empty and is JSON serializable", async () => {
    const snapshot = await buildMissionControlSnapshot(new Date("2026-06-19T12:00:00Z"));
    expect(snapshot.justinQueue.length).toBeGreaterThan(0);
    expect(snapshot.globalStatus).toBe("needs_justin");
    expect(JSON.parse(JSON.stringify(snapshot)).globalStatus).toBe("needs_justin");
  });

  it("every visible project/agent/action/incident references evidence IDs or claims", async () => {
    const snapshot = await buildMissionControlSnapshot(new Date("2026-06-19T12:00:00Z"));
    for (const project of snapshot.projects) expect(project.evidenceIds.length).toBeGreaterThan(0);
    for (const agent of snapshot.agents) expect(agent.claimIds.length).toBeGreaterThan(0);
    for (const action of snapshot.justinQueue) expect(action.evidenceIds.length + action.claimIds.length).toBeGreaterThan(0);
    for (const incident of snapshot.incidents) expect(incident.evidenceIds.length + incident.claimIds.length).toBeGreaterThan(0);
  });

  it("contains no Barry Online string unless verified evidence exists", async () => {
    const snapshot = await buildMissionControlSnapshot(new Date("2026-06-19T12:00:00Z"));
    expect(JSON.stringify(snapshot)).not.toContain("Barry Online");
  });

  it("does not report all_clear when evidence is stale or unknown", async () => {
    const snapshot = await buildMissionControlSnapshot(new Date("2026-06-19T12:00:00Z"));
    expect(snapshot.globalStatus).not.toBe("all_clear");
  });
});
