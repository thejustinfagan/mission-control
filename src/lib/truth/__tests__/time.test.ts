import { describe, expect, it } from "vitest";
import { expiresAt, isFresh, relativeAge } from "../time";

const now = new Date("2026-06-19T12:00:00Z");

describe("truth time helpers", () => {
  it("isFresh returns false after TTL", () => {
    expect(isFresh("2026-06-19T11:54:59Z", 5 * 60, now)).toBe(false);
    expect(isFresh("2026-06-19T11:55:00Z", 5 * 60, now)).toBe(true);
  });

  it("computes expiration and relative age", () => {
    expect(expiresAt("2026-06-19T11:55:00Z", 300)).toBe("2026-06-19T12:00:00.000Z");
    expect(relativeAge("2026-06-19T11:59:00Z", now)).toBe("1m ago");
  });
});
