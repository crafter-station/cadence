import { NextRequest, NextResponse } from "next/server";

import { getEpochAction } from "@/actions/evaluation.actions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ evaluationId: string; epochId: string }> }
) {
  const { epochId } = await params;

  try {
    const epoch = await getEpochAction(epochId);

    if (!epoch) {
      return NextResponse.json({ error: "Epoch not found" }, { status: 404 });
    }

    return NextResponse.json({ epoch });
  } catch (error) {
    console.error("Failed to fetch epoch:", error);
    return NextResponse.json(
      { error: "Failed to fetch epoch" },
      { status: 500 }
    );
  }
}
