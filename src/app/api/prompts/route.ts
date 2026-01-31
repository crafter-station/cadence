import { NextRequest, NextResponse } from "next/server";
import { eq, and, desc } from "drizzle-orm";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { nanoid } from "@/lib/nanoid";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const prompts = await db.query.prompt.findMany({
      where: and(
        eq(schema.prompt.userId, userId),
        eq(schema.prompt.isActive, true)
      ),
      orderBy: desc(schema.prompt.createdAt),
    });

    return NextResponse.json({ prompts });
  } catch (error) {
    console.error("Failed to fetch prompts:", error);
    return NextResponse.json(
      { error: "Failed to fetch prompts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, content, parentId } = body;

    if (!userId || !name || !content) {
      return NextResponse.json(
        { error: "userId, name, and content are required" },
        { status: 400 }
      );
    }

    // Determine version number
    let version = 1;
    if (parentId) {
      const parent = await db.query.prompt.findFirst({
        where: eq(schema.prompt.id, parentId),
      });
      if (parent) {
        version = parent.version + 1;
      }
    }

    const promptId = nanoid();

    await db.insert(schema.prompt).values({
      id: promptId,
      userId,
      name,
      content,
      version,
      parentId: parentId ?? null,
    });

    const newPrompt = await db.query.prompt.findFirst({
      where: eq(schema.prompt.id, promptId),
    });

    return NextResponse.json({ prompt: newPrompt }, { status: 201 });
  } catch (error) {
    console.error("Failed to create prompt:", error);
    return NextResponse.json(
      { error: "Failed to create prompt" },
      { status: 500 }
    );
  }
}
