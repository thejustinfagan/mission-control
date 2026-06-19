import { describe, it, expect } from "vitest";
import { buildMissionControlSnapshot } from "../snapshot";

const NOW = new Date("2026-06-19T12:00:00Z");

describe("buildMissionControlSnapshot", () => {
  it("produces a fully serializable JSON snapshot", async () => {
    const snapshot = await buildMissionControlSnapshot({ now: NOW, probeTargets: [], localTargets: [] });
    const roundTripped = JSON.parse(JSON.stringify(snapshot));
    expect(roundTripped.generatedAt).toBe(snapshot.generatedAt);
    expect(roundTripped).toEqual(snapshot);
  });

  it("exposes every required top-level field", async () => {
    const s = await buildMissionControlSnapshot({ now: NOW, probeTargets: [], localTargets: [] });
    for (const key of [
      "generatedAt",
      "globalStatus",
      "summary",
      "freshness",
      "actionDecisions",
      "justinQueue",
      "agents",
      "projects",
      "incidents",
      "proofCards",
      "proofFeed",
      "claims",
      "evidence",
    ]) {
      expect(s).toHaveProperty(key);
    }
  });

  it("renders every agent as Unknown (no heartbeat), never Online", async () => {
    const s = await buildMissionControlSnapshot({ now: NOW, probeTargets: [], localTargets: [] });
    expect(s.agents.length).toBeGreaterThan(0);
    for (const agent of s.agents) {
      expect(agent.status).toBe("unknown");
      expect(agent.statusLabel).not.toMatch(/online/i);
    }
  });

  it("never contains the string 'Barry Online' without fresh verified evidence", async () => {
    const s = await buildMissionControlSnapshot({ now: NOW, probeTargets: [], localTargets: [] });
    const json = JSON.stringify(s);
    // No Barry heartbeat evidence exists, so the literal must never appear.
    expect(json).not.toMatch(/Barry Online/i);
  });

  it("never claims to be 'Live from STATUS.md'", async () => {
    const s = await buildMissionControlSnapshot({ now: NOW, probeTargets: [], localTargets: [] });
    expect(JSON.stringify(s)).not.toMatch(/Live from STATUS\.md/i);
  });

  it("does not report any project as verified healthy from registry data alone", async () => {
    const s = await buildMissionControlSnapshot({ now: NOW, probeTargets: [], localTargets: [] });
    expect(s.summary.verifiedHealthy).toBe(0);
    for (const p of s.projects) {
      expect(p.verified).toBe(false);
      expect(p.state).not.toBe("healthy");
    }
  });

  it("global status is not all_clear when evidence is unknown/stale", async () => {
    const s = await buildMissionControlSnapshot({ now: NOW, probeTargets: [], localTargets: [] });
    expect(s.globalStatus.level).not.toBe("all_clear");
  });

  it("every project, agent, incident, and action references claim/evidence ids", async () => {
    const s = await buildMissionControlSnapshot({ now: NOW, probeTargets: [], localTargets: [] });
    for (const p of s.projects) {
      expect(p.claimIds.length).toBeGreaterThan(0);
      expect(p.evidenceIds.length).toBeGreaterThan(0);
    }
    for (const a of s.agents) {
      expect(a.claimIds.length).toBeGreaterThan(0);
    }
    for (const inc of s.incidents) {
      expect(inc.evidenceIds.length).toBeGreaterThan(0);
    }
    for (const act of s.justinQueue) {
      expect(act.claimIds.length).toBeGreaterThan(0);
      expect(act.evidenceIds.length).toBeGreaterThan(0);
      expect(act.controls.length).toBeGreaterThan(0);
    }
  });

  it("has no undefined or blank-titled entries", async () => {
    const s = await buildMissionControlSnapshot({ now: NOW, probeTargets: [], localTargets: [] });
    for (const p of s.projects) expect(p.name.trim().length).toBeGreaterThan(0);
    for (const act of s.justinQueue) expect(act.title.trim().length).toBeGreaterThan(0);
    for (const inc of s.incidents) expect(inc.title.trim().length).toBeGreaterThan(0);
    for (const item of s.proofFeed) expect(item.title.trim().length).toBeGreaterThan(0);
  });

  it("creates proof cards with the required autonomous-run proof slots", async () => {
    const s = await buildMissionControlSnapshot({ now: NOW, probeTargets: [], localTargets: [] });
    const projectIds = new Set(s.projects.map((p) => p.id));

    expect(s.proofCards.length).toBe(s.projects.length);
    for (const card of s.proofCards) {
      expect(projectIds.has(card.projectId)).toBe(true);
      expect(card.requiredSlots).toEqual([
        "change",
        "repo",
        "branch",
        "commit",
        "tests",
        "deploy",
        "liveVerification",
        "blocker",
        "nextAction",
      ]);
      expect(card.slots.change.label).toBe("What changed");
      expect(card.slots.tests.label).toBe("Tests run");
      expect(card.slots.liveVerification.label).toBe("Live verification");
      expect(card.claimIds.length + card.evidenceIds.length).toBeGreaterThan(0);
      expect(card.status).not.toBe("verified");
    }
  });

  it("drives the non-green global status off unknown health claims", async () => {
    // Registry existence evidence is re-observed on every read, so it never goes
    // stale (it only proves the project EXISTS). The truth that keeps us off
    // green is the absence of fresh HEALTH evidence: unknown health claims.
    const s = await buildMissionControlSnapshot({ now: NOW, probeTargets: [], localTargets: [] });
    expect(s.freshness.unknownClaims).toBeGreaterThan(0);
    const healthClaims = s.claims.filter((c) => c.id.startsWith("cl:health:"));
    expect(healthClaims.length).toBeGreaterThan(0);
    expect(healthClaims.every((c) => c.status === "unverified")).toBe(true);
  });
});
