import { describe, it, expect } from "vitest";
import { buildFallbackSweep, parseSweepJson } from "@/lib/ai/sweep-prompt";
import type { MissionControlSnapshot } from "@/lib/truth/types";
import { saveSweepReport, readLatestSweep } from "@/lib/truth/sweep-store";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { closeDb } from "@/lib/db/sqlite";

const MINIMAL: MissionControlSnapshot = {
  generatedAt: "2026-07-08T03:00:00.000Z",
  globalStatus: {
    level: "attention",
    label: "Attention",
    rationale: "Gaps remain.",
    claimIds: [],
    evidenceIds: [],
  },
  summary: {
    totalProjects: 1,
    verifiedHealthy: 0,
    degraded: 0,
    unknown: 1,
    openIncidents: 0,
    justinActions: 1,
    definitions: {},
  },
  freshness: {
    freshEvidence: 0,
    staleEvidence: 0,
    unknownClaims: 1,
    oldestEvidenceAt: null,
    newestEvidenceAt: null,
  },
  actionDecisions: [],
  justinQueue: [],
  agents: [{ id: "barry", name: "Barry", role: "x", status: "unknown", statusLabel: "Unknown", lastHeartbeatAt: null, freshness: { state: "unknown", observedAt: null, ttlSeconds: null, ageSeconds: null, expiresAt: null }, claimIds: [], evidenceIds: [] }],
  projects: [{ id: "fleet-intel", name: "Fleet Intel", state: "unknown", stateLabel: "Unknown", summary: "x", verified: false, claimIds: [], evidenceIds: [] }],
  incidents: [],
  proofCards: [],
  proofFeed: [],
  claims: [],
  evidence: [],
};

describe("buildFallbackSweep", () => {
  it("returns stale projects and os critique", () => {
    const sweep = buildFallbackSweep(MINIMAL);
    expect(sweep.aiGenerated).toBe(false);
    expect(sweep.staleProjects.length).toBeGreaterThan(0);
    expect(sweep.osCritique).toMatch(/heartbeat/i);
  });
});

describe("sweep-store", () => {
  it("persists and reads latest sweep", async () => {
    const dir = await mkdtemp(join(tmpdir(), "mc-sweep-"));
    const dbPath = join(dir, "test.db");
    const report = buildFallbackSweep(MINIMAL);
    await saveSweepReport(report, { dbPath });
    const latest = await readLatestSweep({ dbPath });
    expect(latest?.headline).toBe(report.headline);
    closeDb(dbPath);
    await rm(dir, { recursive: true });
  });
});

describe("parseSweepJson", () => {
  it("parses AI JSON", () => {
    const raw = JSON.stringify({
      headline: "Sweep ok",
      overallAssessment: "Fine.",
      staleProjects: [],
      risks: [],
      promote: [],
      pause: [],
      kill: [],
      nextActions: [],
      osCritique: "Keep going.",
    });
    const parsed = parseSweepJson(raw, MINIMAL);
    expect(parsed.aiGenerated).toBe(true);
    expect(parsed.headline).toBe("Sweep ok");
  });
});
