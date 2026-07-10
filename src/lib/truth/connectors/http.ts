// HTTP probe connector.
//
// Probes ONLY explicitly-configured public URLs, with NO credentials. A 2xx
// response proves the URL is *reachable* — it does NOT prove the product works
// (deploy green ≠ working). So http evidence creates reachability claims and
// proof-feed entries; it never marks a project verified-healthy. Only rendered
// browser/test evidence can do that.
//
// Configure via env: MC_PROBE_URLS="projectId|https://url,projectId|https://url"
// When MC_PROBE_URLS is unset, a small committed default set is probed instead
// (public URLs only, no credentials). Pass explicit targets (e.g. []) to a
// connector call to bypass both — used by tests to stay offline.

import type { Claim, ConnectorResult, Evidence } from "../types";
import { claimStatusFromEvidence } from "../rules";
import { nowIso } from "../time";
import { computeFreshness } from "../ttl";
import { loadEffectiveRegistry } from "../registry-store";

export interface HttpProbeTarget {
  projectId: string;
  label: string;
  url: string;
}

const PROBE_TTL_SECONDS = 300; // a reachability check is fresh for 5 minutes
const PROBE_TIMEOUT_MS = 4000;

// Default reachability targets, used when MC_PROBE_URLS is not configured.
// NOTE: Mission Control read APIs are private. Probe only the narrow public
// health endpoint, not status data.
export const DEFAULT_PROBE_TARGETS: HttpProbeTarget[] = [
  {
    projectId: "mission-control",
    label: "Mission Control on Railway (/api/health)",
    url: "https://web-production-2c48a.up.railway.app/api/health",
  },
];

/** Extra probes for projects without liveUrl in registry but known deployed surfaces. */
export const SUPPLEMENTAL_PROBE_TARGETS: HttpProbeTarget[] = [
  {
    projectId: "fleet-intel",
    label: "Fleet Intel production",
    url: "https://fleetintel.net",
  },
];

/** Build probe targets from registry liveUrl fields. */
export function registryProbeTargets(
  env: NodeJS.ProcessEnv = process.env
): HttpProbeTarget[] {
  const registry = loadEffectiveRegistry();
  const targets: HttpProbeTarget[] = [];

  for (const project of registry) {
    if (!project.liveUrl) continue;
    let url = project.liveUrl;
    let label = `${project.name} live URL`;

    // Mission Control read APIs are private; use the public health endpoint.
    if (project.id === "mission-control") {
      url = url.replace(/\/?$/, "/api/health");
      label = "Mission Control on Railway (/api/health)";
    }

    targets.push({ projectId: project.id, label, url });
  }

  return targets;
}

function dedupeProbeTargets(targets: HttpProbeTarget[]): HttpProbeTarget[] {
  const seen = new Set<string>();
  const out: HttpProbeTarget[] = [];
  for (const t of targets) {
    const key = `${t.projectId}|${t.url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

/** Parse MC_PROBE_URLS into targets. Only http(s) URLs are accepted. */
export function configuredHttpTargets(
  env: NodeJS.ProcessEnv = process.env
): HttpProbeTarget[] {
  const raw = env.MC_PROBE_URLS;
  if (!raw) return [];
  const targets: HttpProbeTarget[] = [];
  for (const entry of raw.split(",")) {
    const [projectId, url] = entry.split("|").map((s) => s.trim());
    if (!projectId || !url) continue;
    if (!/^https?:\/\//i.test(url)) continue;
    targets.push({ projectId, label: url, url });
  }
  return targets;
}

/**
 * Resolve which targets to probe: explicit MC_PROBE_URLS config if present,
 * otherwise the committed defaults. Returns [] only if MC_PROBE_URLS is set to
 * something that parses to nothing.
 */
export function resolveHttpTargets(
  env: NodeJS.ProcessEnv = process.env
): HttpProbeTarget[] {
  if (env.MC_PROBE_URLS) return configuredHttpTargets(env);
  return dedupeProbeTargets([
    ...DEFAULT_PROBE_TARGETS,
    ...registryProbeTargets(env),
    ...SUPPLEMENTAL_PROBE_TARGETS,
  ]);
}

export interface HttpConnectorResult extends ConnectorResult {
  byProject: Record<string, { evidenceId: string; claimId: string }>;
}

async function probeOne(
  target: HttpProbeTarget,
  now: Date
): Promise<{ evidence: Evidence; claim: Claim }> {
  const generatedAt = nowIso(now);
  const evidenceId = `ev:http:${target.projectId}`;
  const claimId = `cl:reachable:${target.projectId}`;

  let ok: boolean | null = null;
  let summary: string;
  let detail: string;
  let raw: unknown;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    const res = await fetch(target.url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);

    // A sandbox/CI egress proxy can intercept the request and return its own
    // 403 before it ever reaches the target. That is NOT the site being down —
    // it means our outbound policy blocked the host. Detect it and record
    // Unknown, never a failing health signal.
    const denyReason = res.headers.get("x-deny-reason");
    if (denyReason) {
      ok = null;
      summary = `Probe blocked by network egress policy for ${target.url}`;
      detail = `Outbound request was denied by this environment (${denyReason}), so it never reached the target. Treated as Unknown, not down. Allow this host in the environment's egress settings to enable the probe.`;
      raw = { status: res.status, denyReason, url: target.url };
    } else {
      ok = res.ok;
      summary = ok
        ? `HTTP ${res.status} — ${target.url} is reachable`
        : `HTTP ${res.status} — ${target.url} responded with an error`;
      detail = "Reachability only. A 2xx response does not prove the product works.";
      raw = { status: res.status, url: target.url };
    }
  } catch (err) {
    // A network/egress failure is NOT proof the site is down — it may be our
    // outbound policy. Record it as Unknown, not a failed health check.
    ok = null;
    summary = `Probe could not run for ${target.url}`;
    detail =
      "The probe did not complete (timeout or blocked egress). Treated as Unknown, not down.";
    raw = { error: err instanceof Error ? err.message : String(err) };
  }

  const evidence: Evidence = {
    id: evidenceId,
    kind: "http-probe",
    source: { type: "http", label: target.label, ref: target.url },
    observedAt: generatedAt,
    ttlSeconds: PROBE_TTL_SECONDS,
    summary,
    detail,
    ok,
    raw,
  };

  const claim: Claim = {
    id: claimId,
    subject: `project:${target.projectId}`,
    statement: summary,
    status: claimStatusFromEvidence([evidence], now),
    confidence: ok === true ? "medium" : ok === false ? "medium" : "none",
    evidenceIds: [evidenceId],
    freshness: computeFreshness(generatedAt, PROBE_TTL_SECONDS, now),
    definition:
      "HTTP GET to a configured public URL, no credentials. Verifies reachability, not product correctness.",
    generatedAt,
  };

  return { evidence, claim };
}

export async function httpProbeConnector(
  now: Date = new Date(),
  targets: HttpProbeTarget[] = resolveHttpTargets()
): Promise<HttpConnectorResult> {
  const result: HttpConnectorResult = { evidence: [], claims: [], byProject: {} };
  if (targets.length === 0) return result;

  const probes = await Promise.all(targets.map((t) => probeOne(t, now)));
  for (let i = 0; i < probes.length; i++) {
    const { evidence, claim } = probes[i];
    result.evidence.push(evidence);
    result.claims.push(claim);
    result.byProject[targets[i].projectId] = {
      evidenceId: evidence.id,
      claimId: claim.id,
    };
  }
  return result;
}
