// GitHub connector — fetches latest commit, branch, and CI status for registered
// repos. Public repos work without a token; GITHUB_TOKEN raises rate limits.

import type { Claim, ConnectorResult, Evidence } from "../types";
import { claimStatusFromEvidence } from "../rules";
import { computeFreshness } from "../ttl";
import { nowIso } from "../time";
import { loadRegistry, type RegistryProject } from "../registry";

const GITHUB_TTL_SECONDS = 15 * 60; // 15 min
const GITHUB_TIMEOUT_MS = 5000;

export interface GitHubRepoSnapshot {
  projectId: string;
  owner: string;
  repo: string;
  defaultBranch: string;
  latestSha: string;
  latestMessage: string;
  latestAuthor: string;
  latestAt: string;
  ciState: "success" | "failure" | "pending" | "unknown";
  ciDescription: string;
}

export interface GitHubConnectorResult extends ConnectorResult {
  byProject: Record<
    string,
    {
      commitEvidenceId: string;
      ciEvidenceId: string;
      snapshot: GitHubRepoSnapshot;
    }
  >;
}

export function parseGitHubRepoUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/i);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

function githubHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "mission-control-truth-cockpit",
  };
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function githubFetch(path: string): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GITHUB_TIMEOUT_MS);
    const res = await fetch(`https://api.github.com${path}`, {
      headers: githubHeaders(),
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    if (res.status === 403 || res.status === 404) return null;
    if (!res.ok) return null;
    return res;
  } catch {
    return null;
  }
}

async function fetchRepoSnapshot(project: RegistryProject): Promise<GitHubRepoSnapshot | null> {
  if (!project.repoUrl) return null;
  const parsed = parseGitHubRepoUrl(project.repoUrl);
  if (!parsed) return null;

  const repoRes = await githubFetch(`/repos/${parsed.owner}/${parsed.repo}`);
  if (!repoRes) return null;
  const repoData = (await repoRes.json()) as { default_branch?: string };
  const defaultBranch = repoData.default_branch ?? "main";

  const commitRes = await githubFetch(
    `/repos/${parsed.owner}/${parsed.repo}/commits/${defaultBranch}?per_page=1`
  );
  if (!commitRes) return null;
  const commitData = (await commitRes.json()) as {
    sha?: string;
    commit?: { message?: string; author?: { date?: string; name?: string } };
  };

  const sha = commitData.sha ?? "";
  if (!sha) return null;

  let ciState: GitHubRepoSnapshot["ciState"] = "unknown";
  let ciDescription = "CI status not available";

  const statusRes = await githubFetch(`/repos/${parsed.owner}/${parsed.repo}/commits/${sha}/status`);
  if (statusRes) {
    const statusData = (await statusRes.json()) as {
      state?: string;
      statuses?: { description?: string }[];
    };
    const state = statusData.state ?? "unknown";
    if (state === "success") {
      ciState = "success";
      ciDescription = "Combined CI status: success";
    } else if (state === "failure" || state === "error") {
      ciState = "failure";
      ciDescription = `Combined CI status: ${state}`;
    } else if (state === "pending") {
      ciState = "pending";
      ciDescription = "Combined CI status: pending";
    }
  }

  return {
    projectId: project.id,
    owner: parsed.owner,
    repo: parsed.repo,
    defaultBranch,
    latestSha: sha.slice(0, 7),
    latestMessage: (commitData.commit?.message ?? "").split("\n")[0].slice(0, 120),
    latestAuthor: commitData.commit?.author?.name ?? "unknown",
    latestAt: commitData.commit?.author?.date ?? new Date().toISOString(),
    ciState,
    ciDescription,
  };
}

export async function githubConnector(now: Date = new Date()): Promise<GitHubConnectorResult> {
  const generatedAt = nowIso(now);
  const registry = loadRegistry().filter((p) => p.repoUrl);
  const evidence: Evidence[] = [];
  const claims: Claim[] = [];
  const byProject: GitHubConnectorResult["byProject"] = {};

  const snapshots = await Promise.all(registry.map((p) => fetchRepoSnapshot(p)));

  for (const snapshot of snapshots) {
    if (!snapshot) continue;

    const commitEvidenceId = `ev:github:commit:${snapshot.projectId}`;
    const ciEvidenceId = `ev:github:ci:${snapshot.projectId}`;
    const commitClaimId = `cl:github:commit:${snapshot.projectId}`;
    const ciClaimId = `cl:github:ci:${snapshot.projectId}`;

    const commitEvidence: Evidence = {
      id: commitEvidenceId,
      kind: "manual",
      source: {
        type: "http",
        label: `GitHub API (${snapshot.owner}/${snapshot.repo})`,
        ref: `https://github.com/${snapshot.owner}/${snapshot.repo}/commit/${snapshot.latestSha}`,
      },
      observedAt: generatedAt,
      ttlSeconds: GITHUB_TTL_SECONDS,
      summary: `${snapshot.defaultBranch} @ ${snapshot.latestSha}: ${snapshot.latestMessage}`,
      detail: `Author: ${snapshot.latestAuthor} · ${snapshot.latestAt}`,
      ok: true,
      raw: snapshot,
    };

    const ciOk =
      snapshot.ciState === "success"
        ? true
        : snapshot.ciState === "failure"
          ? false
          : null;

    const ciEvidence: Evidence = {
      id: ciEvidenceId,
      kind: "test-result",
      source: {
        type: "http",
        label: `GitHub CI (${snapshot.owner}/${snapshot.repo})`,
        ref: `https://github.com/${snapshot.owner}/${snapshot.repo}/actions`,
      },
      observedAt: generatedAt,
      ttlSeconds: GITHUB_TTL_SECONDS,
      summary: ciDescription(snapshot),
      detail: snapshot.ciDescription,
      ok: ciOk,
      raw: { ciState: snapshot.ciState },
    };

    evidence.push(commitEvidence, ciEvidence);

    claims.push({
      id: commitClaimId,
      subject: `project:${snapshot.projectId}`,
      statement: `Latest commit on ${snapshot.defaultBranch}: ${snapshot.latestSha}`,
      status: claimStatusFromEvidence([commitEvidence], now),
      confidence: "medium",
      evidenceIds: [commitEvidenceId],
      freshness: computeFreshness(generatedAt, GITHUB_TTL_SECONDS, now),
      definition: "Latest commit SHA from GitHub API on the repo default branch.",
      generatedAt,
    });

    claims.push({
      id: ciClaimId,
      subject: `project:${snapshot.projectId}`,
      statement: snapshot.ciDescription,
      status: claimStatusFromEvidence([ciEvidence], now),
      confidence: ciOk === true ? "medium" : "low",
      evidenceIds: [ciEvidenceId],
      freshness: computeFreshness(generatedAt, GITHUB_TTL_SECONDS, now),
      definition: "Combined commit status from GitHub Checks API.",
      generatedAt,
    });

    byProject[snapshot.projectId] = {
      commitEvidenceId,
      ciEvidenceId,
      snapshot,
    };
  }

  return { evidence, claims, byProject };
}

function ciDescription(snapshot: GitHubRepoSnapshot): string {
  switch (snapshot.ciState) {
    case "success":
      return `CI passing on ${snapshot.latestSha}`;
    case "failure":
      return `CI failing on ${snapshot.latestSha}`;
    case "pending":
      return `CI pending on ${snapshot.latestSha}`;
    default:
      return `CI status unknown for ${snapshot.latestSha}`;
  }
}
