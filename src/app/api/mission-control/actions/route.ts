import { NextRequest, NextResponse } from "next/server";
import { recordActionDecision } from "@/lib/truth/action-decisions";
import type { JustinControlType } from "@/lib/truth/types";
import { verifyHumanBasicAuth, humanUnauthorizedResponse } from "@/lib/truth/access-control";

const ALLOWED = new Set<JustinControlType>([
  "approve",
  "reject",
  "defer",
  "unblock",
  "rerun-verification",
  "assign-to-agent",
  "view-artifact",
]);

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  if (!verifyHumanBasicAuth(request)) return humanUnauthorizedResponse();

  try {
    const body = await request.json();
    const controlType = body.controlType as JustinControlType;
    if (!body.actionId || !body.title || !body.label || !ALLOWED.has(controlType)) {
      return NextResponse.json({ error: "Invalid action decision payload" }, { status: 400 });
    }

    const decision = await recordActionDecision({
      actionId: body.actionId,
      controlType: controlType as Exclude<JustinControlType, "explain">,
      label: body.label,
      title: body.title,
      subject: body.subject,
    });

    return NextResponse.json({ ok: true, decision });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to record action decision", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
