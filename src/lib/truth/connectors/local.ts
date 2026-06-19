import fs from "node:fs";
import type { Evidence } from "../types";
import { TTL } from "../ttl";

export function collectLocalPathEvidence(projects: Array<{ id: string; name: string; localPath?: string }>, now = new Date()): Evidence[] {
  if (process.env.ENABLE_LOCAL_PROBES !== "true") {
    return projects
      .filter((project) => project.localPath)
      .map((project) => ({
        id: `evidence.local_path.${project.id}`,
        sourceType: "local_file",
        sourceName: "Local path probe disabled",
        subjectType: "project",
        subjectId: project.id,
        capturedAt: now.toISOString(),
        ttlSeconds: TTL.localFile,
        status: "unknown",
        confidence: "unknown",
        summary: `${project.name} local path not checked; ENABLE_LOCAL_PROBES is not true`,
      }));
  }

  return projects
    .filter((project) => project.localPath)
    .map((project) => {
      let exists = false;
      try {
        exists = Boolean(project.localPath && fs.existsSync(project.localPath));
      } catch {
        exists = false;
      }
      return {
        id: `evidence.local_path.${project.id}`,
        sourceType: "local_file",
        sourceName: "Local path exists check",
        subjectType: "project",
        subjectId: project.id,
        capturedAt: now.toISOString(),
        ttlSeconds: TTL.localFile,
        status: exists ? "verified" : "unknown",
        confidence: exists ? "medium" : "unknown",
        summary: exists ? `${project.name} local path exists` : `${project.name} local path not verified in this runtime`,
      } satisfies Evidence;
    });
}
