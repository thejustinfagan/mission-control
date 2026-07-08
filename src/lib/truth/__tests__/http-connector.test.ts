import { describe, it, expect, vi, afterEach } from "vitest";
import {
  configuredHttpTargets,
  resolveHttpTargets,
  httpProbeConnector,
  DEFAULT_PROBE_TARGETS,
  registryProbeTargets,
  type HttpProbeTarget,
} from "../connectors/http";

const NOW = new Date("2026-06-19T12:00:00Z");
const TARGET: HttpProbeTarget[] = [
  { projectId: "mc", label: "MC", url: "https://example.com/api/status" },
];

describe("configuredHttpTargets — MC_PROBE_URLS parsing", () => {
  it("parses projectId|url pairs", () => {
    const targets = configuredHttpTargets({
      MC_PROBE_URLS: "mc|https://example.com,fleet|https://fleet.example.com",
    } as NodeJS.ProcessEnv);
    expect(targets).toEqual([
      { projectId: "mc", label: "https://example.com", url: "https://example.com" },
      { projectId: "fleet", label: "https://fleet.example.com", url: "https://fleet.example.com" },
    ]);
  });

  it("rejects non-http(s) and malformed entries", () => {
    const targets = configuredHttpTargets({
      MC_PROBE_URLS: "bad|ftp://nope,missingurl|,|https://orphan.com,ok|https://good.com",
    } as NodeJS.ProcessEnv);
    expect(targets).toEqual([
      { projectId: "ok", label: "https://good.com", url: "https://good.com" },
    ]);
  });

  it("returns [] when MC_PROBE_URLS is unset", () => {
    expect(configuredHttpTargets({} as NodeJS.ProcessEnv)).toEqual([]);
  });
});

describe("resolveHttpTargets — defaults vs config", () => {
  it("merges committed defaults with registry live URLs when MC_PROBE_URLS is unset", () => {
    const targets = resolveHttpTargets({} as NodeJS.ProcessEnv);
    expect(targets.length).toBeGreaterThan(DEFAULT_PROBE_TARGETS.length);
    expect(targets.find((t) => t.projectId === "mission-control")).toBeDefined();
    expect(targets.find((t) => t.projectId === "public-data")).toBeDefined();
    expect(targets.find((t) => t.projectId === "fleet-intel")).toBeDefined();
  });

  it("uses MC_PROBE_URLS when configured", () => {
    const targets = resolveHttpTargets({
      MC_PROBE_URLS: "mc|https://override.example.com",
    } as NodeJS.ProcessEnv);
    expect(targets).toEqual([
      { projectId: "mc", label: "https://override.example.com", url: "https://override.example.com" },
    ]);
  });
});

describe("DEFAULT_PROBE_TARGETS point at Railway, never localhost or Vercel", () => {
  it("targets the Railway domain over https with no credentials in the URL", () => {
    expect(DEFAULT_PROBE_TARGETS.length).toBeGreaterThan(0);
    for (const t of DEFAULT_PROBE_TARGETS) {
      expect(t.url).toMatch(/^https:\/\//);
      expect(t.url).toContain("railway.app");
      expect(t.url).not.toMatch(/localhost|127\.0\.0\.1|vercel/i);
      expect(t.url).not.toContain("@"); // no embedded credentials
    }
  });

  it("probes /api/status (not the snapshot-building root) to avoid recursion", () => {
    const mc = DEFAULT_PROBE_TARGETS.find((t) => t.projectId === "mission-control");
    expect(mc?.url).toContain("/api/status");
  });
});

describe("httpProbeConnector — outcome mapping (mocked fetch)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps a 2xx response to reachable/verified", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("ok", { status: 200 })));
    const r = await httpProbeConnector(NOW, TARGET);
    expect(r.evidence[0].ok).toBe(true);
    expect(r.claims[0].status).toBe("verified");
    expect(r.claims[0].statement).toMatch(/reachable/i);
  });

  it("maps a 5xx response to a failing (unverified) reachability signal", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("err", { status: 503 })));
    const r = await httpProbeConnector(NOW, TARGET);
    expect(r.evidence[0].ok).toBe(false);
    expect(r.claims[0].status).toBe("unverified");
  });

  it("treats an egress-proxy denial (x-deny-reason) as Unknown, never down", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response("Host not in allowlist", {
            status: 403,
            headers: { "x-deny-reason": "host_not_allowed" },
          })
      )
    );
    const r = await httpProbeConnector(NOW, TARGET);
    expect(r.evidence[0].ok).toBeNull();
    expect(r.claims[0].status).toBe("unknown");
    expect(r.evidence[0].summary).toMatch(/egress/i);
  });

  it("treats a thrown fetch (timeout/refused) as Unknown, never down", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("ECONNREFUSED"); }));
    const r = await httpProbeConnector(NOW, TARGET);
    expect(r.evidence[0].ok).toBeNull();
    expect(r.claims[0].status).toBe("unknown");
  });
});
