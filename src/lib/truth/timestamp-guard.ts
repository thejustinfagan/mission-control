/**
 * Timestamp safety guard.
 * max_future_clock_skew_seconds: 300
 * Reject invalid, far-future, or >300s future timestamps.
 */

const MAX_FUTURE_SKEW_SECONDS = 300;

import { toEpochMs, ageSeconds } from './time';

export function isFutureBeyondSkew(
  observedAt: string | null | undefined,
  now: Date = new Date(),
  skewSeconds = MAX_FUTURE_SKEW_SECONDS
): boolean {
  const age = ageSeconds(observedAt, now);
  if (age === null) return true; // treat invalid as bad future
  return age < -skewSeconds;
}

export function validateObservedAt(
  observedAt: string | null | undefined,
  now: Date = new Date(),
  skewSeconds = MAX_FUTURE_SKEW_SECONDS
): boolean {
  if (!observedAt) return false;
  const ms = toEpochMs(observedAt);
  if (ms === null) return false;

  // Reject obviously bogus far future (e.g. year 2100)
  const year = new Date(ms).getUTCFullYear();
  if (year > 2100) return false;

  const age = ageSeconds(observedAt, now);
  if (age === null) return false;

  if (age < -skewSeconds) return false; // too far in future

  return true;
}

export function clampSlightlyFuture(
  observedAt: string,
  now: Date = new Date(),
  skewSeconds = MAX_FUTURE_SKEW_SECONDS
): string {
  const age = ageSeconds(observedAt, now);
  if (age !== null && age < 0 && Math.abs(age) <= skewSeconds) {
    return now.toISOString();
  }
  return observedAt;
}
