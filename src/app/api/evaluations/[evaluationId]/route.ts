import { NextRequest, NextResponse } from "next/server";

import { getEvaluationAction } from "@/actions/evaluation.actions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ evaluationId: string }> }
) {
  const { evaluationId } = await params;

  try {
    const evaluation = await getEvaluationAction(evaluationId);

    if (!evaluation) {
      return NextResponse.json(
        { error: "Evaluation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ evaluation });
  } catch (error) {
    console.error("Failed to fetch evaluation:", error);
    return NextResponse.json(
      { error: "Failed to fetch evaluation" },
      { status: 500 }
    );
  }
}
