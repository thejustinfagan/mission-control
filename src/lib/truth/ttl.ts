// TTL / freshness logic. Stale evidence expires — this is where that happens.

import type { Evidence, Freshness } from "./types";
import { addSeconds, ageSeconds, toEpochMs } from "./time";

/**
 * Is an observation still fresh?
 *
 * Fresh requires: a parseable timestamp, a positive TTL, and an age that has
 * not exceeded the TTL. Missing data, non-positive TTL, or an expired age are
 * all NOT fresh. Unknown beats fake green.
 */
export function isFresh(
  observedAt: string | null | undefined,
  ttlSeconds: number | null | undefined,
  now: Date = new Date()
): boolean {
  if (!observedAt || ttlSeconds == null || ttlSeconds <= 0) return false;
  const age = ageSeconds(observedAt, now);
  if (age === null) return false;
  // A future-dated observation (negative age) is treated as fresh.
  return age <= ttlSeconds;
}

/** Compute a full Freshness descriptor for an observation. */
export function computeFreshness(
  observedAt: string | null | undefined,
  ttlSeconds: number | null | undefined,
  now: Date = new Date()
): Freshness {
  if (!observedAt || toEpochMs(observedAt) === null) {
    return {
      state: "unknown",
      observedAt: observedAt ?? null,
      ttlSeconds: ttlSeconds ?? null,
      ageSeconds: null,
      expiresAt: null,
    };
  }

  const age = ageSeconds(observedAt, now);
  const hasTtl = ttlSeconds != null && ttlSeconds > 0;
  const expiresAt = hasTtl ? addSeconds(observedAt, ttlSeconds as number) : null;
  const fresh = isFresh(observedAt, ttlSeconds, now);

  return {
    state: hasTtl ? (fresh ? "fresh" : "stale") : "unknown",
    observedAt,
    ttlSeconds: ttlSeconds ?? null,
    ageSeconds: age,
    expiresAt,
  };
}

/**
 * Freshness for a claim backed by zero or more pieces of evidence.
 * A claim is as fresh as its freshest supporting evidence; with no evidence it
 * is unknown.
 */
export function freshnessFromEvidence(
  evidence: Evidence[],
  now: Date = new Date()
): Freshness {
  if (evidence.length === 0) {
    return {
      state: "unknown",
      observedAt: null,
      ttlSeconds: null,
      ageSeconds: null,
      expiresAt: null,
    };
  }

  const freshnesses = evidence.map((e) =>
    computeFreshness(e.observedAt, e.ttlSeconds, now)
  );

  // Prefer a fresh source; otherwise the most recently observed one.
  const fresh = freshnesses.find((f) => f.state === "fresh");
  if (fresh) return fresh;

  return freshnesses
    .slice()
    .sort((a, b) => (toEpochMs(b.observedAt) ?? 0) - (toEpochMs(a.observedAt) ?? 0))[0];
}
