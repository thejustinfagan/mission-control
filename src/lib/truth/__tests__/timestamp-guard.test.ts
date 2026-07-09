import { describe, it, expect } from 'vitest';
import { 
  validateObservedAt, 
  clampSlightlyFuture,
  isFutureBeyondSkew 
} from '../timestamp-guard';

describe('timestamp-guard (future date safety)', () => {
  const now = new Date('2026-07-09T14:00:00.000Z');

  it('rejects invalid observedAt', () => {
    expect(validateObservedAt('not-a-date', now)).toBe(false);
    expect(validateObservedAt('', now)).toBe(false);
    expect(validateObservedAt(null as any, now)).toBe(false);
  });

  it('rejects year-2100 observedAt (far future)', () => {
    const farFuture = '2100-01-01T00:00:00.000Z';
    expect(validateObservedAt(farFuture, now)).toBe(false);
  });

  it('rejects now + 301 seconds (beyond 300s skew)', () => {
    const tooFuture = new Date(now.getTime() + 301 * 1000).toISOString();
    expect(validateObservedAt(tooFuture, now)).toBe(false);
    expect(isFutureBeyondSkew(tooFuture, now, 300)).toBe(true);
  });

  it('accepts now + 299 seconds (within skew)', () => {
    const slightlyFuture = new Date(now.getTime() + 299 * 1000).toISOString();
    expect(validateObservedAt(slightlyFuture, now)).toBe(true);
  });

  it('clamps slightly future within skew to zero age', () => {
    const slightlyFuture = new Date(now.getTime() + 200 * 1000).toISOString();
    const clamped = clampSlightlyFuture(slightlyFuture, now, 300);
    expect(clamped).toBe(now.toISOString());
  });

  it('old heartbeat remains stale (negative test for future poisoning)', () => {
    const old = new Date(now.getTime() - 10000 * 1000).toISOString();
    // This will be used in heartbeat-store integration
    expect(validateObservedAt(old, now)).toBe(true); // valid timestamp, just old
  });
});
