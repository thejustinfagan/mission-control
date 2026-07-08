import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { recordHeartbeat, readHeartbeats } from "../heartbeat-store";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "mc-heartbeat-"));
});

afterEach(async () => {
  if (tempDir) await rm(tempDir, { recursive: true, force: true });
});

function storePath() {
  return join(tempDir, "heartbeats.json");
}

describe("heartbeat-store", () => {
  it("records and reads heartbeats per agent", async () => {
    const path = storePath();
    await recordHeartbeat(
      { agentId: "barry", ok: true, currentTask: "Nightly build" },
      { path }
    );
    const records = await readHeartbeats({ path });
    expect(records).toHaveLength(1);
    expect(records[0].agentId).toBe("barry");
    expect(records[0].currentTask).toBe("Nightly build");
  });

  it("keeps only latest heartbeat per agent", async () => {
    const path = storePath();
    await recordHeartbeat(
      { agentId: "barry", ok: true, observedAt: "2026-06-19T10:00:00Z" },
      { path }
    );
    await recordHeartbeat(
      { agentId: "barry", ok: true, observedAt: "2026-06-19T11:00:00Z", currentTask: "newer" },
      { path }
    );
    const records = await readHeartbeats({ path });
    expect(records).toHaveLength(1);
    expect(records[0].currentTask).toBe("newer");
  });

  it("rejects unknown agent ids", async () => {
    await expect(
      recordHeartbeat({ agentId: "unknown-bot", ok: true }, { path: storePath() })
    ).rejects.toThrow(/Unknown agentId/);
  });
});
