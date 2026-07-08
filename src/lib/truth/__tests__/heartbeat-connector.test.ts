import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { heartbeatConnector } from "../connectors/heartbeat";
import { buildMissionControlSnapshot } from "../snapshot";

const NOW = new Date("2026-06-19T12:00:00Z");

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "mc-hb-conn-"));
});

afterEach(async () => {
  if (tempDir) await rm(tempDir, { recursive: true, force: true });
});

describe("heartbeatConnector", () => {
  it("produces online status for a fresh passing heartbeat", async () => {
    const path = join(tempDir, "hb.json");
    await writeFile(
      path,
      JSON.stringify([
        {
          agentId: "barry",
          observedAt: "2026-06-19T11:59:00Z",
          ok: true,
          currentTask: "Mission Control build",
        },
      ])
    );

    const result = await heartbeatConnector(NOW, { storePath: path });
    expect(result.evidence).toHaveLength(1);
    expect(result.byAgent.barry).toBeDefined();

    const snapshot = await buildMissionControlSnapshot({
      now: NOW,
      probeTargets: [],
      localTargets: [],
      skipGithub: true,
      heartbeatStorePath: path,
    });
    const barry = snapshot.agents.find((a) => a.id === "barry");
    expect(barry?.status).toBe("online");
    expect(barry?.statusLabel).toMatch(/online/i);
  });

  it("returns empty when no heartbeats on file", async () => {
    const result = await heartbeatConnector(NOW, { storePath: join(tempDir, "missing.json") });
    expect(result.evidence).toHaveLength(0);
  });
});
