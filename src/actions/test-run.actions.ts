"use server";

import { eq } from "drizzle-orm";
import { tasks } from "@trigger.dev/sdk/v3";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { nanoid } from "@/lib/nanoid";
import type { RunTestsTask } from "@/trigger/run-tests.task";

export interface StartTestRunInput {
  userId: string;
  promptId: string;
  personalityIds: string[];
  config: {
    testsPerPersonality: Record<string, number>;
    concurrency: number;
    businessMetrics: {
      resolutionTarget: number;
      avgHandleTimeTarget: number;
      csatTarget: number;
      escalationRateTarget: number;
      costPerCall: number;
    };
  };
  experimentId?: string;
  variantId?: string;
}

export interface StartTestRunResult {
  success: boolean;
  testRunId?: string;
  error?: string;
}

export async function startTestRunAction(
  input: StartTestRunInput
): Promise<StartTestRunResult> {
  try {
    const testRunId = nanoid();

    // Calculate total sessions
    let totalSessions = 0;
    for (const personalityId of input.personalityIds) {
      totalSessions += input.config.testsPerPersonality[personalityId] || 10;
    }

    // Create test run record
    await db.insert(schema.testRun).values({
      id: testRunId,
      userId: input.userId,
      promptId: input.promptId,
      experimentId: input.experimentId ?? null,
      variantId: input.variantId ?? null,
      status: "pending",
      config: input.config,
      totalSessions,
    });

    // Create test session records
    const sessionInserts: schema.TestSessionInsert[] = [];
    for (const personalityId of input.personalityIds) {
      const testCount = input.config.testsPerPersonality[personalityId] || 10;
      for (let i = 0; i < testCount; i++) {
        sessionInserts.push({
          id: nanoid(),
          testRunId,
          personalityId,
          instanceNumber: i + 1,
          status: "pending",
          progress: 0,
          transcript: [],
        });
      }
    }

    if (sessionInserts.length > 0) {
      await db.insert(schema.testSession).values(sessionInserts);
    }

    // Trigger the test run task
    const handle = await tasks.trigger<typeof RunTestsTask>("run-tests", {
      testRunId,
      userId: input.userId,
    }, {
      tags: [`test-run:${testRunId}`, `user:${input.userId}`],
    });

    // Update test run with trigger run ID
    await db
      .update(schema.testRun)
      .set({
        triggerRunId: handle.id,
      })
      .where(eq(schema.testRun.id, testRunId));

    return {
      success: true,
      testRunId,
    };
  } catch (error) {
    console.error("Failed to start test run:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function stopTestRunAction(
  testRunId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const testRun = await db.query.testRun.findFirst({
      where: eq(schema.testRun.id, testRunId),
    });

    if (!testRun) {
      return { success: false, error: "Test run not found" };
    }

    if (testRun.userId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    if (testRun.status !== "running" && testRun.status !== "pending") {
      return { success: false, error: "Test run is not active" };
    }

    // Note: Cancellation of trigger runs is not directly supported via SDK
    // The run will be stopped when we update the status

    // Update test run status
    await db
      .update(schema.testRun)
      .set({
        status: "cancelled",
        completedAt: new Date(),
      })
      .where(eq(schema.testRun.id, testRunId));

    // Update pending sessions to cancelled
    await db
      .update(schema.testSession)
      .set({
        status: "cancelled",
      })
      .where(eq(schema.testSession.testRunId, testRunId));

    return { success: true };
  } catch (error) {
    console.error("Failed to stop test run:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getTestRunAction(
  testRunId: string
): Promise<schema.TestRunSelect | null> {
  const result = await db.query.testRun.findFirst({
    where: eq(schema.testRun.id, testRunId),
    with: {
      prompt: true,
      sessions: {
        with: {
          personality: true,
        },
      },
      healingSuggestions: true,
    },
  });
  return result ?? null;
}

export async function getTestRunsAction(
  userId: string
): Promise<schema.TestRunSelect[]> {
  return db.query.testRun.findMany({
    where: eq(schema.testRun.userId, userId),
    orderBy: (testRun, { desc }) => [desc(testRun.createdAt)],
    with: {
      prompt: true,
    },
  });
}
