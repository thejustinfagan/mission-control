import { describe, it, expect } from "vitest";
import {
  claimStatusFromEvidence,
  deriveAgentStatus,
  deriveProjectState,
  deriveGlobalStatus,
} from "../rules";
import type { Evidence, ProjectStatus } from "../types";

const NOW = new Date("2026-06-19T12:00:00Z");

function ev(partial: Partial<Evidence>): Evidence {
  return {
    id: partial.id ?? "ev:test",
    kind: partial.kind ?? "http-probe",
    source: partial.source ?? { type: "http", label: "test" },
    observedAt: partial.observedAt ?? "2026-06-19T11:59:00Z",
    ttlSeconds: partial.ttlSeconds ?? 300,
    summary: partial.summary ?? "test",
    ok: partial.ok ?? null,
  };
}

describe("claimStatusFromEvidence", () => {
  it("is unknown with no evidence", () => {
    expect(claimStatusFromEvidence([], NOW)).toBe("unknown");
  });
  it("is stale when all evidence expired", () => {
    expect(claimStatusFromEvidence([ev({ observedAt: "2026-06-19T10:00:00Z", ttlSeconds: 60 })], NOW)).toBe("stale");
  });
  it("is verified with fresh passing evidence", () => {
    expect(claimStatusFromEvidence([ev({ ok: true })], NOW)).toBe("verified");
  });
  it("is unverified with fresh non-pass/fail evidence", () => {
    expect(claimStatusFromEvidence([ev({ ok: null })], NOW)).toBe("unverified");
  });
});

describe("deriveAgentStatus — no heartbeat is unknown, not online", () => {
  it("returns unknown when there is no heartbeat", () => {
    const r = deriveAgentStatus(null, NOW);
    expect(r.status).toBe("unknown");
    expect(r.label).not.toMatch(/online/i);
  });
  it("returns offline for a stale heartbeat", () => {
    const r = deriveAgentStatus(ev({ kind: "agent-heartbeat", observedAt: "2026-06-19T10:00:00Z", ttlSeconds: 120, ok: true }), NOW);
    expect(r.status).toBe("offline");
  });
  it("returns online only for a fresh passing heartbeat", () => {
    const r = deriveAgentStatus(ev({ kind: "agent-heartbeat", observedAt: "2026-06-19T11:59:30Z", ttlSeconds: 120, ok: true }), NOW);
    expect(r.status).toBe("online");
  });
  it("returns degraded for a fresh failing heartbeat", () => {
    const r = deriveAgentStatus(ev({ kind: "agent-heartbeat", observedAt: "2026-06-19T11:59:30Z", ttlSeconds: 120, ok: false }), NOW);
    expect(r.status).toBe("degraded");
  });
});

describe("deriveProjectState — registry data is not verified healthy", () => {
  it("is unknown and unverified with no health evidence", () => {
    const r = deriveProjectState({ claimedStatus: "Deployed on Railway", blockers: [] }, NOW);
    expect(r.state).toBe("unknown");
    expect(r.verified).toBe(false);
  });
  it("stays unverified even with a 'production' registry status", () => {
    const r = deriveProjectState({ claimedStatus: "Production", blockers: [], stage: "production" }, NOW);
    expect(r.verified).toBe(false);
    expect(r.state).not.toBe("healthy");
  });
  it("is healthy only with fresh passing health evidence", () => {
    const r = deriveProjectState({ blockers: [], healthEvidence: [ev({ ok: true })] }, NOW);
    expect(r.state).toBe("healthy");
    expect(r.verified).toBe(true);
  });
  it("honors archived stage", () => {
    const r = deriveProjectState({ blockers: [], stage: "archived" }, NOW);
    expect(r.state).toBe("archived");
  });
});

describe("deriveGlobalStatus — never fake green", () => {
  const unknownProject: ProjectStatus = {
    id: "p1", name: "P1", state: "unknown", stateLabel: "Unknown", summary: "",
    verified: false, claimIds: [], evidenceIds: [],
  };
  const healthyProject: ProjectStatus = {
    id: "p2", name: "P2", state: "healthy", stateLabel: "Healthy", summary: "",
    verified: true, claimIds: [], evidenceIds: [],
  };

  it("is not all_clear when a project is unknown", () => {
    const g = deriveGlobalStatus({ projects: [unknownProject], agents: [], incidents: [], staleEvidenceCount: 0, unknownClaimCount: 0 });
    expect(g.level).not.toBe("all_clear");
  });
  it("is not all_clear when evidence is stale", () => {
    const g = deriveGlobalStatus({ projects: [healthyProject], agents: [{ status: "online" }], incidents: [], staleEvidenceCount: 3, unknownClaimCount: 0 });
    expect(g.level).not.toBe("all_clear");
  });
  it("is not all_clear when an agent is unknown", () => {
    const g = deriveGlobalStatus({ projects: [healthyProject], agents: [{ status: "unknown" }], incidents: [], staleEvidenceCount: 0, unknownClaimCount: 0 });
    expect(g.level).not.toBe("all_clear");
  });
  it("is all_clear only when everything is verified and fresh", () => {
    const g = deriveGlobalStatus({ projects: [healthyProject], agents: [{ status: "online" }], incidents: [], staleEvidenceCount: 0, unknownClaimCount: 0 });
    expect(g.level).toBe("all_clear");
  });
  it("is critical with a broken project", () => {
    const broken: ProjectStatus = { ...unknownProject, state: "broken" };
    const g = deriveGlobalStatus({ projects: [broken], agents: [], incidents: [], staleEvidenceCount: 0, unknownClaimCount: 0 });
    expect(g.level).toBe("critical");
  });
});
