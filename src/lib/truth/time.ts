// Pure time helpers for the truth model. No side effects beyond reading the
// clock when a `now` argument is not supplied.

/** Current time as an ISO-8601 string. */
export function nowIso(now: Date = new Date()): string {
  return now.toISOString();
}

/**
 * Parse an ISO-8601 timestamp to epoch milliseconds.
 * Returns null for null/empty/invalid input rather than NaN.
 */
export function toEpochMs(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
}

/**
 * Whole seconds elapsed between `observedAt` and `now`.
 * Returns null when `observedAt` cannot be parsed. Can be negative if the
 * observation is timestamped in the future.
 */
export function ageSeconds(
  observedAt: string | null | undefined,
  now: Date = new Date()
): number | null {
  const observed = toEpochMs(observedAt);
  if (observed === null) return null;
  return Math.floor((now.getTime() - observed) / 1000);
}

/** Add a number of seconds to an ISO timestamp, returning a new ISO string. */
export function addSeconds(iso: string, seconds: number): string {
  const base = toEpochMs(iso);
  if (base === null) {
    throw new Error(`addSeconds: invalid timestamp "${iso}"`);
  }
  return new Date(base + seconds * 1000).toISOString();
}

/**
 * Human-friendly relative age, e.g. "3m ago", "2h ago", "just now",
 * or "unknown" when the timestamp cannot be parsed.
 */
export function formatAge(
  observedAt: string | null | undefined,
  now: Date = new Date()
): string {
  const secs = ageSeconds(observedAt, now);
  if (secs === null) return "unknown";
  if (secs < 0) return "in the future";
  if (secs < 45) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
