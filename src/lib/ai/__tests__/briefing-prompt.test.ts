import { describe, it, expect } from "vitest";
import {
  buildSnapshotDigest,
  buildFallbackBriefing,
  parseBriefingJson,
} from "../briefing-prompt";
import type { MissionControlSnapshot } from "@/lib/truth/types";

const MINIMAL_SNAPSHOT: MissionControlSnapshot = {
  generatedAt: "2026-07-08T12:00:00.000Z",
  globalStatus: {
    level: "attention",
    label: "Attention needed",
    rationale: "Most projects lack fresh health evidence.",
    claimIds: [],
    evidenceIds: [],
  },
  summary: {
    totalProjects: 2,
    verifiedHealthy: 0,
    degraded: 0,
    unknown: 2,
    openIncidents: 1,
    justinActions: 2,
    definitions: {},
  },
  freshness: {
    freshEvidence: 1,
    staleEvidence: 0,
    unknownClaims: 3,
    oldestEvidenceAt: "2026-07-08T11:00:00.000Z",
    newestEvidenceAt: "2026-07-08T12:00:00.000Z",
  },
  actionDecisions: [],
  justinQueue: [
    {
      id: "act:1",
      kind: "approval",
      title: "Merge PR #3",
      detail: "Battle Dinghy",
      priority: "high",
      controls: [],
      claimIds: [],
      evidenceIds: [],
    },
  ],
  agents: [
    {
      id: "barry",
      name: "Barry",
      role: "Build agent",
      status: "unknown",
      statusLabel: "Unknown — no heartbeat",
      lastHeartbeatAt: null,
      freshness: { state: "unknown", observedAt: null, ttlSeconds: null, ageSeconds: null, expiresAt: null },
      claimIds: [],
      evidenceIds: [],
    },
  ],
  projects: [
    {
      id: "battle-dinghy",
      name: "Battle Dinghy",
      state: "unknown",
      stateLabel: "Unknown",
      summary: "Twitter bot",
      verified: false,
      claimIds: [],
      evidenceIds: [],
    },
  ],
  incidents: [
    {
      id: "inc:1",
      title: "Beast Mode: CI minutes exhausted",
      severity: "high",
      state: "open",
      detail: "Registry blocker",
      claimIds: [],
      evidenceIds: [],
    },
  ],
  proofCards: [],
  proofFeed: [],
  claims: [],
  evidence: [],
};

describe("buildSnapshotDigest", () => {
  it("includes global status and project names", () => {
    const digest = buildSnapshotDigest(MINIMAL_SNAPSHOT);
    expect(digest).toContain("Attention needed");
    expect(digest).toContain("Battle Dinghy");
    expect(digest).toContain("Merge PR #3");
    expect(digest).toContain("CI minutes exhausted");
  });
});

describe("buildFallbackBriefing", () => {
  it("returns 9 north-star sections without AI", () => {
    const briefing = buildFallbackBriefing(MINIMAL_SNAPSHOT);
    expect(briefing.aiGenerated).toBe(false);
    expect(briefing.sections).toHaveLength(9);
    expect(briefing.sections.map((s) => s.id)).toContain("needs-justin");
    expect(briefing.sections.find((s) => s.id === "needs-justin")?.answer).toContain("Merge PR #3");
  });

  it("mentions missing agent heartbeat", () => {
    const briefing = buildFallbackBriefing(MINIMAL_SNAPSHOT);
    const agentSection = briefing.sections.find((s) => s.id === "agent-progress");
    expect(agentSection?.answer).toMatch(/heartbeat/i);
  });
});

describe("parseBriefingJson", () => {
  it("parses valid AI JSON", () => {
    const raw = JSON.stringify({
      headline: "Test headline",
      overallAssessment: "All good.",
      sections: [{ id: "moving", question: "What is moving?", answer: "Nothing.", priority: "low" }],
      recommendations: ["Wire heartbeat"],
    });
    const briefing = parseBriefingJson(raw, MINIMAL_SNAPSHOT);
    expect(briefing.aiGenerated).toBe(true);
    expect(briefing.headline).toBe("Test headline");
    expect(briefing.recommendations).toEqual(["Wire heartbeat"]);
  });

  it("strips markdown fences", () => {
    const raw = '```json\n{"headline":"Hi","overallAssessment":"Ok","sections":[],"recommendations":[]}\n```';
    const briefing = parseBriefingJson(raw, MINIMAL_SNAPSHOT);
    expect(briefing.headline).toBe("Hi");
  });
});
