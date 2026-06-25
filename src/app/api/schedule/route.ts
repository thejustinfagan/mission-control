import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { scheduledJobs, type ScheduledJob } from "@/data/schedule";

const STATUS_FILE = path.join("/tmp", "mission-control-status.json");

function readStatus(): any | null {
  try {
    const data = fs.readFileSync(STATUS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function getStatusSchedule(status: any): ScheduledJob[] | null {
  if (Array.isArray(status?.schedule)) return status.schedule as ScheduledJob[];
  return null;
}

export async function GET() {
  const status = readStatus();
  const schedule = getStatusSchedule(status) ?? scheduledJobs;
  return NextResponse.json(schedule);
}

const AUTH_TOKEN = process.env.MC_AUTH_TOKEN || "barry-update-2026";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (token !== AUTH_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Expected array of schedule jobs" }, { status: 400 });
    }

    const status = readStatus() ?? {};
    const nextStatus = { ...status, schedule: body, timestamp: new Date().toISOString() };

    fs.writeFileSync(STATUS_FILE, JSON.stringify(nextStatus));

    return NextResponse.json({ success: true, count: body.length });
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}
