"use server";

import { eq, and } from "drizzle-orm";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { nanoid } from "@/lib/nanoid";

export interface CreateExperimentInput {
  userId: string;
  name: string;
  description?: string;
  hypothesis?: string;
  variants: {
    name: string;
    description?: string;
    promptId: string;
    trafficPercent: number;
  }[];
}

export interface CreateExperimentResult {
  success: boolean;
  experimentId?: string;
  error?: string;
}

export async function createExperimentAction(
  input: CreateExperimentInput
): Promise<CreateExperimentResult> {
  try {
    // Validate traffic percentages sum to 100
    const totalTraffic = input.variants.reduce(
      (sum, v) => sum + v.trafficPercent,
      0
    );
    if (totalTraffic !== 100) {
      return {
        success: false,
        error: "Traffic percentages must sum to 100",
      };
    }

    const experimentId = nanoid();

    // Create experiment
    await db.insert(schema.experiment).values({
      id: experimentId,
      userId: input.userId,
      name: input.name,
      description: input.description ?? null,
      hypothesis: input.hypothesis ?? null,
      status: "draft",
    });

    // Create variants
    const variantInserts: schema.ExperimentVariantInsert[] = input.variants.map(
      (variant) => ({
        id: nanoid(),
        experimentId,
        promptId: variant.promptId,
        name: variant.name,
        description: variant.description ?? null,
        trafficPercent: variant.trafficPercent,
      })
    );

    await db.insert(schema.experimentVariant).values(variantInserts);

    return {
      success: true,
      experimentId,
    };
  } catch (error) {
    console.error("Failed to create experiment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function startExperimentAction(
  experimentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const experiment = await db.query.experiment.findFirst({
      where: and(
        eq(schema.experiment.id, experimentId),
        eq(schema.experiment.userId, userId)
      ),
    });

    if (!experiment) {
      return { success: false, error: "Experiment not found" };
    }

    if (experiment.status !== "draft") {
      return { success: false, error: "Experiment is not in draft status" };
    }

    await db
      .update(schema.experiment)
      .set({
        status: "running",
        startedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.experiment.id, experimentId));

    return { success: true };
  } catch (error) {
    console.error("Failed to start experiment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function pauseExperimentAction(
  experimentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const experiment = await db.query.experiment.findFirst({
      where: and(
        eq(schema.experiment.id, experimentId),
        eq(schema.experiment.userId, userId)
      ),
    });

    if (!experiment) {
      return { success: false, error: "Experiment not found" };
    }

    if (experiment.status !== "running") {
      return { success: false, error: "Experiment is not running" };
    }

    await db
      .update(schema.experiment)
      .set({
        status: "paused",
        updatedAt: new Date(),
      })
      .where(eq(schema.experiment.id, experimentId));

    return { success: true };
  } catch (error) {
    console.error("Failed to pause experiment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function resumeExperimentAction(
  experimentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const experiment = await db.query.experiment.findFirst({
      where: and(
        eq(schema.experiment.id, experimentId),
        eq(schema.experiment.userId, userId)
      ),
    });

    if (!experiment) {
      return { success: false, error: "Experiment not found" };
    }

    if (experiment.status !== "paused") {
      return { success: false, error: "Experiment is not paused" };
    }

    await db
      .update(schema.experiment)
      .set({
        status: "running",
        updatedAt: new Date(),
      })
      .where(eq(schema.experiment.id, experimentId));

    return { success: true };
  } catch (error) {
    console.error("Failed to resume experiment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function declareWinnerAction(
  experimentId: string,
  variantId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const experiment = await db.query.experiment.findFirst({
      where: and(
        eq(schema.experiment.id, experimentId),
        eq(schema.experiment.userId, userId)
      ),
      with: {
        variants: true,
      },
    });

    if (!experiment) {
      return { success: false, error: "Experiment not found" };
    }

    if (experiment.status === "completed") {
      return { success: false, error: "Experiment is already completed" };
    }

    const expWithVariants = experiment as typeof experiment & { variants: { id: string }[] };
    const variant = expWithVariants.variants.find((v: { id: string }) => v.id === variantId);
    if (!variant) {
      return { success: false, error: "Variant not found in experiment" };
    }

    await db
      .update(schema.experiment)
      .set({
        status: "completed",
        winnerId: variantId,
        winnerDeclaredAt: new Date(),
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.experiment.id, experimentId));

    return { success: true };
  } catch (error) {
    console.error("Failed to declare winner:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getExperimentsAction(
  userId: string
): Promise<schema.ExperimentSelect[]> {
  return db.query.experiment.findMany({
    where: eq(schema.experiment.userId, userId),
    orderBy: (experiment, { desc }) => [desc(experiment.createdAt)],
    with: {
      variants: {
        with: {
          prompt: true,
        },
      },
      winner: true,
    },
  });
}

export async function getExperimentAction(
  experimentId: string
): Promise<schema.ExperimentSelect | null> {
  const result = await db.query.experiment.findFirst({
    where: eq(schema.experiment.id, experimentId),
    with: {
      variants: {
        with: {
          prompt: true,
        },
      },
      winner: true,
    },
  });
  return result ?? null;
}

export async function updateVariantTrafficAction(
  experimentId: string,
  userId: string,
  variantUpdates: { variantId: string; trafficPercent: number }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const experiment = await db.query.experiment.findFirst({
      where: and(
        eq(schema.experiment.id, experimentId),
        eq(schema.experiment.userId, userId)
      ),
    });

    if (!experiment) {
      return { success: false, error: "Experiment not found" };
    }

    // Validate traffic percentages sum to 100
    const totalTraffic = variantUpdates.reduce(
      (sum, v) => sum + v.trafficPercent,
      0
    );
    if (totalTraffic !== 100) {
      return {
        success: false,
        error: "Traffic percentages must sum to 100",
      };
    }

    // Update each variant
    for (const update of variantUpdates) {
      await db
        .update(schema.experimentVariant)
        .set({
          trafficPercent: update.trafficPercent,
        })
        .where(eq(schema.experimentVariant.id, update.variantId));
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to update variant traffic:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function deleteExperimentAction(
  experimentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const experiment = await db.query.experiment.findFirst({
      where: and(
        eq(schema.experiment.id, experimentId),
        eq(schema.experiment.userId, userId)
      ),
    });

    if (!experiment) {
      return { success: false, error: "Experiment not found" };
    }

    if (experiment.status === "running") {
      return { success: false, error: "Cannot delete a running experiment" };
    }

    // Delete variants first (cascade should handle this, but being explicit)
    await db
      .delete(schema.experimentVariant)
      .where(eq(schema.experimentVariant.experimentId, experimentId));

    // Delete experiment
    await db
      .delete(schema.experiment)
      .where(eq(schema.experiment.id, experimentId));

    return { success: true };
  } catch (error) {
    console.error("Failed to delete experiment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
