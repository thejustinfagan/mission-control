import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { closeDb } from "@/lib/db/sqlite";
import { createTask, updateTaskStatus, readTasks } from "../task-store";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "mc-tasks-"));
});

afterEach(async () => {
  closeDb(join(tempDir, "test.db"));
  await rm(tempDir, { recursive: true, force: true });
});

describe("task-store", () => {
  it("creates and updates task status", async () => {
    const dbPath = join(tempDir, "test.db");
    const created = await createTask(
      { title: "Test task", project: "mission-control", priority: "high" },
      { dbPath }
    );
    expect(created.status).toBe("todo");

    const done = await updateTaskStatus(created.id, "done", {}, { dbPath });
    expect(done?.status).toBe("done");
    expect(done?.completedAt).toBeDefined();

    const all = await readTasks({ dbPath });
    expect(all.find((t) => t.id === created.id)?.status).toBe("done");
  });
});
