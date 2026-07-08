import type { MissionControlSnapshot } from "@/lib/truth/types";
import { nvidiaChat, isNvidiaConfigured } from "./nvidia";
import {
  buildSnapshotDigest,
  buildBriefingSystemPrompt,
  buildBriefingUserPrompt,
  buildFallbackBriefing,
  parseBriefingJson,
  type ExecutiveBriefing,
} from "./briefing-prompt";

export type { ExecutiveBriefing, BriefingSection } from "./briefing-prompt";

export interface BriefingResult {
  briefing: ExecutiveBriefing;
  configured: boolean;
  model: string | null;
}

export async function generateExecutiveBriefing(
  snapshot: MissionControlSnapshot
): Promise<BriefingResult> {
  if (!isNvidiaConfigured()) {
    return {
      briefing: buildFallbackBriefing(snapshot),
      configured: false,
      model: null,
    };
  }

  const model = process.env.NVIDIA_MODEL ?? "meta/llama-3.1-8b-instruct";

  try {
    const digest = buildSnapshotDigest(snapshot);
    const raw = await nvidiaChat(
      [
        { role: "system", content: buildBriefingSystemPrompt() },
        { role: "user", content: buildBriefingUserPrompt(digest) },
      ],
      { model, maxTokens: 1400, temperature: 0.25 }
    );

    const briefing = parseBriefingJson(raw, snapshot);
    return { briefing, configured: true, model };
  } catch {
    // AI failed — degrade to rule-based briefing, never fake an AI success.
    const fallback = buildFallbackBriefing(snapshot);
    fallback.headline = `[AI unavailable] ${fallback.headline}`;
    return { briefing: fallback, configured: true, model };
  }
}
