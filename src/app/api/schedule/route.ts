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
