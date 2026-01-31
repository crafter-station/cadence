import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { createEvaluationAction } from "@/actions/evaluation.actions";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const offset = parseInt(searchParams.get("offset") ?? "0");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const evaluations = await db.query.evaluation.findMany({
      where: eq(schema.evaluation.userId, userId),
      orderBy: desc(schema.evaluation.createdAt),
      limit,
      offset,
      with: {
        sourcePrompt: true,
        bestPrompt: true,
        epochs: {
          limit: 1,
          orderBy: desc(schema.evaluationEpoch.epochNumber),
        },
      },
    });

    return NextResponse.json({ evaluations });
  } catch (error) {
    console.error("Failed to fetch evaluations:", error);
    return NextResponse.json(
      { error: "Failed to fetch evaluations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await createEvaluationAction(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ evaluationId: result.evaluationId }, { status: 201 });
  } catch (error) {
    console.error("Failed to create evaluation:", error);
    return NextResponse.json(
      { error: "Failed to create evaluation" },
      { status: 500 }
    );
  }
}
