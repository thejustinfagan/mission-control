import { NextRequest, NextResponse } from "next/server";
import { readActivities, appendActivity } from "@/lib/truth/activity-store";
import { verifyAgentAuth, unauthorizedResponse } from "@/lib/truth/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const activities = await readActivities();
  return NextResponse.json(activities);
}

export async function POST(request: NextRequest) {
  if (!verifyAgentAuth(request)) return unauthorizedResponse();

  try {
    const body = await request.json();

    if (!body.description || !body.project || !body.actionType) {
      return NextResponse.json(
        { error: "Missing required fields: description, project, actionType" },
        { status: 400 }
      );
    }

    const record = await appendActivity({
      actionType: body.actionType,
      description: body.description,
      project: body.project,
      status: body.status || "success",
      agentId: body.agentId || "barry",
    });

    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request body", detail: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }
}
