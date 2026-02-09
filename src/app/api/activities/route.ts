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

// Path to activities data file
const dataPath = path.join(process.cwd(), "src/data/activities.json");

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
  const activities = getActivities();
  return NextResponse.json(activities);
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
    
    const activities = getActivities();
    
    // Find next sequence number for today
    const todayPrefix = `act_${dateStr}`;
    const todayCount = activities.filter(a => a.id.startsWith(todayPrefix)).length;
    
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
    
    if (saveActivities(trimmed)) {
      return NextResponse.json(newActivity, { status: 201 });
    } else {
      return NextResponse.json(
        { error: "Failed to save activity" },
        { status: 500 }
      );
    }
  } catch (e) {
    console.error("POST error:", e);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
