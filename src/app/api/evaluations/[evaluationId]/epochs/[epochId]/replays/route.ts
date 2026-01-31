import { NextRequest, NextResponse } from "next/server";

import { getEpochSnapshotsAction } from "@/actions/evaluation.actions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ evaluationId: string; epochId: string }> }
) {
  const { epochId } = await params;

  try {
    const snapshots = await getEpochSnapshotsAction(epochId);

    return NextResponse.json({ snapshots });
  } catch (error) {
    console.error("Failed to fetch replays:", error);
    return NextResponse.json(
      { error: "Failed to fetch replays" },
      { status: 500 }
    );
  }
}
