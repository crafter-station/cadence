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
    const scenarios = await db.query.scenario.findMany({
      where: and(
        eq(schema.scenario.userId, userId),
        eq(schema.scenario.isActive, true)
      ),
      orderBy: desc(schema.scenario.createdAt),
      with: {
        steps: {
          orderBy: (steps, { asc }) => [asc(steps.orderIndex)],
        },
      },
    });

    return NextResponse.json({ scenarios });
  } catch (error) {
    console.error("Failed to fetch scenarios:", error);
    return NextResponse.json(
      { error: "Failed to fetch scenarios" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, description, tags, steps } = body;

    if (!userId || !name) {
      return NextResponse.json(
        { error: "userId and name are required" },
        { status: 400 }
      );
    }

    const scenarioId = nanoid();

    // Create scenario
    await db.insert(schema.scenario).values({
      id: scenarioId,
      userId,
      name,
      description: description ?? null,
      tags: tags ?? [],
    });

    // Create steps if provided
    if (steps && Array.isArray(steps) && steps.length > 0) {
      const stepInserts: schema.ScenarioStepInsert[] = steps.map(
        (
          step: {
            userMessage: string;
            expectedBehavior?: string;
            assertions?: {
              type: "contains" | "not_contains" | "regex" | "sentiment" | "custom";
              value: string;
              description?: string;
            }[];
            personalityId?: string;
          },
          index: number
        ) => ({
          id: nanoid(),
          scenarioId,
          orderIndex: index,
          userMessage: step.userMessage,
          expectedBehavior: step.expectedBehavior ?? null,
          assertions: step.assertions ?? null,
          personalityId: step.personalityId ?? null,
        })
      );

      await db.insert(schema.scenarioStep).values(stepInserts);
    }

    const newScenario = await db.query.scenario.findFirst({
      where: eq(schema.scenario.id, scenarioId),
      with: {
        steps: {
          orderBy: (steps, { asc }) => [asc(steps.orderIndex)],
        },
      },
    });

    return NextResponse.json({ scenario: newScenario }, { status: 201 });
  } catch (error) {
    console.error("Failed to create scenario:", error);
    return NextResponse.json(
      { error: "Failed to create scenario" },
      { status: 500 }
    );
  }
}
