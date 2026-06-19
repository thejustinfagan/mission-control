import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { applyActionDecisionsToQueue, recordActionDecision, readActionDecisions } from "../action-decisions";
import type { JustinAction } from "../types";

const sampleAction: JustinAction = {
  id: "act:battle-dinghy:0",
  kind: "approval",
  title: "Merge PR #3 (ThreadChess integration)",
  detail: "Battle Dinghy: Merge PR #3 (ThreadChess integration)",
  subject: "project:battle-dinghy",
  priority: "high",
  controls: [{ type: "approve", label: "Approve" }],
  claimIds: ["cl:registry:battle-dinghy"],
  evidenceIds: ["ev:registry:battle-dinghy"],
};

let tempDir: string | null = null;

async function storePath() {
  tempDir = await mkdtemp(join(tmpdir(), "mc-actions-"));
  return join(tempDir, "decisions.json");
}

afterEach(async () => {
  if (tempDir) await rm(tempDir, { recursive: true, force: true });
  tempDir = null;
});

describe("action decisions", () => {
  it("persists an approve click as an action decision", async () => {
    const path = await storePath();
    const decision = await recordActionDecision(
      {
        actionId: sampleAction.id,
        controlType: "approve",
        label: "Approve",
        title: sampleAction.title,
        subject: sampleAction.subject,
      },
      { path, now: new Date("2026-06-19T12:00:00Z") }
    );

    expect(decision.id).toBe("decision:act:battle-dinghy:0");
    expect(decision.status).toBe("approved");
    expect(decision.title).toBe(sampleAction.title);

    const stored = await readActionDecisions({ path });
    expect(stored).toHaveLength(1);
    expect(stored[0]).toEqual(decision);
  });

  it("removes acted-upon queue items and exposes the decision record", async () => {
    const path = await storePath();
    const decision = await recordActionDecision(
      {
        actionId: sampleAction.id,
        controlType: "approve",
        label: "Approve",
        title: sampleAction.title,
        subject: sampleAction.subject,
      },
      { path, now: new Date("2026-06-19T12:00:00Z") }
    );

    const result = applyActionDecisionsToQueue([sampleAction], [decision]);

    expect(result.openActions).toEqual([]);
    expect(result.appliedDecisions).toEqual([decision]);
  });
});
