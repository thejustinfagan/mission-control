export type LegacyIncompleteItem = { project: string; completed: boolean; task: string };

export function normalizeIncomplete(incomplete: unknown): LegacyIncompleteItem[] {
  if (!Array.isArray(incomplete)) return [];
  return incomplete.map((item) => {
    if (typeof item === "string") {
      return { project: "Legacy STATUS.md", completed: false, task: item };
    }
    if (item && typeof item === "object") {
      const row = item as Partial<LegacyIncompleteItem>;
      return {
        project: typeof row.project === "string" ? row.project : "Legacy STATUS.md",
        completed: Boolean(row.completed),
        task: typeof row.task === "string" ? row.task : "Unspecified legacy task",
      };
    }
    return { project: "Legacy STATUS.md", completed: false, task: "Unspecified legacy task" };
  });
}
