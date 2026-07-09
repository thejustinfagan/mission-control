/**
 * Strict access control for Mission Control.
 * Human: Basic Auth (MC_UI_USERNAME / MC_UI_PASSWORD)
 * Agent: Bearer only (MC_AUTH_TOKEN) — no fallback, no query string.
 */

const ALLOWED_AGENT_ROUTES = new Set([
  '/api/agents/heartbeat',
  '/api/agents/feed',
  '/api/agents/registry',
  '/api/activities',
  '/api/status',
  '/api/project-update',
  '/api/memory',
  '/api/mission-control/sweep',
]);

export function isPublicStaticPath(pathname: string): boolean {
  if (pathname.startsWith('/_next/')) return true;
  if (pathname === '/favicon.ico') return true;
  if (pathname === '/health') return true;
  return false;
}

export function verifyAgentAuthStrict(request: Request): boolean {
  const token = process.env.MC_AUTH_TOKEN?.trim();
  if (!token) {
    // Production must have the token; fail closed
    return false;
  }

  const header = request.headers.get('authorization') || '';
  if (header === `Bearer ${token}`) {
    return true;
  }

  // Explicitly reject query string tokens (security fix)
  return false;
}

export function verifyHumanBasicAuth(request: Request): boolean {
  const username = process.env.MC_UI_USERNAME?.trim();
  const password = process.env.MC_UI_PASSWORD?.trim();

  if (!username || !password) {
    // Missing in production → fail closed
    return false;
  }

  const authHeader = request.headers.get('authorization') || '';
  if (!authHeader.startsWith('Basic ')) return false;

  try {
    const decoded = atob(authHeader.slice(6));
    const [u, p] = decoded.split(':');
    return u === username && p === password;
  } catch {
    return false;
  }
}

export function isAgentRoute(pathname: string): boolean {
  return ALLOWED_AGENT_ROUTES.has(pathname);
}

/**
 * High level guard. Returns 401 Response if auth fails.
 * Use in middleware or per-route.
 */
export function requireAuth(request: Request, pathname: string): Response | null {
  if (isPublicStaticPath(pathname)) return null;

  // Agent-only routes: strict Bearer only
  if (isAgentRoute(pathname)) {
    if (verifyAgentAuthStrict(request)) return null;
    return new Response(JSON.stringify({ error: 'Unauthorized (agent)' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Everything else (pages, read APIs, mutations): require human Basic Auth
  if (verifyHumanBasicAuth(request)) return null;

  const response = new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: {
      'Content-Type': 'application/json',
      'WWW-Authenticate': 'Basic realm="Mission Control"',
    },
  });
  return response;
}

export function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
