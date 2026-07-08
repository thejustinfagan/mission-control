import type { MissionControlSnapshot } from "@/lib/truth/types";
import { nvidiaChat, isNvidiaConfigured } from "./nvidia";
import {
  buildSweepSystemPrompt,
  buildSweepUserPrompt,
  buildSweepDigest,
  buildFallbackSweep,
  parseSweepJson,
} from "./sweep-prompt";
import {
  saveSweepReport,
  readLatestSweep,
  type NightlySweepReport,
} from "@/lib/truth/sweep-store";

export type { NightlySweepReport } from "@/lib/truth/sweep-store";

export interface SweepResult {
  report: NightlySweepReport;
  configured: boolean;
  model: string | null;
  cached: boolean;
}

export async function generateNightlySweep(
  snapshot: MissionControlSnapshot,
  options: { dbPath?: string; force?: boolean } = {}
): Promise<SweepResult> {
  if (!options.force) {
    const latest = await readLatestSweep({ dbPath: options.dbPath });
    if (latest) {
      const ageMs = Date.now() - new Date(latest.generatedAt).getTime();
      // Reuse sweep from the last 20 hours unless forced (cron runs nightly).
      if (ageMs < 20 * 60 * 60 * 1000) {
        return { report: latest, configured: isNvidiaConfigured(), model: null, cached: true };
      }
    }
  }

  let report: NightlySweepReport;
  let model: string | null = null;

  if (!isNvidiaConfigured()) {
    report = buildFallbackSweep(snapshot);
  } else {
    model = process.env.NVIDIA_MODEL ?? "meta/llama-3.1-8b-instruct";
    try {
      const digest = buildSweepDigest(snapshot);
      const raw = await nvidiaChat(
        [
          { role: "system", content: buildSweepSystemPrompt() },
          { role: "user", content: buildSweepUserPrompt(digest) },
        ],
        { model, maxTokens: 1600, temperature: 0.3 }
      );
      report = parseSweepJson(raw, snapshot);
    } catch {
      report = buildFallbackSweep(snapshot);
      report.headline = `[AI unavailable] ${report.headline}`;
    }
  }

  await saveSweepReport(report, { dbPath: options.dbPath });
  return { report, configured: isNvidiaConfigured(), model, cached: false };
}
