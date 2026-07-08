import { getDb } from "@/lib/db/sqlite";
import { tasks as fallbackTasks, type Task } from "@/data/tasks";

type StoreOptions = { dbPath?: string };

const MAX_TASKS = 500;

function readCommittedFallback(): Task[] {
  try {
    // tasks are imported via module — use fallbackTasks directly
    return fallbackTasks;
  } catch {
    return [];
  }
}

function rowToTask(row: {
  id: string;
  title: string;
  description: string | null;
  project: string;
  assignee: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  blocked_reason: string | null;
  tags: string | null;
}): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    project: row.project,
    assignee: row.assignee as Task["assignee"],
    status: row.status as Task["status"],
    priority: row.priority as Task["priority"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at ?? undefined,
    blockedReason: row.blocked_reason ?? undefined,
    tags: row.tags ? (JSON.parse(row.tags) as string[]) : undefined,
  };
}

function insertTask(db: ReturnType<typeof getDb>, task: Task) {
  db.prepare(
    `INSERT OR REPLACE INTO tasks
     (id, title, description, project, assignee, status, priority, created_at, updated_at, completed_at, blocked_reason, tags)
     VALUES (@id, @title, @description, @project, @assignee, @status, @priority, @createdAt, @updatedAt, @completedAt, @blockedReason, @tags)`
  ).run({
    id: task.id,
    title: task.title,
    description: task.description ?? null,
    project: task.project,
    assignee: task.assignee,
    status: task.status,
    priority: task.priority,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    completedAt: task.completedAt ?? null,
    blockedReason: task.blockedReason ?? null,
    tags: task.tags ? JSON.stringify(task.tags) : null,
  });
}

export async function readTasks(options: StoreOptions = {}): Promise<Task[]> {
  const db = getDb(options.dbPath);
  const count = db.prepare(`SELECT COUNT(*) as c FROM tasks`).get() as { c: number };

  if (count.c === 0) {
    const fallback = readCommittedFallback();
    for (const task of fallback) {
      insertTask(db, task);
    }
    return fallback;
  }

  const rows = db
    .prepare(`SELECT * FROM tasks ORDER BY updated_at DESC LIMIT ?`)
    .all(MAX_TASKS) as Parameters<typeof rowToTask>[0][];
  return rows.map(rowToTask);
}

export async function updateTaskStatus(
  id: string,
  status: Task["status"],
  extras: { blockedReason?: string; completedAt?: string } = {},
  options: StoreOptions = {}
): Promise<Task | null> {
  const db = getDb(options.dbPath);
  const row = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id) as
    | Parameters<typeof rowToTask>[0]
    | undefined;
  if (!row) return null;

  const now = new Date().toISOString();
  const task = rowToTask(row);
  const next: Task = {
    ...task,
    status,
    updatedAt: now,
    completedAt: status === "done" ? extras.completedAt ?? now : undefined,
    blockedReason: status === "blocked" ? extras.blockedReason ?? task.blockedReason : undefined,
  };
  insertTask(db, next);
  return next;
}

export async function createTask(
  input: {
    title: string;
    project: string;
    assignee?: Task["assignee"];
    priority?: Task["priority"];
    description?: string;
    tags?: string[];
  },
  options: StoreOptions = {}
): Promise<Task> {
  const db = getDb(options.dbPath);
  const now = new Date().toISOString();
  const slug = input.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40);
  const id = `${slug}-${Date.now().toString(36)}`;

  const task: Task = {
    id,
    title: input.title.trim(),
    description: input.description,
    project: input.project,
    assignee: input.assignee ?? "justin",
    status: "todo",
    priority: input.priority ?? "medium",
    createdAt: now,
    updatedAt: now,
    tags: input.tags,
  };

  insertTask(db, task);
  return task;
}
