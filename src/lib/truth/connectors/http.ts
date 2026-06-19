import type { Evidence } from "../types";
import { TTL } from "../ttl";

export async function collectHttpEvidence(now = new Date()): Promise<Evidence[]> {
  const url = process.env.MISSION_CONTROL_LIVE_URL;
  if (!url) {
    return [
      {
        id: "evidence.http.mission_control_live_url_missing",
        sourceType: "http_probe",
        sourceName: "MISSION_CONTROL_LIVE_URL",
        subjectType: "system",
        subjectId: "mission-control-live-url",
        capturedAt: now.toISOString(),
        ttlSeconds: TTL.httpProbe,
        status: "unknown",
        confidence: "unknown",
        summary: "No Mission Control live URL configured for HTTP proof",
      },
    ];
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
    return [
      {
        id: "evidence.http.mission_control_live_url",
        sourceType: "http_probe",
        sourceName: "Configured Mission Control live URL",
        subjectType: "system",
        subjectId: "mission-control-live-url",
        capturedAt: now.toISOString(),
        ttlSeconds: TTL.httpProbe,
        status: response.ok ? "verified" : "failed",
        confidence: "medium",
        summary: `HTTP probe returned ${response.status}`,
        artifactUrl: url,
        metadata: { statusCode: response.status },
      },
    ];
  } catch (error) {
    return [
      {
        id: "evidence.http.mission_control_live_url",
        sourceType: "http_probe",
        sourceName: "Configured Mission Control live URL",
        subjectType: "system",
        subjectId: "mission-control-live-url",
        capturedAt: now.toISOString(),
        ttlSeconds: TTL.httpProbe,
        status: "failed",
        confidence: "medium",
        summary: "HTTP probe failed or timed out",
        artifactUrl: url,
        details: error instanceof Error ? error.message : "Unknown HTTP probe error",
      },
    ];
  } finally {
    clearTimeout(timeout);
  }
}
