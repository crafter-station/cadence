import { NextRequest, NextResponse } from "next/server";

import { pauseEvaluationAction } from "@/actions/evaluation.actions";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ evaluationId: string }> }
) {
  const { evaluationId } = await params;

  try {
    const body = await request.json();
    const userId = body.userId;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const result = await pauseEvaluationAction(evaluationId, userId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to pause evaluation:", error);
    return NextResponse.json(
      { error: "Failed to pause evaluation" },
      { status: 500 }
    );
  }
}
