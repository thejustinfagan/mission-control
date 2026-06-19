import { describe, expect, it } from "vitest";
import { deriveClaims } from "../rules";
import type { Evidence } from "../types";

const now = new Date("2026-06-19T12:00:00Z");

function evidence(overrides: Partial<Evidence>): Evidence {
  return {
    id: "evidence.test",
    sourceType: "static_registry",
    sourceName: "test",
    subjectType: "project",
    subjectId: "mission-control",
    capturedAt: "2026-06-19T11:00:00Z",
    ttlSeconds: 60,
    status: "reported",
    confidence: "low",
    summary: "test evidence",
    ...overrides,
  };
}

describe("truth rules", () => {
  it("expired evidence creates a stale claim", () => {
    const claims = deriveClaims([evidence({})], now);
    expect(claims.some((claim) => claim.status === "stale" && claim.evidenceIds.includes("evidence.test"))).toBe(true);
  });

  it("agent with no heartbeat becomes unknown, not online", () => {
    const barry = deriveClaims([], now).find((claim) => claim.id === "claim.agent.barry.no_fresh_heartbeat");
    expect(barry?.status).toBe("unknown");
    expect(JSON.stringify(barry)).not.toContain("Online");
  });

  it("static registry project does not become verified healthy", () => {
    const claims = deriveClaims([evidence({ id: "evidence.static.project.mission-control", sourceType: "static_registry" })], now);
    const registryClaim = claims.find((claim) => claim.id === "claim.project.mission-control.static_registry");
    expect(registryClaim?.status).toBe("unverified");
    expect(JSON.stringify(registryClaim)).not.toContain("healthy");
  });
});
