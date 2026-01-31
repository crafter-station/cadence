"use server";

import { eq, and } from "drizzle-orm";
import { tasks } from "@trigger.dev/sdk/v3";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { nanoid } from "@/lib/nanoid";
import type { RunEvaluationTask } from "@/trigger/run-evaluation.task";

export interface CreateEvaluationInput {
  userId: string;
  name: string;
  description?: string;
  sourcePromptId: string;
  config: {
    maxEpochs: number;
    testsPerEpoch: number;
    personalityIds: string[];
    concurrency: number;
    improvementThreshold: number;
    targetMetric: "conversion" | "accuracy" | "csat" | "latency";
    conversionGoals: string[];
  };
}

export interface CreateEvaluationResult {
  success: boolean;
  evaluationId?: string;
  error?: string;
}

export async function createEvaluationAction(
  input: CreateEvaluationInput
): Promise<CreateEvaluationResult> {
  try {
    // Validate source prompt exists
    const sourcePrompt = await db.query.prompt.findFirst({
      where: eq(schema.prompt.id, input.sourcePromptId),
    });

    if (!sourcePrompt) {
      return { success: false, error: "Source prompt not found" };
    }

    if (sourcePrompt.userId !== input.userId) {
      return { success: false, error: "Unauthorized" };
    }

    const evaluationId = nanoid();

    await db.insert(schema.evaluation).values({
      id: evaluationId,
      userId: input.userId,
      name: input.name,
      description: input.description ?? null,
      sourcePromptId: input.sourcePromptId,
      config: input.config,
      status: "pending",
      currentEpochNumber: 0,
      totalEpochs: 0,
    });

    return {
      success: true,
      evaluationId,
    };
  } catch (error) {
    console.error("Failed to create evaluation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export interface StartEvaluationResult {
  success: boolean;
  error?: string;
}

export async function startEvaluationAction(
  evaluationId: string,
  userId: string
): Promise<StartEvaluationResult> {
  try {
    const evaluation = await db.query.evaluation.findFirst({
      where: eq(schema.evaluation.id, evaluationId),
    });

    if (!evaluation) {
      return { success: false, error: "Evaluation not found" };
    }

    if (evaluation.userId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    if (evaluation.status !== "pending" && evaluation.status !== "paused") {
      return { success: false, error: "Evaluation cannot be started" };
    }

    // Trigger the evaluation task
    const handle = await tasks.trigger<typeof RunEvaluationTask>(
      "run-evaluation",
      {
        evaluationId,
        userId,
      },
      {
        tags: [`evaluation:${evaluationId}`, `user:${userId}`],
      }
    );

    // Update evaluation with trigger run ID
    await db
      .update(schema.evaluation)
      .set({
        triggerRunId: handle.id,
        updatedAt: new Date(),
      })
      .where(eq(schema.evaluation.id, evaluationId));

    return { success: true };
  } catch (error) {
    console.error("Failed to start evaluation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function pauseEvaluationAction(
  evaluationId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const evaluation = await db.query.evaluation.findFirst({
      where: eq(schema.evaluation.id, evaluationId),
    });

    if (!evaluation) {
      return { success: false, error: "Evaluation not found" };
    }

    if (evaluation.userId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    if (evaluation.status !== "running") {
      return { success: false, error: "Evaluation is not running" };
    }

    await db
      .update(schema.evaluation)
      .set({
        status: "paused",
        updatedAt: new Date(),
      })
      .where(eq(schema.evaluation.id, evaluationId));

    return { success: true };
  } catch (error) {
    console.error("Failed to pause evaluation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getEvaluationsAction(
  userId: string
): Promise<schema.EvaluationSelect[]> {
  return db.query.evaluation.findMany({
    where: eq(schema.evaluation.userId, userId),
    orderBy: (evaluation, { desc }) => [desc(evaluation.createdAt)],
    with: {
      sourcePrompt: true,
      bestPrompt: true,
    },
  });
}

export async function getEvaluationAction(
  evaluationId: string
): Promise<schema.EvaluationSelect | null> {
  const result = await db.query.evaluation.findFirst({
    where: eq(schema.evaluation.id, evaluationId),
    with: {
      sourcePrompt: true,
      bestPrompt: true,
      epochs: {
        with: {
          prompt: true,
          testRun: {
            with: {
              sessions: {
                with: {
                  personality: true,
                },
              },
            },
          },
          metrics: {
            with: {
              personality: true,
            },
          },
        },
        orderBy: (epoch, { asc }) => [asc(epoch.epochNumber)],
      },
    },
  });
  return result ?? null;
}

export async function getEpochAction(
  epochId: string
): Promise<schema.EvaluationEpochSelect | null> {
  const result = await db.query.evaluationEpoch.findFirst({
    where: eq(schema.evaluationEpoch.id, epochId),
    with: {
      prompt: true,
      testRun: {
        with: {
          sessions: {
            with: {
              personality: true,
            },
          },
          healingSuggestions: true,
        },
      },
      metrics: {
        with: {
          personality: true,
        },
      },
      snapshots: true,
    },
  });
  return result ?? null;
}

export async function getSnapshotAction(
  snapshotId: string
): Promise<schema.SimulationSnapshotSelect | null> {
  const result = await db.query.simulationSnapshot.findFirst({
    where: eq(schema.simulationSnapshot.id, snapshotId),
    with: {
      epoch: {
        with: {
          evaluation: true,
        },
      },
      testSession: {
        with: {
          personality: true,
        },
      },
    },
  });
  return result ?? null;
}

export async function getEpochSnapshotsAction(
  epochId: string
): Promise<schema.SimulationSnapshotSelect[]> {
  return db.query.simulationSnapshot.findMany({
    where: eq(schema.simulationSnapshot.epochId, epochId),
    with: {
      testSession: {
        with: {
          personality: true,
        },
      },
    },
    orderBy: (snapshot, { asc }) => [asc(snapshot.createdAt)],
  });
}
