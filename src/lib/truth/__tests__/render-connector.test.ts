import { describe, it, expect, vi, afterEach } from "vitest";
import { DEFAULT_RENDER_TARGETS, renderProbeConnector } from "../connectors/render";

const NOW = new Date("2026-06-19T12:00:00Z");
const TARGET = [
  {
    projectId: "test",
    label: "Test",
    url: "https://example.com",
    markers: ["hello", "world"],
  },
];

describe("renderProbeConnector", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("passes when body contains a marker", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("<html><body>Hello Fleet Intel</body></html>", { status: 200 }))
    );
    const r = await renderProbeConnector(NOW, TARGET);
    expect(r.evidence[0].ok).toBe(true);
    expect(r.evidence[0].kind).toBe("browser-render");
  });

  it("fails when no markers match", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("<html>empty</html>", { status: 200 }))
    );
    const r = await renderProbeConnector(NOW, TARGET);
    expect(r.evidence[0].ok).toBe(false);
  });

  it("returns unknown on network error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("timeout"); }));
    const r = await renderProbeConnector(NOW, TARGET);
    expect(r.evidence[0].ok).toBeNull();
  });

  it("uses public health for Mission Control's default render probe", () => {
    const mc = DEFAULT_RENDER_TARGETS.find((t) => t.projectId === "mission-control");
    expect(mc?.url).toContain("/api/health");
    expect(mc?.url).not.toContain("/api/status");
  });
});
