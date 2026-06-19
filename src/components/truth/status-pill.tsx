// Status pill — the shared visual vocabulary for truth states. Green is earned:
// only "verified"/"online"/"healthy"/"fresh" render green. Everything
// unverified, unknown, or stale renders neutral/amber, and failures render red.

import type {
  AgentStatus,
  Freshness,
  GlobalStatusLevel,
  ProjectState,
  VerificationStatus,
} from "@/lib/truth/types";

export type Tone = "green" | "amber" | "red" | "slate" | "violet";

const TONE_CLASSES: Record<Tone, string> = {
  green: "bg-aurora-500/15 text-aurora-300 border-aurora-500/40",
  amber: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  red: "bg-red-500/15 text-red-300 border-red-500/40",
  slate: "bg-slate-500/15 text-slate-300 border-slate-500/40",
  violet: "bg-violet-500/15 text-violet-300 border-violet-500/40",
};

const TONE_DOT: Record<Tone, string> = {
  green: "bg-aurora-400 shadow-[0_0_8px_rgba(84,240,193,0.8)]",
  amber: "bg-amber-400",
  red: "bg-red-400",
  slate: "bg-slate-400",
  violet: "bg-violet-400",
};

export function StatusPill({
  tone,
  label,
  dot = true,
  title,
}: {
  tone: Tone;
  label: string;
  dot?: boolean;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold leading-tight ${TONE_CLASSES[tone]}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[tone]}`} />}
      {label}
    </span>
  );
}

export function verificationTone(status: VerificationStatus): Tone {
  switch (status) {
    case "verified":
      return "green";
    case "stale":
      return "amber";
    case "unverified":
      return "amber";
    case "unknown":
    default:
      return "slate";
  }
}

export function freshnessTone(f: Freshness): Tone {
  switch (f.state) {
    case "fresh":
      return "green";
    case "stale":
      return "amber";
    case "unknown":
    default:
      return "slate";
  }
}

export function agentTone(status: AgentStatus): Tone {
  switch (status) {
    case "online":
      return "green";
    case "degraded":
      return "amber";
    case "offline":
      return "red";
    case "unknown":
    default:
      return "slate";
  }
}

export function projectTone(state: ProjectState): Tone {
  switch (state) {
    case "healthy":
      return "green";
    case "degraded":
      return "amber";
    case "broken":
      return "red";
    case "archived":
      return "slate";
    case "unknown":
    default:
      return "slate";
  }
}

export function globalTone(level: GlobalStatusLevel): Tone {
  switch (level) {
    case "all_clear":
      return "green";
    case "attention":
      return "amber";
    case "degraded":
      return "amber";
    case "critical":
      return "red";
    case "unknown":
    default:
      return "slate";
  }
}

export function freshnessLabel(f: Freshness): string {
  if (f.state === "fresh") return "Fresh";
  if (f.state === "stale") return "Stale";
  return "Unknown freshness";
}
