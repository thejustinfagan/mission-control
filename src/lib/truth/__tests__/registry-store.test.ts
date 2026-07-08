import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { closeDb } from "@/lib/db/sqlite";
import {
  pushRegistryUpdate,
  loadEffectiveRegistry,
  readRegistryPushes,
} from "../registry-store";
import { agentPushConnector } from "../connectors/agent-push";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "mc-registry-"));
});

afterEach(async () => {
  closeDb(join(tempDir, "test.db"));
  await rm(tempDir, { recursive: true, force: true });
});

describe("registry-store", () => {
  it("merges agent push over static registry", () => {
    const dbPath = join(tempDir, "test.db");
    pushRegistryUpdate(
      {
        projectId: "fleet-intel",
        claimedStatus: "Agent says: route planner shipped",
        lastWorked: "2026-07-08",
      },
      "barry",
      { dbPath }
    );

    const effective = loadEffectiveRegistry({ dbPath });
    const fleet = effective.find((p) => p.id === "fleet-intel");
    expect(fleet?.claimedStatus).toBe("Agent says: route planner shipped");
    expect(fleet?.lastWorked).toBe("2026-07-08");
    expect(readRegistryPushes({ dbPath })).toHaveLength(1);
  });
});

describe("agentPushConnector", () => {
  it("emits evidence for agent registry pushes", () => {
    const dbPath = join(tempDir, "test.db");
    pushRegistryUpdate(
      { projectId: "mission-control", claimedStatus: "Barry fed MC" },
      "barry",
      { dbPath }
    );
    const result = agentPushConnector(new Date("2026-06-19T12:00:00Z"), { dbPath });
    expect(result.evidence).toHaveLength(1);
    expect(result.byProject["mission-control"]).toBeDefined();
  });
});
