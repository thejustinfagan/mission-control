/**
 * Legacy thin wrapper. New code should import from access-control.ts
 * Kept for minimal route changes during GC-1.
 */
export { verifyAgentAuthStrict as verifyAgentAuth } from './access-control';
export { unauthorizedResponse } from './access-control'; // re-export for routes that use it

// Keep a strict getExpected for any internal use (but discourage)
export function getExpectedAuthToken(): string {
  const token = process.env.MC_AUTH_TOKEN?.trim();
  if (!token) {
    throw new Error('MC_AUTH_TOKEN must be set in production');
  }
  return token;
}
