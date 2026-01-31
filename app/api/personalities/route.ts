import { NextRequest, NextResponse } from "next/server";
import { eq, and, or, isNull } from "drizzle-orm";

import { db } from "@/db";
import * as schema from "@/db/schema";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");

  try {
    // Get default personalities and optionally user's custom ones
    const personalities = await db.query.personality.findMany({
      where: and(
        eq(schema.personality.isActive, true),
        userId
          ? or(
              eq(schema.personality.isDefault, true),
              eq(schema.personality.userId, userId)
            )
          : eq(schema.personality.isDefault, true)
      ),
      orderBy: (personality, { asc, desc }) => [
        desc(personality.isDefault),
        asc(personality.name),
      ],
    });

    return NextResponse.json({ personalities });
  } catch (error) {
    console.error("Failed to fetch personalities:", error);
    return NextResponse.json(
      { error: "Failed to fetch personalities" },
      { status: 500 }
    );
  }
}
