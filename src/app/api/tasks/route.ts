import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { tasks as fallbackTasks, type Task } from "@/data/tasks";

const STATUS_FILE = path.join("/tmp", "mission-control-status.json");
const VALID_STATUSES: Task["status"][] = ["todo", "in-progress", "blocked", "done"];

function readStatus(): any | null {
  try {
    const data = fs.readFileSync(STATUS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function writeStatus(data: any): boolean {
  try {
    fs.writeFileSync(STATUS_FILE, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error("Error writing status:", e);
    return false;
  }
}

function getStatusTasks(status: any): Task[] | null {
  if (Array.isArray(status?.tasks)) return status.tasks as Task[];
  return null;
}

export async function GET() {
  const status = readStatus();
  const tasks = getStatusTasks(status) ?? fallbackTasks;
  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = typeof body?.id === "string" ? body.id : null;
    const status = body?.status as Task["status"];

    if (!id || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Missing or invalid fields: id, status" },
        { status: 400 }
      );
    }

    const statusStore = readStatus();
    const canWriteStatus = !!statusStore && typeof statusStore === "object" && !Array.isArray(statusStore);

    if (!canWriteStatus) {
      return NextResponse.json(
        { error: "No live status store available" },
        { status: 409 }
      );
    }

    const tasks = getStatusTasks(statusStore) ?? fallbackTasks;
    const index = tasks.findIndex((task) => task.id === id);

    if (index === -1) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const current = tasks[index];
    const nextTask: Task = {
      ...current,
      status,
      updatedAt: now,
    };

    if (status === "done") {
      nextTask.completedAt = typeof body?.completedAt === "string" ? body.completedAt : now;
      nextTask.blockedReason = undefined;
    } else {
      nextTask.completedAt = undefined;
      if (status === "blocked") {
        nextTask.blockedReason = typeof body?.blockedReason === "string" ? body.blockedReason : current.blockedReason;
      } else {
        nextTask.blockedReason = undefined;
      }
    }

    const updatedTasks = [...tasks];
    updatedTasks[index] = nextTask;

    const nextStatus = {
      ...statusStore,
      tasks: updatedTasks,
      timestamp: new Date().toISOString(),
    };

    if (writeStatus(nextStatus)) {
      return NextResponse.json(nextTask);
    }

    return NextResponse.json(
      { error: "Failed to store task update" },
      { status: 500 }
    );
  } catch (e) {
    console.error("POST error:", e);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
