import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { closeDb } from "@/lib/db/sqlite";
import { recordHeartbeat } from "../heartbeat-store";
import { heartbeatConnector } from "../connectors/heartbeat";
import { buildMissionControlSnapshot } from "../snapshot";

const NOW = new Date("2026-06-19T12:00:00Z");

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "mc-hb-conn-"));
});

afterEach(async () => {
  closeDb(join(tempDir, "test.db"));
  if (tempDir) await rm(tempDir, { recursive: true, force: true });
});

describe("heartbeatConnector", () => {
  it("produces online status for a fresh passing heartbeat", async () => {
    const dbPath = join(tempDir, "test.db");
    await recordHeartbeat(
      {
        agentId: "barry",
        observedAt: "2026-06-19T11:59:00Z",
        ok: true,
        currentTask: "Mission Control build",
      },
      { dbPath }
    );

    const result = await heartbeatConnector(NOW, { dbPath });
    expect(result.evidence).toHaveLength(1);
    expect(result.byAgent.barry).toBeDefined();

    const snapshot = await buildMissionControlSnapshot({
      now: NOW,
      probeTargets: [],
      localTargets: [],
      skipGithub: true,
      skipRender: true,
      heartbeatDbPath: dbPath,
    });
    const barry = snapshot.agents.find((a) => a.id === "barry");
    expect(barry?.status).toBe("online");
    expect(barry?.statusLabel).toMatch(/online/i);
  });

  it("returns empty when no heartbeats in db", async () => {
    const result = await heartbeatConnector(NOW, { dbPath: join(tempDir, "empty.db") });
    expect(result.evidence).toHaveLength(0);
  });
});
