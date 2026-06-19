import { describe, it, expect } from "vitest";
import { toEpochMs, ageSeconds, addSeconds, formatAge, nowIso } from "../time";
import { isFresh, computeFreshness } from "../ttl";

const NOW = new Date("2026-06-19T12:00:00Z");

describe("time helpers", () => {
  it("nowIso returns an ISO string", () => {
    expect(nowIso(NOW)).toBe("2026-06-19T12:00:00.000Z");
  });

  it("toEpochMs parses valid ISO and rejects junk", () => {
    expect(toEpochMs("2026-06-19T12:00:00Z")).toBe(Date.parse("2026-06-19T12:00:00Z"));
    expect(toEpochMs("not-a-date")).toBeNull();
    expect(toEpochMs(null)).toBeNull();
    expect(toEpochMs(undefined)).toBeNull();
    expect(toEpochMs("")).toBeNull();
  });

  it("ageSeconds computes elapsed seconds", () => {
    expect(ageSeconds("2026-06-19T11:59:00Z", NOW)).toBe(60);
    expect(ageSeconds("2026-06-19T12:01:00Z", NOW)).toBe(-60); // future
    expect(ageSeconds("garbage", NOW)).toBeNull();
  });

  it("addSeconds shifts a timestamp forward", () => {
    expect(addSeconds("2026-06-19T12:00:00Z", 90)).toBe("2026-06-19T12:01:30.000Z");
    expect(() => addSeconds("nope", 10)).toThrow();
  });

  it("formatAge produces human-readable relative ages", () => {
    expect(formatAge("2026-06-19T11:59:50Z", NOW)).toBe("just now");
    expect(formatAge("2026-06-19T11:55:00Z", NOW)).toBe("5m ago");
    expect(formatAge("2026-06-19T09:00:00Z", NOW)).toBe("3h ago");
    expect(formatAge("2026-06-17T12:00:00Z", NOW)).toBe("2d ago");
    expect(formatAge(null, NOW)).toBe("unknown");
  });
});

describe("isFresh — TTL expiry", () => {
  it("is fresh within the TTL window", () => {
    expect(isFresh("2026-06-19T11:59:00Z", 120, NOW)).toBe(true); // 60s old, 120s ttl
  });

  it("expires evidence past its TTL", () => {
    expect(isFresh("2026-06-19T11:50:00Z", 120, NOW)).toBe(false); // 600s old, 120s ttl
  });

  it("is never fresh without a timestamp or with non-positive TTL", () => {
    expect(isFresh(null, 120, NOW)).toBe(false);
    expect(isFresh("2026-06-19T11:59:00Z", 0, NOW)).toBe(false);
    expect(isFresh("2026-06-19T11:59:00Z", -5, NOW)).toBe(false);
  });
});

describe("computeFreshness", () => {
  it("reports fresh inside TTL with an expiry", () => {
    const f = computeFreshness("2026-06-19T11:59:00Z", 120, NOW);
    expect(f.state).toBe("fresh");
    expect(f.ageSeconds).toBe(60);
    expect(f.expiresAt).toBe("2026-06-19T12:01:00.000Z");
  });

  it("reports stale past TTL", () => {
    const f = computeFreshness("2026-06-19T11:00:00Z", 120, NOW);
    expect(f.state).toBe("stale");
  });

  it("reports unknown without a parseable timestamp", () => {
    const f = computeFreshness(null, 120, NOW);
    expect(f.state).toBe("unknown");
    expect(f.ageSeconds).toBeNull();
  });

  it("reports unknown when TTL is absent (info-only evidence)", () => {
    const f = computeFreshness("2026-06-19T11:59:00Z", 0, NOW);
    expect(f.state).toBe("unknown");
  });
});
