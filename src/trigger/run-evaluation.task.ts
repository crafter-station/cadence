import { logger, schemaTask } from "@trigger.dev/sdk";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { nanoid } from "@/lib/nanoid";

import { RunEpochTask } from "./run-epoch.task";

/**
 * Run Evaluation Task - Campaign Orchestrator
 *
 * This task manages the full evaluation lifecycle:
 * 1. Validates evaluation exists and is pending
 * 2. Iterates through maxEpochs
 * 3. For each epoch: triggers RunEpochTask, waits for result
 * 4. Checks improvement threshold, accepts/rejects prompt
 * 5. Updates best prompt if improvement threshold met
 * 6. Handles pause/cancel
 */
export const RunEvaluationTask = schemaTask({
  id: "run-evaluation",
  schema: z.object({
    evaluationId: z.string(),
    userId: z.string(),
  }),
  run: async (payload) => {
    // Fetch evaluation
    const evaluation = await db.query.evaluation.findFirst({
      where: eq(schema.evaluation.id, payload.evaluationId),
      with: {
        sourcePrompt: true,
      },
    });

    if (!evaluation) {
      throw new EvaluationNotFoundError(payload.evaluationId);
    }

    if (evaluation.status !== "pending" && evaluation.status !== "paused") {
      throw new EvaluationAlreadyStartedError(payload.evaluationId);
    }

    const config = evaluation.config;
    if (!config) {
      throw new Error("Evaluation config is missing");
    }

    // Mark evaluation as running
    await db
      .update(schema.evaluation)
      .set({
        status: "running",
        startedAt: evaluation.startedAt ?? new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.evaluation.id, payload.evaluationId));

    logger.info(`Starting evaluation ${payload.evaluationId}`, {
      maxEpochs: config.maxEpochs,
      testsPerEpoch: config.testsPerEpoch,
      personalityIds: config.personalityIds,
    });

    // Determine starting point
    let currentPromptId = evaluation.bestPromptId ?? evaluation.sourcePromptId;
    let bestAccuracy = evaluation.bestAccuracy ?? 0;
    let bestConversionRate = evaluation.bestConversionRate ?? 0;
    let previousEpochId: string | null = null;

    // Find last completed epoch if resuming
    const existingEpochs = await db.query.evaluationEpoch.findMany({
      where: eq(schema.evaluationEpoch.evaluationId, payload.evaluationId),
      orderBy: (epoch, { desc }) => [desc(epoch.epochNumber)],
    });

    const startEpoch = existingEpochs.length > 0
      ? existingEpochs[0].epochNumber + 1
      : 1;

    if (existingEpochs.length > 0) {
      previousEpochId = existingEpochs[0].id;
      // Use the prompt from last epoch if available
      const lastEpoch = existingEpochs[0];
      if (lastEpoch.status === "completed") {
        currentPromptId = lastEpoch.promptId;
      }
    }

    logger.info(`Starting from epoch ${startEpoch}`, {
      currentPromptId,
      bestAccuracy,
      bestConversionRate,
    });

    // Run epochs
    for (let epochNumber = startEpoch; epochNumber <= config.maxEpochs; epochNumber++) {
      // Check if evaluation was paused
      const currentEval = await db.query.evaluation.findFirst({
        where: eq(schema.evaluation.id, payload.evaluationId),
      });

      if (currentEval?.status === "paused") {
        logger.info(`Evaluation ${payload.evaluationId} paused at epoch ${epochNumber}`);
        return {
          evaluationId: payload.evaluationId,
          status: "paused",
          completedEpochs: epochNumber - 1,
          bestAccuracy,
          bestConversionRate,
        };
      }

      // Create epoch record
      const epochId = nanoid();
      await db.insert(schema.evaluationEpoch).values({
        id: epochId,
        evaluationId: payload.evaluationId,
        epochNumber,
        promptId: currentPromptId,
        previousEpochId,
        status: "pending",
      });

      // Update evaluation progress
      await db
        .update(schema.evaluation)
        .set({
          currentEpochNumber: epochNumber,
          updatedAt: new Date(),
        })
        .where(eq(schema.evaluation.id, payload.evaluationId));

      logger.info(`Running epoch ${epochNumber}`, { epochId, promptId: currentPromptId });

      // Run epoch
      const epochResult = await RunEpochTask.triggerAndWait({
        epochId,
        evaluationId: payload.evaluationId,
        epochNumber,
        promptId: currentPromptId,
        userId: payload.userId,
        config: {
          testsPerEpoch: config.testsPerEpoch,
          personalityIds: config.personalityIds,
          concurrency: config.concurrency,
          targetMetric: config.targetMetric,
          conversionGoals: config.conversionGoals,
        },
        previousEpochId,
      });

      if (!epochResult.ok) {
        logger.error(`Epoch ${epochNumber} failed`, { error: epochResult.error });

        // Mark epoch as failed but continue
        await db
          .update(schema.evaluationEpoch)
          .set({ status: "failed" })
          .where(eq(schema.evaluationEpoch.id, epochId));

        // If critical failure, stop evaluation
        throw new Error(`Epoch ${epochNumber} failed: ${epochResult.error}`);
      }

      const result = epochResult.output;

      // Determine if this epoch's prompt should be accepted
      const targetMetricValue =
        config.targetMetric === "conversion"
          ? result.conversionRate ?? 0
          : result.accuracy ?? 0;

      const bestMetricValue =
        config.targetMetric === "conversion" ? bestConversionRate : bestAccuracy;

      const improvement = targetMetricValue - bestMetricValue;
      const isAccepted = improvement >= config.improvementThreshold;

      logger.info(`Epoch ${epochNumber} results`, {
        accuracy: result.accuracy,
        conversionRate: result.conversionRate,
        improvement,
        threshold: config.improvementThreshold,
        isAccepted,
      });

      // Update epoch acceptance status
      await db
        .update(schema.evaluationEpoch)
        .set({ isAccepted })
        .where(eq(schema.evaluationEpoch.id, epochId));

      // If accepted, update best prompt and metrics
      if (isAccepted) {
        bestAccuracy = result.accuracy ?? bestAccuracy;
        bestConversionRate = result.conversionRate ?? bestConversionRate;

        await db
          .update(schema.evaluation)
          .set({
            bestPromptId: result.newPromptId,
            bestAccuracy,
            bestConversionRate,
            totalImprovement: (evaluation.totalImprovement ?? 0) + improvement,
            updatedAt: new Date(),
          })
          .where(eq(schema.evaluation.id, payload.evaluationId));

        // Use new prompt for next epoch
        currentPromptId = result.newPromptId;
      }

      // Calculate deltas and update epoch
      const prevEpoch = previousEpochId
        ? await db.query.evaluationEpoch.findFirst({
            where: eq(schema.evaluationEpoch.id, previousEpochId),
          })
        : null;

      await db
        .update(schema.evaluationEpoch)
        .set({
          accuracyDelta: prevEpoch?.accuracy
            ? (result.accuracy ?? 0) - prevEpoch.accuracy
            : null,
          conversionDelta: prevEpoch?.conversionRate
            ? (result.conversionRate ?? 0) - prevEpoch.conversionRate
            : null,
        })
        .where(eq(schema.evaluationEpoch.id, epochId));

      previousEpochId = epochId;
    }

    // Mark evaluation as completed
    await db
      .update(schema.evaluation)
      .set({
        status: "completed",
        totalEpochs: config.maxEpochs,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.evaluation.id, payload.evaluationId));

    logger.info(`Evaluation ${payload.evaluationId} completed`, {
      totalEpochs: config.maxEpochs,
      bestAccuracy,
      bestConversionRate,
    });

    return {
      evaluationId: payload.evaluationId,
      status: "completed",
      completedEpochs: config.maxEpochs,
      bestAccuracy,
      bestConversionRate,
      bestPromptId: currentPromptId,
    };
  },
});

// Custom error types
class EvaluationError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = "EvaluationError";
  }
}

class EvaluationNotFoundError extends EvaluationError {
  constructor(evaluationId: string) {
    super(`Evaluation with ID ${evaluationId} not found`, "EVALUATION_NOT_FOUND");
  }
}

class EvaluationAlreadyStartedError extends EvaluationError {
  constructor(evaluationId: string) {
    super(
      `Evaluation with ID ${evaluationId} has already started or completed`,
      "EVALUATION_ALREADY_STARTED"
    );
  }
}

export type RunEvaluationTaskType = typeof RunEvaluationTask;
