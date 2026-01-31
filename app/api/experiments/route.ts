import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";

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
    const experiments = await db.query.experiment.findMany({
      where: eq(schema.experiment.userId, userId),
      orderBy: desc(schema.experiment.createdAt),
      with: {
        variants: {
          with: {
            prompt: true,
          },
        },
        winner: true,
      },
    });

    return NextResponse.json({ experiments });
  } catch (error) {
    console.error("Failed to fetch experiments:", error);
    return NextResponse.json(
      { error: "Failed to fetch experiments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, description, hypothesis, variants } = body;

    if (!userId || !name || !variants || !Array.isArray(variants)) {
      return NextResponse.json(
        { error: "userId, name, and variants are required" },
        { status: 400 }
      );
    }

    // Validate traffic percentages
    const totalTraffic = variants.reduce(
      (sum: number, v: { trafficPercent: number }) => sum + v.trafficPercent,
      0
    );
    if (totalTraffic !== 100) {
      return NextResponse.json(
        { error: "Traffic percentages must sum to 100" },
        { status: 400 }
      );
    }

    const experimentId = nanoid();

    // Create experiment
    await db.insert(schema.experiment).values({
      id: experimentId,
      userId,
      name,
      description: description ?? null,
      hypothesis: hypothesis ?? null,
      status: "draft",
    });

    // Create variants
    const variantInserts = variants.map(
      (variant: {
        name: string;
        description?: string;
        promptId: string;
        trafficPercent: number;
      }) => ({
        id: nanoid(),
        experimentId,
        promptId: variant.promptId,
        name: variant.name,
        description: variant.description ?? null,
        trafficPercent: variant.trafficPercent,
      })
    );

    await db.insert(schema.experimentVariant).values(variantInserts);

    const newExperiment = await db.query.experiment.findFirst({
      where: eq(schema.experiment.id, experimentId),
      with: {
        variants: {
          with: {
            prompt: true,
          },
        },
      },
    });

    return NextResponse.json({ experiment: newExperiment }, { status: 201 });
  } catch (error) {
    console.error("Failed to create experiment:", error);
    return NextResponse.json(
      { error: "Failed to create experiment" },
      { status: 500 }
    );
  }
}
