import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { closeDb } from "@/lib/db/sqlite";

const originalEnv = process.env;
const legacyFallbackToken = ["barry", "update", "2026"].join("-");
let tempDir: string | null = null;

beforeEach(async () => {
  vi.resetModules();
  process.env = { ...originalEnv };
  tempDir = await mkdtemp(join(tmpdir(), "mc-route-security-"));
  process.env.MC_DB_PATH = join(tempDir, "test.db");
});

afterEach(async () => {
  if (process.env.MC_DB_PATH) closeDb(process.env.MC_DB_PATH);
  if (tempDir) await rm(tempDir, { recursive: true, force: true });
  tempDir = null;
  process.env = originalEnv;
  vi.resetModules();
});

describe("API route security regressions", () => {
  it("human route-level guards return a Basic challenge", async () => {
    process.env.MC_UI_USERNAME = "justin";
    process.env.MC_UI_PASSWORD = "secret";

    const { GET } = await import("@/app/api/tasks/route");
    const response = await GET(new Request("http://example.com/api/tasks") as never);

    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toMatch(/Basic/);
  });

  it("rejects the old fallback token on /api/memory when MC_AUTH_TOKEN is absent", async () => {
    delete process.env.MC_AUTH_TOKEN;

    const { POST } = await import("@/app/api/memory/route");
    const response = await POST(
      new Request("http://example.com/api/memory", {
        method: "POST",
        headers: {
          authorization: `Bearer ${legacyFallbackToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      })
    );

    expect(response.status).toBe(401);
  });

  it("rejects the old fallback token on /api/project-update when MC_AUTH_TOKEN is absent", async () => {
    delete process.env.MC_AUTH_TOKEN;

    const { POST } = await import("@/app/api/project-update/route");
    const response = await POST(
      new Request("http://example.com/api/project-update", {
        method: "POST",
        headers: {
          authorization: `Bearer ${legacyFallbackToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          action: "update_project",
          project: "mission-control",
          updates: { status: "active" },
        }),
      })
    );

    expect(response.status).toBe(401);
  });

  it("rejects invalid heartbeat observedAt at the route boundary", async () => {
    process.env.MC_AUTH_TOKEN = "agent-token";

    const { POST } = await import("@/app/api/agents/heartbeat/route");
    const response = await POST(
      new Request("http://example.com/api/agents/heartbeat", {
        method: "POST",
        headers: {
          authorization: "Bearer agent-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          agentId: "barry",
          ok: true,
          observedAt: "2100-01-01T00:00:00.000Z",
        }),
      }) as never
    );

    expect(response.status).toBe(400);
  });

  it("exposes only the narrow public API health endpoint without credentials", async () => {
    const { GET } = await import("@/app/api/health/route");
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
  });
});
