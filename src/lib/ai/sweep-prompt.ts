// Nightly sweep prompt — canonical review per operating principles.

import type { MissionControlSnapshot } from "@/lib/truth/types";
import { buildSnapshotDigest } from "./briefing-prompt";
import type { NightlySweepReport, SweepItem } from "@/lib/truth/sweep-store";

export function buildSweepSystemPrompt(): string {
  return `You are Mission Control's nightly canonical sweep agent.

Review the snapshot and produce a candid operating-system critique for Justin.

RULES:
- Only use facts from the snapshot. Do not invent progress.
- Registry status is testimony, not proof. Unknown evidence means unverified.
- Be direct about stale work, risks, and what should be promoted, paused, or killed.
- Include monetization, content, and AI-architecture angles when data supports it.

Respond with valid JSON only (no markdown fences):
{
  "headline": "one-line sweep headline",
  "overallAssessment": "2-4 sentences",
  "staleProjects": [{"title": "...", "detail": "...", "priority": "high|medium|low"}],
  "risks": [{"title": "...", "detail": "...", "priority": "high|medium|low"}],
  "promote": [{"title": "...", "detail": "..."}],
  "pause": [{"title": "...", "detail": "..."}],
  "kill": [{"title": "...", "detail": "..."}],
  "nextActions": [{"title": "...", "detail": "...", "priority": "high|medium|low"}],
  "osCritique": "how Justin and the agents can improve the operating system"
}`;
}

export function buildSweepUserPrompt(digest: string): string {
  return `Run the nightly canonical sweep on this Mission Control snapshot:

${digest}

Review: code health, project progress, stale work, blockers, monetization paths, content opportunities, what to promote/pause/kill, and agent/OS improvements.`;
}

export function buildFallbackSweep(snapshot: MissionControlSnapshot): NightlySweepReport {
  const staleProjects: SweepItem[] = snapshot.projects
    .filter((p) => p.state === "unknown" || !p.verified)
    .slice(0, 5)
    .map((p) => ({
      title: p.name,
      detail: `${p.stateLabel}. Registry: ${p.registryStatus ?? "n/a"}. No fresh health proof.`,
      priority: "medium" as const,
    }));

  const risks: SweepItem[] = snapshot.incidents
    .filter((i) => i.state === "open")
    .slice(0, 5)
    .map((i) => ({
      title: i.title,
      detail: i.detail,
      priority: (i.severity === "critical" || i.severity === "high" ? "high" : "medium") as
        | "high"
        | "medium"
        | "low",
    }));

  const nextActions: SweepItem[] = snapshot.justinQueue.slice(0, 5).map((a) => ({
    title: a.title,
    detail: a.detail,
    priority: a.priority,
  }));

  return {
    id: `sweep:${snapshot.generatedAt}`,
    generatedAt: snapshot.generatedAt,
    headline: `Sweep: ${snapshot.summary.openIncidents} open risks, ${snapshot.summary.unknown} unverified projects`,
    overallAssessment: snapshot.globalStatus.rationale,
    staleProjects,
    risks,
    promote: snapshot.projects
      .filter((p) => p.id === "public-data" || p.id === "fleet-intel")
      .map((p) => ({ title: p.name, detail: p.summary })),
    pause: [],
    kill: [],
    nextActions,
    osCritique:
      snapshot.agents.every((a) => a.status === "unknown")
        ? "Wire Barry heartbeat and activity push — the cockpit cannot steer blind."
        : "Continue feeding evidence; expand probes and nightly sweeps.",
    aiGenerated: false,
  };
}

export function parseSweepJson(raw: string, snapshot: MissionControlSnapshot): NightlySweepReport {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const parsed = JSON.parse(cleaned) as Partial<NightlySweepReport>;

  const items = (arr: SweepItem[] | undefined): SweepItem[] =>
    (arr ?? []).map((item) => ({
      title: item.title ?? "Untitled",
      detail: item.detail ?? "",
      priority: item.priority,
    }));

  return {
    id: `sweep:${snapshot.generatedAt}`,
    generatedAt: snapshot.generatedAt,
    headline: parsed.headline ?? "Nightly sweep complete",
    overallAssessment: parsed.overallAssessment ?? snapshot.globalStatus.rationale,
    staleProjects: items(parsed.staleProjects),
    risks: items(parsed.risks),
    promote: items(parsed.promote),
    pause: items(parsed.pause),
    kill: items(parsed.kill),
    nextActions: items(parsed.nextActions),
    osCritique: parsed.osCritique ?? "No OS critique provided.",
    aiGenerated: true,
  };
}

export function buildSweepDigest(snapshot: MissionControlSnapshot): string {
  return buildSnapshotDigest(snapshot);
}
