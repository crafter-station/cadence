import { NextRequest, NextResponse } from "next/server";

import { getSnapshotAction } from "@/actions/evaluation.actions";

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ evaluationId: string; epochId: string; snapshotId: string }>;
  }
) {
  const { snapshotId } = await params;

  try {
    const snapshot = await getSnapshotAction(snapshotId);

    if (!snapshot) {
      return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
    }

    return NextResponse.json({ snapshot });
  } catch (error) {
    console.error("Failed to fetch snapshot:", error);
    return NextResponse.json(
      { error: "Failed to fetch snapshot" },
      { status: 500 }
    );
  }
}
