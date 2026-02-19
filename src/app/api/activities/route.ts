import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Activity type definition
interface Activity {
  id: string;
  timestamp: string;
  actionType: string;
  description: string;
  project: string;
  status: string;
}

const STATUS_FILE = path.join("/tmp", "mission-control-status.json");

// Path to activities data file
const dataPath = path.join(process.cwd(), "src/data/activities.json");

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

function getActivities(): Activity[] {
  try {
    const data = fs.readFileSync(dataPath, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    console.error("Error reading activities:", e);
    return [];
  }
}

function saveActivities(activities: Activity[]): boolean {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(activities, null, 2));
    return true;
  } catch (e) {
    console.error("Error saving activities:", e);
    return false;
  }
}

export async function GET() {
  const status = readStatus();
  const activities = Array.isArray(status?.activities) ? status.activities : null;
  return NextResponse.json(activities ?? getActivities());
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.description || !body.project || !body.actionType) {
      return NextResponse.json(
        { error: "Missing required fields: description, project, actionType" },
        { status: 400 }
      );
    }
    
    // Generate activity
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const timeStr = now.getHours().toString().padStart(2, "0");
    
    const statusStore = readStatus();
    const canWriteStatus = !!statusStore && typeof statusStore === "object" && !Array.isArray(statusStore);
    const activities = Array.isArray(statusStore?.activities) ? statusStore.activities : getActivities();
    
    // Find next sequence number for today
    const todayPrefix = `act_${dateStr}`;
    const todayCount = activities.filter((a: Activity) => a.id.startsWith(todayPrefix)).length;
    
    const newActivity: Activity = {
      id: `${todayPrefix}${timeStr}_${(todayCount + 1).toString().padStart(3, "0")}`,
      timestamp: now.toISOString(),
      actionType: body.actionType,
      description: body.description,
      project: body.project,
      status: body.status || "success",
    };
    
    // Prepend new activity (most recent first)
    activities.unshift(newActivity);
    
    // Keep last 100 activities
    const trimmed = activities.slice(0, 100);
    
    if (canWriteStatus) {
      const nextStatus = { ...statusStore, activities: trimmed, timestamp: new Date().toISOString() };
      if (writeStatus(nextStatus)) {
        return NextResponse.json(newActivity, { status: 201 });
      }
      return NextResponse.json(
        { error: "Failed to save activity" },
        { status: 500 }
      );
    }

    if (saveActivities(trimmed)) {
      return NextResponse.json(newActivity, { status: 201 });
    }

    return NextResponse.json(
      { error: "Failed to save activity" },
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
