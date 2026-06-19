export function isFresh(capturedAt: string, ttlSeconds: number, now = new Date()): boolean {
  const captured = new Date(capturedAt).getTime();
  if (Number.isNaN(captured)) return false;
  return now.getTime() - captured <= ttlSeconds * 1000;
}

export function expiresAt(capturedAt: string, ttlSeconds: number): string {
  return new Date(new Date(capturedAt).getTime() + ttlSeconds * 1000).toISOString();
}

export function relativeAge(capturedAt: string, now = new Date()): string {
  const captured = new Date(capturedAt).getTime();
  if (Number.isNaN(captured)) return "unknown age";
  const ms = Math.max(0, now.getTime() - captured);
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}
