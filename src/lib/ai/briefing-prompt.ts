// Builds a compact, evidence-aware prompt from a Mission Control snapshot.
// Pure function — fully testable without calling NVIDIA.

import type { MissionControlSnapshot } from "@/lib/truth/types";

export interface BriefingSection {
  id: string;
  question: string;
  answer: string;
  priority: "high" | "medium" | "low";
}

export interface ExecutiveBriefing {
  generatedAt: string;
  headline: string;
  overallAssessment: string;
  sections: BriefingSection[];
  recommendations: string[];
  /** True when parsed from AI JSON; false for rule-based fallback. */
  aiGenerated: boolean;
}

const NORTH_STAR_QUESTIONS: { id: string; question: string }[] = [
  { id: "moving", question: "What is moving?" },
  { id: "stuck", question: "What is stuck?" },
  { id: "needs-justin", question: "What needs Justin?" },
  { id: "agent-progress", question: "What made progress without Justin?" },
  { id: "money", question: "What can make money?" },
  { id: "thought-leadership", question: "What builds thought leadership?" },
  { id: "kill", question: "What should be killed or paused?" },
  { id: "learned", question: "What did the agents learn?" },
  { id: "os-improving", question: "How is the operating system improving?" },
];

/** Compact snapshot digest for the LLM — facts only, no speculation. */
export function buildSnapshotDigest(snapshot: MissionControlSnapshot): string {
  const lines: string[] = [
    `Generated at: ${snapshot.generatedAt}`,
    `Global status: ${snapshot.globalStatus.level} — ${snapshot.globalStatus.label}`,
    `Rationale: ${snapshot.globalStatus.rationale}`,
    "",
    `Projects: ${snapshot.summary.totalProjects} total, ${snapshot.summary.verifiedHealthy} verified healthy, ${snapshot.summary.degraded} degraded, ${snapshot.summary.unknown} unknown`,
    `Open incidents: ${snapshot.summary.openIncidents}`,
    `Justin actions: ${snapshot.summary.justinActions}`,
    `Evidence: ${snapshot.freshness.freshEvidence} fresh, ${snapshot.freshness.staleEvidence} stale, ${snapshot.freshness.unknownClaims} unknown claims`,
    "",
    "=== Agents ===",
  ];

  for (const agent of snapshot.agents) {
    lines.push(`- ${agent.name} (${agent.role}): ${agent.statusLabel}`);
  }

  lines.push("", "=== Projects ===");
  for (const p of snapshot.projects) {
    const links = p.links?.map((l) => l.url).join(", ") || "no links";
    lines.push(
      `- ${p.name}: state=${p.state} verified=${p.verified} registry="${p.registryStatus ?? "n/a"}" links=${links}`
    );
  }

  lines.push("", "=== Open incidents ===");
  if (snapshot.incidents.length === 0) {
    lines.push("(none)");
  } else {
    for (const inc of snapshot.incidents.filter((i) => i.state === "open" || i.state === "investigating")) {
      lines.push(`- [${inc.severity}] ${inc.title}: ${inc.detail}`);
    }
  }

  lines.push("", "=== Justin queue (top 10) ===");
  for (const action of snapshot.justinQueue.slice(0, 10)) {
    lines.push(`- [${action.priority}] ${action.title} (${action.kind})`);
  }

  lines.push("", "=== Proof cards (gaps) ===");
  for (const card of snapshot.proofCards) {
    const unknownSlots = card.requiredSlots.filter((s) => card.slots[s].status === "unknown");
    if (unknownSlots.length > 0) {
      lines.push(`- ${card.projectName}: missing proof for ${unknownSlots.join(", ")}`);
    }
  }

  lines.push("", "=== Recent evidence (top 8) ===");
  for (const item of snapshot.proofFeed.slice(0, 8)) {
    const ok = item.ok === true ? "PASS" : item.ok === false ? "FAIL" : "n/a";
    lines.push(`- [${ok}] ${item.title} (${item.freshness.state})`);
  }

  return lines.join("\n");
}

export function buildBriefingSystemPrompt(): string {
  return `You are Mission Control's executive briefing agent for Justin's multi-lane AI operating system.

RULES:
- Answer ONLY from the snapshot data provided. Do not invent facts.
- If evidence is missing or unknown, say so explicitly — never fake green.
- Registry status is testimony, not proof. Distinguish verified vs unverified.
- Be concise, actionable, and direct. Justin reads this on mobile.
- Prioritize what needs Justin's decision today.

Respond with valid JSON only (no markdown fences):
{
  "headline": "one-line executive headline",
  "overallAssessment": "2-3 sentences on fleet health",
  "sections": [
    {"id": "moving", "question": "...", "answer": "...", "priority": "high|medium|low"}
  ],
  "recommendations": ["top 3-5 concrete next steps for Justin or agents"]
}

Include all 9 section ids: moving, stuck, needs-justin, agent-progress, money, thought-leadership, kill, learned, os-improving.`;
}

export function buildBriefingUserPrompt(digest: string): string {
  const questions = NORTH_STAR_QUESTIONS.map((q) => `- ${q.id}: ${q.question}`).join("\n");
  return `Here is the current Mission Control snapshot:

${digest}

Answer these north-star questions:
${questions}`;
}

/** Rule-based fallback when NVIDIA is unavailable — still useful, not AI. */
export function buildFallbackBriefing(snapshot: MissionControlSnapshot): ExecutiveBriefing {
  const moving = snapshot.proofFeed
    .filter((p) => p.ok === true && p.freshness.state === "fresh")
    .slice(0, 3)
    .map((p) => p.title);

  const stuck = snapshot.incidents
    .filter((i) => i.state === "open")
    .slice(0, 5)
    .map((i) => i.title);

  const needsJustin = snapshot.justinQueue.slice(0, 5).map((a) => a.title);

  const sections: BriefingSection[] = [
    {
      id: "moving",
      question: "What is moving?",
      answer: moving.length
        ? moving.join("; ")
        : "No fresh passing evidence in the proof feed. Progress is unverified — registry may be stale.",
      priority: moving.length ? "medium" : "high",
    },
    {
      id: "stuck",
      question: "What is stuck?",
      answer: stuck.length
        ? stuck.join("; ")
        : snapshot.summary.degraded > 0
          ? `${snapshot.summary.degraded} project(s) degraded with verified failing signals.`
          : "No open incidents, but most projects lack health proof (unknown state).",
      priority: stuck.length ? "high" : "medium",
    },
    {
      id: "needs-justin",
      question: "What needs Justin?",
      answer: needsJustin.length
        ? needsJustin.join("; ")
        : "Justin queue is empty.",
      priority: needsJustin.length ? "high" : "low",
    },
    {
      id: "agent-progress",
      question: "What made progress without Justin?",
      answer:
        snapshot.agents.every((a) => a.status === "unknown")
          ? "Unknown — no agent heartbeat evidence wired. Barry/Harry status cannot be verified."
          : "Check agent lanes for verified activity.",
      priority: "high",
    },
    {
      id: "money",
      question: "What can make money?",
      answer:
        "License Reminders (TX+FL, $425K potential) and Fleet Intel (free — monetization paused). See projects registry.",
      priority: "medium",
    },
    {
      id: "thought-leadership",
      question: "What builds thought leadership?",
      answer: "Beast Mode Audit (infra monitoring OSS) and Mission Control itself. No content lane tracked yet.",
      priority: "low",
    },
    {
      id: "kill",
      question: "What should be killed or paused?",
      answer:
        snapshot.summary.unknown === snapshot.summary.totalProjects
          ? "Cannot recommend kills without fresh evidence. Consider pausing projects with no activity >30 days."
          : "Review projects in unknown state with stale lastWorked dates.",
      priority: "medium",
    },
    {
      id: "learned",
      question: "What did the agents learn?",
      answer: "No agent learnings connector wired. Memory page is static.",
      priority: "medium",
    },
    {
      id: "os-improving",
      question: "How is the operating system improving?",
      answer: `Truth Cockpit v2 live with ${snapshot.summary.totalProjects} projects tracked. Missing: auto-capture, nightly sweep, agent heartbeat.`,
      priority: "medium",
    },
  ];

  return {
    generatedAt: snapshot.generatedAt,
    headline: `${snapshot.globalStatus.label} — ${snapshot.summary.justinActions} action(s) for Justin, ${snapshot.summary.unknown} projects unverified`,
    overallAssessment: snapshot.globalStatus.rationale,
    sections,
    recommendations: [
      "Wire Barry heartbeat to agent lanes",
      "Enable NVIDIA AI briefing (set NVIDIA_API_KEY on Railway)",
      needsJustin[0] ? `Top Justin action: ${needsJustin[0]}` : "Push agent activity to /api/activities",
      "Add GitHub connector to fill proof card commit/test slots",
    ].filter(Boolean) as string[],
    aiGenerated: false,
  };
}

export function parseBriefingJson(raw: string, snapshot: MissionControlSnapshot): ExecutiveBriefing {
  // Strip markdown code fences if the model adds them despite instructions.
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const parsed = JSON.parse(cleaned) as {
    headline?: string;
    overallAssessment?: string;
    sections?: BriefingSection[];
    recommendations?: string[];
  };

  const sections = (parsed.sections ?? []).map((s) => ({
    id: s.id ?? "unknown",
    question: s.question ?? "",
    answer: s.answer ?? "No answer provided.",
    priority: (["high", "medium", "low"].includes(s.priority) ? s.priority : "medium") as
      | "high"
      | "medium"
      | "low",
  }));

  return {
    generatedAt: snapshot.generatedAt,
    headline: parsed.headline ?? snapshot.globalStatus.label,
    overallAssessment: parsed.overallAssessment ?? snapshot.globalStatus.rationale,
    sections,
    recommendations: parsed.recommendations ?? [],
    aiGenerated: true,
  };
}
