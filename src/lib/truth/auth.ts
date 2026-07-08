/** Shared auth for agent push endpoints (heartbeat, activities, feed). */

export function getExpectedAuthToken(): string {
  return process.env.MC_AUTH_TOKEN?.trim() || "barry-update-2026";
}

export function verifyAgentAuth(request: Request): boolean {
  const token = getExpectedAuthToken();
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
