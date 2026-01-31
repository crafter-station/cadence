import { logger, schemaTask } from "@trigger.dev/sdk";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { nanoid } from "@/lib/nanoid";
import { optimizePrompt } from "@/lib/ai/optimize-prompt";

import { RunTestsTask } from "./run-tests.task";
import { AnalyzeEpochTask } from "./analyze-epoch.task";

/**
 * Run Epoch Task - Executes a single evaluation epoch
 *
 * This task:
 * 1. Creates a test run and sessions
 * 2. Triggers RunTestsTask and waits for completion
 * 3. Triggers AnalyzeEpochTask
 * 4. Generates improved prompt via optimizePrompt()
 * 5. Creates new prompt version
 * 6. Returns metrics and new prompt ID
 */
export const RunEpochTask = schemaTask({
  id: "run-epoch",
  schema: z.object({
    epochId: z.string(),
    evaluationId: z.string(),
    epochNumber: z.number(),
    promptId: z.string(),
    userId: z.string(),
    config: z.object({
      testsPerEpoch: z.number(),
      personalityIds: z.array(z.string()),
      concurrency: z.number(),
      targetMetric: z.enum(["conversion", "accuracy", "csat", "latency"]),
      conversionGoals: z.array(z.string()),
    }),
    previousEpochId: z.string().nullable(),
  }),
  run: async (payload) => {
    logger.info(`Starting epoch ${payload.epochNumber}`, {
      epochId: payload.epochId,
      promptId: payload.promptId,
    });

    // Update epoch status to running
    await db
      .update(schema.evaluationEpoch)
      .set({
        status: "running",
        startedAt: new Date(),
      })
      .where(eq(schema.evaluationEpoch.id, payload.epochId));

    // Fetch prompt content
    const prompt = await db.query.prompt.findFirst({
      where: eq(schema.prompt.id, payload.promptId),
    });

    if (!prompt) {
      throw new Error(`Prompt ${payload.promptId} not found`);
    }

    // Create test run
    const testRunId = nanoid();
    const testsPerPersonality: Record<string, number> = {};
    const testsEach = Math.ceil(
      payload.config.testsPerEpoch / payload.config.personalityIds.length
    );
    for (const pid of payload.config.personalityIds) {
      testsPerPersonality[pid] = testsEach;
    }

    await db.insert(schema.testRun).values({
      id: testRunId,
      userId: payload.userId,
      promptId: payload.promptId,
      status: "pending",
      config: {
        testsPerPersonality,
        concurrency: payload.config.concurrency,
        businessMetrics: {
          resolutionTarget: 80,
          avgHandleTimeTarget: 300,
          csatTarget: 4.5,
          escalationRateTarget: 10,
          costPerCall: 0.5,
        },
      },
      totalSessions: payload.config.testsPerEpoch,
    });

    // Create test sessions
    const sessionInserts: schema.TestSessionInsert[] = [];
    for (const personalityId of payload.config.personalityIds) {
      for (let i = 0; i < testsEach; i++) {
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

    // Update epoch with test run ID
    await db
      .update(schema.evaluationEpoch)
      .set({ testRunId })
      .where(eq(schema.evaluationEpoch.id, payload.epochId));

    // Trigger test run and wait for completion
    logger.info(`Triggering test run ${testRunId}`);
    const testResult = await RunTestsTask.triggerAndWait({
      testRunId,
      userId: payload.userId,
    });

    if (!testResult.ok) {
      throw new Error(`Test run failed: ${testResult.error}`);
    }

    logger.info(`Test run completed`, {
      completed: testResult.output.completedSessions,
      failed: testResult.output.failedSessions,
      accuracy: testResult.output.avgAccuracy,
    });

    // Analyze epoch results
    const analysisResult = await AnalyzeEpochTask.triggerAndWait({
      epochId: payload.epochId,
      evaluationId: payload.evaluationId,
      testRunId,
      conversionGoals: payload.config.conversionGoals,
      promptContent: prompt.content,
      epochNumber: payload.epochNumber,
    });

    if (!analysisResult.ok) {
      throw new Error(`Epoch analysis failed: ${analysisResult.error}`);
    }

    const analysis = analysisResult.output;

    // Fetch healing suggestions for this test run
    const healingSuggestions = await db.query.healingSuggestion.findMany({
      where: eq(schema.healingSuggestion.testRunId, testRunId),
    });

    // Fetch sample transcripts for prompt optimization
    const testRun = await db.query.testRun.findFirst({
      where: eq(schema.testRun.id, testRunId),
      with: {
        sessions: {
          with: { personality: true },
          limit: 5,
        },
      },
    });

    const sampleTranscripts = (testRun?.sessions ?? []).map((s) => ({
      personalityId: s.personalityId,
      personalityName: s.personality.name,
      transcript: s.transcript.map((t) => ({
        role: t.role,
        content: t.content,
      })),
      accuracy: s.accuracy,
      conversionScore: analysis.metrics.find(
        (m) => m.personalityId === s.personalityId
      )?.conversionRate ?? null,
    }));

    // Generate improved prompt
    const epochMetrics = analysis.metrics.map((m) => ({
      personalityId: m.personalityId,
      personalityName:
        testRun?.sessions.find((s) => s.personalityId === m.personalityId)
          ?.personality.name ?? "Unknown",
      accuracy: m.accuracy ?? null,
      conversionRate: m.conversionRate ?? null,
      sessionsCount: m.sessionsCount ?? 0,
      issues: [] as Array<{ issue: string; count: number; severity: string }>,
    }));

    const optimization = await optimizePrompt({
      currentPrompt: prompt.content,
      epochMetrics,
      healingSuggestions,
      sampleTranscripts,
      targetMetric: payload.config.targetMetric,
      conversionGoals: payload.config.conversionGoals,
    });

    // Create new prompt version
    const newPromptId = nanoid();
    await db.insert(schema.prompt).values({
      id: newPromptId,
      userId: payload.userId,
      name: prompt.name,
      content: optimization.improvedPrompt,
      version: prompt.version + 1,
      parentId: payload.promptId,
      isActive: true,
    });

    // Mark applied suggestions
    if (optimization.appliedSuggestionIds.length > 0) {
      for (const suggestionId of optimization.appliedSuggestionIds) {
        await db
          .update(schema.healingSuggestion)
          .set({
            isApplied: true,
            appliedAt: new Date(),
            resultingPromptId: newPromptId,
          })
          .where(eq(schema.healingSuggestion.id, suggestionId));
      }
    }

    // Update epoch with results
    await db
      .update(schema.evaluationEpoch)
      .set({
        status: "completed",
        accuracy: analysis.aggregated.accuracy,
        conversionRate: analysis.aggregated.conversionRate,
        avgLatency: analysis.aggregated.avgLatency,
        improvementApplied: {
          suggestionIds: optimization.appliedSuggestionIds,
          changes: optimization.changes,
          reasoning: optimization.reasoning,
          originalPrompt: prompt.content,
          improvedPrompt: optimization.improvedPrompt,
        },
        completedAt: new Date(),
      })
      .where(eq(schema.evaluationEpoch.id, payload.epochId));

    logger.info(`Epoch ${payload.epochNumber} completed`, {
      accuracy: analysis.aggregated.accuracy,
      conversionRate: analysis.aggregated.conversionRate,
      newPromptId,
      changes: optimization.changes.length,
    });

    return {
      epochId: payload.epochId,
      testRunId,
      accuracy: analysis.aggregated.accuracy,
      conversionRate: analysis.aggregated.conversionRate,
      avgLatency: analysis.aggregated.avgLatency,
      newPromptId,
      optimization: {
        changes: optimization.changes,
        reasoning: optimization.reasoning,
        predictedImpact: optimization.predictedImpact,
      },
    };
  },
});

export type RunEpochTaskType = typeof RunEpochTask;
