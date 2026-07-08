/** Shared auth for agent push endpoints (heartbeat, activities). */

export function verifyAgentAuth(request: Request): boolean {
  const token = process.env.MC_AUTH_TOKEN;
  if (!token) return true; // open when unset (local dev only)
  const header = request.headers.get("authorization");
  if (header === `Bearer ${token}`) return true;
  const query = new URL(request.url).searchParams.get("token");
  return query === token;
}

export function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
