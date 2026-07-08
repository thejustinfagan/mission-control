import { getDb } from "@/lib/db/sqlite";

export interface SweepItem {
  title: string;
  detail: string;
  priority?: "high" | "medium" | "low";
}

export interface NightlySweepReport {
  id: string;
  generatedAt: string;
  headline: string;
  overallAssessment: string;
  staleProjects: SweepItem[];
  risks: SweepItem[];
  promote: SweepItem[];
  pause: SweepItem[];
  kill: SweepItem[];
  nextActions: SweepItem[];
  osCritique: string;
  aiGenerated: boolean;
}

type StoreOptions = { dbPath?: string };

const MAX_REPORTS = 30;

export async function readLatestSweep(options: StoreOptions = {}): Promise<NightlySweepReport | null> {
  const db = getDb(options.dbPath);
  const row = db
    .prepare(`SELECT report_json FROM sweep_reports ORDER BY generated_at DESC LIMIT 1`)
    .get() as { report_json: string } | undefined;
  if (!row) return null;
  return JSON.parse(row.report_json) as NightlySweepReport;
}

export async function readSweepHistory(
  limit = 7,
  options: StoreOptions = {}
): Promise<NightlySweepReport[]> {
  const db = getDb(options.dbPath);
  const rows = db
    .prepare(`SELECT report_json FROM sweep_reports ORDER BY generated_at DESC LIMIT ?`)
    .all(limit) as { report_json: string }[];
  return rows.map((r) => JSON.parse(r.report_json) as NightlySweepReport);
}

export async function saveSweepReport(
  report: NightlySweepReport,
  options: StoreOptions = {}
): Promise<NightlySweepReport> {
  const db = getDb(options.dbPath);
  db.prepare(`INSERT INTO sweep_reports (id, generated_at, report_json) VALUES (?, ?, ?)`).run(
    report.id,
    report.generatedAt,
    JSON.stringify(report)
  );
  db.prepare(
    `DELETE FROM sweep_reports WHERE id NOT IN (
       SELECT id FROM sweep_reports ORDER BY generated_at DESC LIMIT ?
     )`
  ).run(MAX_REPORTS);
  return report;
}
