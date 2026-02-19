import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createTask, getTasks, Task } from "@/data/tasks";

const ASSIGNEES: Task["assignee"][] = ["barry", "justin", "both"];
const STATUSES: Task["status"][] = ["todo", "in-progress", "blocked", "done"];
const PRIORITIES: Task["priority"][] = ["critical", "high", "medium", "low"];

function isAssignee(value: string): value is Task["assignee"] {
  return ASSIGNEES.includes(value as Task["assignee"]);
}

function isStatus(value: string): value is Task["status"] {
  return STATUSES.includes(value as Task["status"]);
}

function isPriority(value: string): value is Task["priority"] {
  return PRIORITIES.includes(value as Task["priority"]);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const assignee = searchParams.get("assignee");
  const project = searchParams.get("project");
  const status = searchParams.get("status");

  let results = getTasks();

  if (assignee && isAssignee(assignee)) {
    results = results.filter((task) => task.assignee === assignee);
  }
  if (project) {
    results = results.filter((task) => task.project === project);
  }
  if (status && isStatus(status)) {
    results = results.filter((task) => task.status === status);
  }

  return NextResponse.json({ tasks: results });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const project = typeof body.project === "string" ? body.project.trim() : "";
    const assignee = typeof body.assignee === "string" ? body.assignee : "";
    const priority = typeof body.priority === "string" ? body.priority : "";
    const status = typeof body.status === "string" ? body.status : "todo";

    if (!title || !project || !isAssignee(assignee) || !isPriority(priority)) {
      return NextResponse.json(
        { error: "title, project, assignee, and priority are required" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const task: Task = {
      id: randomUUID(),
      title,
      project,
      assignee,
      status: isStatus(status) ? status : "todo",
      priority,
      createdAt: now,
      updatedAt: now,
    };

    if (typeof body.description === "string" && body.description.trim()) {
      task.description = body.description.trim();
    }

    if (Array.isArray(body.tags)) {
      const tags = body.tags.filter((tag: unknown) => typeof tag === "string" && tag.trim());
      if (tags.length > 0) task.tags = tags;
    }

    if (task.status === "blocked" && typeof body.blockedReason === "string") {
      task.blockedReason = body.blockedReason.trim();
    }

    if (task.status === "done") {
      task.completedAt = now;
    }

    createTask(task);

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
