// Render probe connector — lightweight browser-render proof.
//
// Fetches public HTML and checks for expected content markers. This is not full
// Playwright (no JS execution), but proves the surface returns renderable content
// with expected copy — stronger than HTTP reachability alone.

import type { Claim, ConnectorResult, Evidence } from "../types";
import { claimStatusFromEvidence } from "../rules";
import { computeFreshness } from "../ttl";
import { nowIso } from "../time";
import { loadEffectiveRegistry } from "../registry-store";

export interface RenderProbeTarget {
  projectId: string;
  label: string;
  url: string;
  /** At least one marker must appear in the response body (case-insensitive). */
  markers: string[];
}

const RENDER_TTL_SECONDS = 15 * 60;
const RENDER_TIMEOUT_MS = 6000;
const MAX_BODY_CHARS = 500_000;

/** Committed render probes with markers tuned per surface. */
export const DEFAULT_RENDER_TARGETS: RenderProbeTarget[] = [
  {
    projectId: "fleet-intel",
    label: "Fleet Intel HTML render",
    url: "https://fleetintel.net",
    markers: ["fleet", "carrier", "fmcsa"],
  },
  {
    projectId: "public-data",
    label: "License Reminders landing page",
    url: "https://thejustinfagan.github.io/texas-license-reminders/",
    markers: ["license", "texas", "renew"],
  },
  {
    projectId: "mission-control",
    label: "Mission Control health JSON",
    url: "https://web-production-2c48a.up.railway.app/api/health",
    markers: ["ok", "mission-control"],
  },
];

/** Parse MC_RENDER_PROBES="id|url|marker1;marker2,id2|url2|marker" */
export function configuredRenderTargets(env: NodeJS.ProcessEnv = process.env): RenderProbeTarget[] {
  const raw = env.MC_RENDER_PROBES;
  if (!raw) return [];
  const targets: RenderProbeTarget[] = [];
  for (const entry of raw.split(",")) {
    const parts = entry.split("|").map((s) => s.trim());
    const [projectId, url, markerStr] = parts;
    if (!projectId || !url || !markerStr) continue;
    if (!/^https?:\/\//i.test(url)) continue;
    const markers = markerStr.split(";").map((m) => m.trim()).filter(Boolean);
    if (markers.length === 0) continue;
    targets.push({ projectId, label: url, url, markers });
  }
  return targets;
}

export function registryRenderTargets(): RenderProbeTarget[] {
  const registry = loadEffectiveRegistry();
  const targets: RenderProbeTarget[] = [];
  for (const project of registry) {
    if (!project.liveUrl) continue;
    let url = project.liveUrl;
    if (project.id === "mission-control") {
      url = url.replace(/\/?$/, "/api/health");
    }
    // Twitter/social surfaces — skip render probe (not HTML product pages)
    if (/twitter\.com|x\.com/i.test(url)) continue;
    targets.push({
      projectId: project.id,
      label: `${project.name} render probe`,
      url,
      markers: [project.name.split(" ")[0].toLowerCase(), project.id.replace(/-/g, " ")],
    });
  }
  return targets;
}

function dedupeRenderTargets(targets: RenderProbeTarget[]): RenderProbeTarget[] {
  const seen = new Set<string>();
  const out: RenderProbeTarget[] = [];
  for (const t of targets) {
    const key = `${t.projectId}|${t.url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

export function resolveRenderTargets(env: NodeJS.ProcessEnv = process.env): RenderProbeTarget[] {
  if (env.MC_RENDER_PROBES) return configuredRenderTargets(env);
  return dedupeRenderTargets([...DEFAULT_RENDER_TARGETS, ...registryRenderTargets()]);
}

export interface RenderConnectorResult extends ConnectorResult {
  byProject: Record<string, { evidenceId: string; claimId: string }>;
}

function bodyContainsMarker(body: string, markers: string[]): string | null {
  const lower = body.toLowerCase();
  for (const marker of markers) {
    if (lower.includes(marker.toLowerCase())) return marker;
  }
  return null;
}

async function probeRenderOne(
  target: RenderProbeTarget,
  now: Date
): Promise<{ evidence: Evidence; claim: Claim }> {
  const generatedAt = nowIso(now);
  const evidenceId = `ev:render:${target.projectId}`;
  const claimId = `cl:render:${target.projectId}`;

  let ok: boolean | null = null;
  let summary: string;
  let detail: string;
  let raw: unknown;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), RENDER_TIMEOUT_MS);
    const res = await fetch(target.url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "text/html,application/json,*/*" },
    });
    clearTimeout(timer);

    const denyReason = res.headers.get("x-deny-reason");
    if (denyReason) {
      ok = null;
      summary = `Render probe blocked by egress policy for ${target.url}`;
      detail = `Denied (${denyReason}). Treated as Unknown.`;
      raw = { status: res.status, denyReason };
    } else if (!res.ok) {
      ok = false;
      summary = `Render probe HTTP ${res.status} for ${target.url}`;
      detail = "Non-2xx response — surface may not be rendering.";
      raw = { status: res.status };
    } else {
      const body = (await res.text()).slice(0, MAX_BODY_CHARS);
      const matched = bodyContainsMarker(body, target.markers);
      if (matched) {
        ok = true;
        summary = `Render proof PASS — found "${matched}" in ${target.url}`;
        detail = `HTML/JSON body contains expected marker. Lightweight render probe (no JS execution).`;
      } else {
        ok = false;
        summary = `Render proof FAIL — no markers in ${target.url}`;
        detail = `Expected one of: ${target.markers.join(", ")}`;
      }
      raw = { status: res.status, matched, markers: target.markers, bodyLength: body.length };
    }
  } catch (err) {
    ok = null;
    summary = `Render probe could not run for ${target.url}`;
    detail = "Timeout or network error. Treated as Unknown.";
    raw = { error: err instanceof Error ? err.message : String(err) };
  }

  const evidence: Evidence = {
    id: evidenceId,
    kind: "browser-render",
    source: { type: "browser", label: target.label, ref: target.url },
    observedAt: generatedAt,
    ttlSeconds: RENDER_TTL_SECONDS,
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
    freshness: computeFreshness(generatedAt, RENDER_TTL_SECONDS, now),
    definition:
      "Fetches public HTML/JSON and checks for expected content markers. Lightweight render proof — not full browser automation.",
    generatedAt,
  };

  return { evidence, claim };
}

export async function renderProbeConnector(
  now: Date = new Date(),
  targets: RenderProbeTarget[] = resolveRenderTargets()
): Promise<RenderConnectorResult> {
  const result: RenderConnectorResult = { evidence: [], claims: [], byProject: {} };
  if (targets.length === 0) return result;

  const probes = await Promise.all(targets.map((t) => probeRenderOne(t, now)));
  for (let i = 0; i < probes.length; i++) {
    const { evidence, claim } = probes[i];
    result.evidence.push(evidence);
    result.claims.push(claim);
    result.byProject[targets[i].projectId] = { evidenceId: evidence.id, claimId: claim.id };
  }
  return result;
}
