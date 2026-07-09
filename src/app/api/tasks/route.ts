import { NextRequest, NextResponse } from "next/server";
import { readTasks, updateTaskStatus, createTask } from "@/lib/truth/task-store";
import type { Task } from "@/data/tasks";
import { verifyHumanBasicAuth, unauthorizedResponse } from "@/lib/truth/access-control";

const VALID_STATUSES: Task["status"][] = ["todo", "in-progress", "blocked", "done"];

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  if (!verifyHumanBasicAuth(request)) return unauthorizedResponse();
  const tasks = await readTasks();
  return NextResponse.json(tasks);
}

/** Create a task: { title, project, assignee?, priority?, description? } */
export async function POST(request: NextRequest) {
  if (!verifyHumanBasicAuth(request)) return unauthorizedResponse();

  try {
    const body = await request.json();

    // Status update (legacy): { id, status }
    if (body.id && body.status) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      const updated = await updateTaskStatus(body.id, body.status, {
        blockedReason: body.blockedReason,
        completedAt: body.completedAt,
      });
      if (!updated) return NextResponse.json({ error: "Task not found" }, { status: 404 });
      return NextResponse.json(updated);
    }

    // Create
    if (!body.title?.trim() || !body.project?.trim()) {
      return NextResponse.json({ error: "Missing title or project" }, { status: 400 });
    }

    const task = await createTask({
      title: body.title,
      project: body.project,
      assignee: body.assignee,
      priority: body.priority,
      description: body.description,
      tags: body.tags,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request", detail: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }
}

/** Patch task status: { id, status, blockedReason? } */
export async function PATCH(request: NextRequest) {
  if (!verifyHumanBasicAuth(request)) return unauthorizedResponse();

  try {
    const body = await request.json();
    if (!body.id || !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Missing or invalid id/status" }, { status: 400 });
    }
    const updated = await updateTaskStatus(body.id, body.status, {
      blockedReason: body.blockedReason,
    });
    if (!updated) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request", detail: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }
}
