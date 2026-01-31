import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";

import { db } from "@/db";
import * as schema from "@/db/schema";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const offset = parseInt(searchParams.get("offset") ?? "0");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const testRuns = await db.query.testRun.findMany({
      where: eq(schema.testRun.userId, userId),
      orderBy: desc(schema.testRun.createdAt),
      limit,
      offset,
      with: {
        prompt: true,
        sessions: {
          limit: 100,
        },
      },
    });

    return NextResponse.json({ testRuns });
  } catch (error) {
    console.error("Failed to fetch test runs:", error);
    return NextResponse.json(
      { error: "Failed to fetch test runs" },
      { status: 500 }
    );
  }
}
