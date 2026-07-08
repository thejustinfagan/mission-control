import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { closeDb } from "@/lib/db/sqlite";
import { recordHeartbeat, readHeartbeats } from "../heartbeat-store";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "mc-heartbeat-"));
});

afterEach(async () => {
  const dbPath = join(tempDir, "test.db");
  closeDb(dbPath);
  if (tempDir) await rm(tempDir, { recursive: true, force: true });
});

function dbPath() {
  return join(tempDir, "test.db");
}

describe("heartbeat-store", () => {
  it("records and reads heartbeats per agent", async () => {
    await recordHeartbeat(
      { agentId: "barry", ok: true, currentTask: "Nightly build" },
      { dbPath: dbPath() }
    );
    const records = await readHeartbeats({ dbPath: dbPath() });
    expect(records).toHaveLength(1);
    expect(records[0].agentId).toBe("barry");
    expect(records[0].currentTask).toBe("Nightly build");
  });

  it("keeps only latest heartbeat per agent", async () => {
    await recordHeartbeat(
      { agentId: "barry", ok: true, observedAt: "2026-06-19T10:00:00Z" },
      { dbPath: dbPath() }
    );
    await recordHeartbeat(
      { agentId: "barry", ok: true, observedAt: "2026-06-19T11:00:00Z", currentTask: "newer" },
      { dbPath: dbPath() }
    );
    const records = await readHeartbeats({ dbPath: dbPath() });
    expect(records).toHaveLength(1);
    expect(records[0].currentTask).toBe("newer");
  });

  it("rejects unknown agent ids", async () => {
    await expect(
      recordHeartbeat({ agentId: "unknown-bot", ok: true }, { dbPath: dbPath() })
    ).rejects.toThrow(/Unknown agentId/);
  });
});
