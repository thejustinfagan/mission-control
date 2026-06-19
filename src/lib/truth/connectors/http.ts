// HTTP probe connector.
//
// Probes ONLY explicitly-configured public URLs, with NO credentials. A 2xx
// response proves the URL is *reachable* — it does NOT prove the product works
// (deploy green ≠ working). So http evidence creates reachability claims and
// proof-feed entries; it never marks a project verified-healthy. Only rendered
// browser/test evidence can do that.
//
// Configure via env: MC_PROBE_URLS="projectId|https://url,projectId|https://url"
// When unset, this connector is a no-op (everything stays Unknown).

import type { Claim, ConnectorResult, Evidence } from "../types";
import { claimStatusFromEvidence } from "../rules";
import { nowIso } from "../time";
import { computeFreshness } from "../ttl";

export interface HttpProbeTarget {
  projectId: string;
  label: string;
  url: string;
}

const PROBE_TTL_SECONDS = 300; // a reachability check is fresh for 5 minutes
const PROBE_TIMEOUT_MS = 4000;

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
    ok = res.ok;
    summary = ok
      ? `HTTP ${res.status} — ${target.url} is reachable`
      : `HTTP ${res.status} — ${target.url} responded with an error`;
    detail = "Reachability only. A 2xx response does not prove the product works.";
    raw = { status: res.status, url: target.url };
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
  targets: HttpProbeTarget[] = configuredHttpTargets()
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
