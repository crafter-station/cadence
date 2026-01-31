import { batch, logger, schemaTask } from "@trigger.dev/sdk";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import * as schema from "@/db/schema";

import { RunCallTask } from "./run-call.task";
import { AnalyzeResultsTask } from "./analyze-results.task";

/**
 * Run Tests Task - Orchestrates parallel voice call execution across multiple personalities
 *
 * This task manages the lifecycle of a complete test run:
 * 1. Validates the test run exists and is in pending state
 * 2. Fetches pre-created test sessions
 * 3. Triggers parallel voice call execution
 * 4. Aggregates results and updates metrics
 * 5. Triggers analysis for self-healing suggestions
 */
export const RunTestsTask = schemaTask({
  id: "run-tests",
  schema: z.object({
    testRunId: z.string(),
    userId: z.string(),
  }),
  run: async (payload) => {
    // Fetch test run with config and external agent
    const testRun = await db.query.testRun.findFirst({
      where: eq(schema.testRun.id, payload.testRunId),
      with: {
        prompt: true,
        externalAgent: true,
      },
    });

    if (!testRun) {
      throw new TestRunNotFoundError(payload.testRunId);
    }

    if (testRun.status !== "pending") {
      // Already started, return early instead of throwing
      // This handles retries and duplicate triggers gracefully
      logger.warn(`Test run ${payload.testRunId} already started, skipping`);
      return {
        testRunId: payload.testRunId,
        totalSessions: testRun.totalSessions,
        completedSessions: testRun.completedSessions,
        failedSessions: testRun.failedSessions,
        avgAccuracy: testRun.avgAccuracy,
        avgLatency: testRun.avgLatency,
        totalTokensIn: testRun.totalTokensIn,
        totalTokensOut: testRun.totalTokensOut,
      };
    }

    // Mark test run as running
    await db
      .update(schema.testRun)
      .set({
        status: "running",
        startedAt: new Date(),
      })
      .where(eq(schema.testRun.id, payload.testRunId));

    const config = testRun.config;
    if (!config) {
      throw new Error("Test run config is missing");
    }

    // Validate external agent for voice calls
    const externalAgent = testRun.externalAgent;
    if (!externalAgent) {
      throw new Error("Test run requires an external agent for voice calls");
    }
    if (!externalAgent.retellAgentId) {
      throw new Error("External agent is missing retellAgentId required for voice calls");
    }

    logger.info(`Starting test run ${payload.testRunId}`, {
      config,
      promptId: testRun.promptId,
      externalAgentId: externalAgent.id,
    });

    // Fetch sessions that were pre-created by the server action
    const sessions = await db.query.testSession.findMany({
      where: eq(schema.testSession.testRunId, payload.testRunId),
      with: {
        personality: true,
      },
    });

    if (sessions.length === 0) {
      throw new Error("No sessions found for test run");
    }

    logger.info(`Found ${sessions.length} sessions to run`);

    // Trigger all voice calls in parallel
    const batchItems = sessions.map((session) => {
      // Get personality prompt (use systemPrompt or description)
      const personality = session.personality as schema.PersonalitySelect;
      const personalityPrompt = personality.systemPrompt ?? personality.description;

      return {
        task: RunCallTask,
        payload: {
          sessionId: session.id,
          testRunId: payload.testRunId,
          userId: payload.userId,
          promptContent: personalityPrompt,
          personalityId: session.personalityId,
          retellAgentId: externalAgent.retellAgentId!, // Validated above
          contactName: personality.name,
        },
        options: {
          tags: [
            `test-run:${payload.testRunId}`,
            `session:${session.id}`,
            `personality:${session.personalityId}`,
          ],
        },
      };
    });

    const results = await batch.triggerByTaskAndWait(batchItems);

    // Aggregate results
    let completedCount = 0;
    let failedCount = 0;
    let totalAccuracy = 0;
    let totalLatency = 0;
    let totalTokensIn = 0;
    let totalTokensOut = 0;
    let validAccuracyCount = 0;
    let validLatencyCount = 0;

    for (const result of results.runs) {
      if (result.ok && result.output) {
        completedCount++;
        if (result.output.accuracy !== null && result.output.accuracy !== undefined) {
          totalAccuracy += result.output.accuracy;
          validAccuracyCount++;
        }
        if (result.output.avgLatency !== null && result.output.avgLatency !== undefined) {
          totalLatency += result.output.avgLatency;
          validLatencyCount++;
        }
        totalTokensIn += result.output.tokensIn ?? 0;
        totalTokensOut += result.output.tokensOut ?? 0;
      } else {
        failedCount++;
      }
    }

    const avgAccuracy = validAccuracyCount > 0 ? totalAccuracy / validAccuracyCount : null;
    const avgLatency = validLatencyCount > 0 ? totalLatency / validLatencyCount : null;

    // Update test run with aggregated metrics
    await db
      .update(schema.testRun)
      .set({
        status: failedCount === sessions.length ? "failed" : "completed",
        completedSessions: completedCount,
        failedSessions: failedCount,
        avgAccuracy,
        avgLatency,
        totalTokensIn,
        totalTokensOut,
        completedAt: new Date(),
      })
      .where(eq(schema.testRun.id, payload.testRunId));

    // Update prompt metrics
    const existingPrompt = await db.query.prompt.findFirst({
      where: eq(schema.prompt.id, testRun.promptId),
    });

    if (existingPrompt) {
      const newTotalRuns = existingPrompt.totalRuns + 1;
      const newAvgAccuracy = existingPrompt.avgAccuracy
        ? (existingPrompt.avgAccuracy * existingPrompt.totalRuns + (avgAccuracy ?? 0)) / newTotalRuns
        : avgAccuracy;
      const newAvgLatency = existingPrompt.avgLatency
        ? (existingPrompt.avgLatency * existingPrompt.totalRuns + (avgLatency ?? 0)) / newTotalRuns
        : avgLatency;

      await db
        .update(schema.prompt)
        .set({
          totalRuns: newTotalRuns,
          avgAccuracy: newAvgAccuracy,
          avgLatency: newAvgLatency,
          updatedAt: new Date(),
        })
        .where(eq(schema.prompt.id, testRun.promptId));
    }

    logger.info(`Test run ${payload.testRunId} completed`, {
      completed: completedCount,
      failed: failedCount,
      avgAccuracy,
      avgLatency,
    });

    // Trigger analysis for self-healing suggestions
    if (completedCount > 0) {
      await AnalyzeResultsTask.trigger(
        {
          testRunId: payload.testRunId,
          userId: payload.userId,
        },
        {
          tags: [`test-run:${payload.testRunId}`],
        }
      );
    }

    return {
      testRunId: payload.testRunId,
      totalSessions: sessions.length,
      completedSessions: completedCount,
      failedSessions: failedCount,
      avgAccuracy,
      avgLatency,
      totalTokensIn,
      totalTokensOut,
    };
  },
});

// Custom error types
class TestRunError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = "TestRunError";
  }
}

class TestRunNotFoundError extends TestRunError {
  constructor(testRunId: string) {
    super(`Test run with ID ${testRunId} not found`, "TEST_RUN_NOT_FOUND");
  }
}

class TestRunAlreadyStartedError extends TestRunError {
  constructor(testRunId: string) {
    super(
      `Test run with ID ${testRunId} has already started`,
      "TEST_RUN_ALREADY_STARTED"
    );
  }
}

export type RunTestsTaskType = typeof RunTestsTask;
