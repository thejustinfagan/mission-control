import { describe, it, expect } from "vitest";
import { staticRegistryConnector } from "../connectors/static";

const NOW = new Date("2026-06-19T12:00:00Z");

describe("static registry connector", () => {
  const result = staticRegistryConnector(NOW);

  it("emits evidence and claims for every registered project", () => {
    expect(result.registry.length).toBeGreaterThan(0);
    for (const project of result.registry) {
      const refs = result.byProject[project.id];
      expect(refs).toBeDefined();
      expect(result.evidence.find((e) => e.id === refs.existenceEvidenceId)).toBeDefined();
      expect(result.claims.find((c) => c.id === refs.registeredClaimId)).toBeDefined();
      expect(result.claims.find((c) => c.id === refs.healthClaimId)).toBeDefined();
    }
  });

  it("never verifies a project as healthy from registry data alone", () => {
    const healthClaims = result.claims.filter((c) => c.id.startsWith("cl:health:"));
    expect(healthClaims.length).toBeGreaterThan(0);
    for (const c of healthClaims) {
      expect(c.status).toBe("unverified");
      expect(c.confidence).toBe("none");
    }
  });

  it("marks registry evidence as static and not a pass/fail health signal", () => {
    for (const e of result.evidence) {
      expect(e.kind).toBe("static-registry");
      expect(e.source.type).toBe("static");
      expect(e.ok).toBeNull();
    }
  });

  it("only verifies the existence/identity claim, which the file genuinely proves", () => {
    const registered = result.claims.filter((c) => c.id.startsWith("cl:registered:"));
    for (const c of registered) {
      expect(c.status).toBe("verified");
      expect(c.evidenceIds.length).toBeGreaterThan(0);
    }
  });

  it("records registry blockers as unverified testimony", () => {
    const blockerClaims = result.claims.filter((c) => c.id.startsWith("cl:blocker:"));
    for (const c of blockerClaims) {
      expect(c.status).toBe("unverified");
    }
  });
});
