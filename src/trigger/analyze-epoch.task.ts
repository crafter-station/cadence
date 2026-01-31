import { logger, schemaTask } from "@trigger.dev/sdk";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { nanoid } from "@/lib/nanoid";
import { analyzeConversion } from "@/lib/ai/analyze-conversion";
import { generateHealingSuggestions } from "@/lib/ai/analyze-transcript";

/**
 * Analyze Epoch Task - Analyzes completed test sessions for an epoch
 *
 * This task:
 * 1. Fetches completed sessions from the epoch's test run
 * 2. Groups sessions by personality
 * 3. Runs conversion analysis on each session
 * 4. Saves simulation snapshots for replay
 * 5. Generates healing suggestions
 * 6. Returns aggregated metrics
 */
export const AnalyzeEpochTask = schemaTask({
  id: "analyze-epoch",
  schema: z.object({
    epochId: z.string(),
    evaluationId: z.string(),
    testRunId: z.string(),
    conversionGoals: z.array(z.string()),
    promptContent: z.string(),
    epochNumber: z.number(),
  }),
  run: async (payload) => {
    // Fetch test run with sessions
    const testRun = await db.query.testRun.findFirst({
      where: eq(schema.testRun.id, payload.testRunId),
      with: {
        prompt: true,
        sessions: {
          with: {
            personality: true,
          },
        },
      },
    });

    if (!testRun) {
      throw new Error(`Test run ${payload.testRunId} not found`);
    }

    const completedSessions = testRun.sessions.filter(
      (s) => s.status === "completed"
    );

    if (completedSessions.length === 0) {
      logger.info(`No completed sessions for epoch ${payload.epochId}`);
      return {
        epochId: payload.epochId,
        metrics: [],
        snapshots: [],
        suggestions: [],
        aggregated: {
          accuracy: null,
          conversionRate: null,
          avgLatency: null,
        },
      };
    }

    logger.info(
      `Analyzing ${completedSessions.length} sessions for epoch ${payload.epochId}`
    );

    // Group sessions by personality
    const sessionsByPersonality = new Map<
      string,
      (typeof completedSessions)[0][]
    >();
    for (const session of completedSessions) {
      const personalityId = session.personalityId;
      if (!sessionsByPersonality.has(personalityId)) {
        sessionsByPersonality.set(personalityId, []);
      }
      sessionsByPersonality.get(personalityId)!.push(session);
    }

    const metricsInserts: schema.EvaluationMetricsInsert[] = [];
    const snapshotInserts: schema.SimulationSnapshotInsert[] = [];
    const suggestions: schema.HealingSuggestionInsert[] = [];

    // Analyze each personality group
    for (const [personalityId, sessions] of sessionsByPersonality) {
      const personality = sessions[0].personality;

      // Calculate base metrics
      const avgAccuracy =
        sessions.reduce((sum, s) => sum + (s.accuracy ?? 0), 0) / sessions.length;
      const avgLatency =
        sessions.reduce((sum, s) => sum + (s.avgLatency ?? 0), 0) / sessions.length;

      // Run conversion analysis on each session
      let totalConversionScore = 0;
      let conversions = 0;
      const issues: Array<{ issue: string; count: number; severity: "low" | "medium" | "high" | "critical" }> = [];
      const issueMap = new Map<string, { count: number; severity: string }>();

      for (const session of sessions) {
        const conversionResult = await analyzeConversion({
          transcript: session.transcript,
          conversionGoals: payload.conversionGoals,
          personalityName: personality.name,
          personalityTraits: personality.traits,
        });

        totalConversionScore += conversionResult.conversionScore;
        if (conversionResult.conversionAchieved) {
          conversions++;
        }

        // Aggregate missed opportunities as issues
        for (const missed of conversionResult.missedOpportunities) {
          const existing = issueMap.get(missed);
          if (existing) {
            existing.count++;
          } else {
            issueMap.set(missed, { count: 1, severity: "medium" });
          }
        }

        // Create simulation snapshot
        snapshotInserts.push({
          id: nanoid(),
          epochId: payload.epochId,
          testSessionId: session.id,
          snapshotData: {
            promptVersion: payload.promptContent.slice(0, 100) + "...",
            personality: {
              id: personality.id,
              name: personality.name,
              description: personality.description ?? "",
              traits: personality.traits,
            },
            transcript: session.transcript.map((m) => ({
              role: m.role,
              content: m.content,
              timestamp: typeof m.timestamp === 'number'
                ? new Date(m.timestamp).toISOString()
                : (m.timestamp ?? new Date().toISOString()),
              latency: m.latency,
              tokensIn: m.tokensIn,
              tokensOut: m.tokensOut,
            })),
            metrics: {
              accuracy: session.accuracy,
              conversionScore: conversionResult.conversionScore,
              latency: session.avgLatency,
            },
            conversionResult: {
              achieved: conversionResult.conversionAchieved,
              goals: payload.conversionGoals,
              missedOpportunities: conversionResult.missedOpportunities,
            },
            environment: {
              model: process.env.ANALYSIS_MODEL || "anthropic/claude-3-5-haiku-latest",
              epochNumber: payload.epochNumber,
            },
          },
        });
      }

      // Convert issue map to array
      for (const [issue, data] of issueMap) {
        issues.push({
          issue,
          count: data.count,
          severity: data.severity as "low" | "medium" | "high" | "critical",
        });
      }

      const conversionRate = sessions.length > 0 ? (conversions / sessions.length) * 100 : 0;

      metricsInserts.push({
        id: nanoid(),
        epochId: payload.epochId,
        personalityId,
        accuracy: avgAccuracy,
        conversionRate,
        avgLatency,
        sessionsCount: sessions.length,
        conversions,
        conversionOpportunities: sessions.length,
        issues,
      });

      // Generate healing suggestions if performance is low
      if (avgAccuracy < 85 || conversionRate < 50) {
        logger.info(
          `Generating suggestions for personality ${personality.name}`,
          { avgAccuracy, conversionRate }
        );

        const sampleTranscripts = sessions.slice(0, 3).map((s) => s.transcript);

        const aiSuggestions = await generateHealingSuggestions({
          promptContent: payload.promptContent,
          personality,
          transcripts: sampleTranscripts,
          avgAccuracy,
        });

        for (const suggestion of aiSuggestions) {
          suggestions.push({
            id: nanoid(),
            testRunId: payload.testRunId,
            promptId: testRun.promptId,
            personalityId,
            issue: suggestion.issue,
            suggestion: suggestion.suggestion,
            suggestedPrompt: suggestion.suggestedPrompt,
            confidence: suggestion.confidence,
            severity: suggestion.severity,
            evidence: {
              sessionIds: sessions.slice(0, 3).map((s) => s.id),
              examples: suggestion.examples,
            },
            isApplied: false,
          });
        }
      }
    }

    // Save all data to database
    if (metricsInserts.length > 0) {
      await db.insert(schema.evaluationMetrics).values(metricsInserts);
    }

    if (snapshotInserts.length > 0) {
      await db.insert(schema.simulationSnapshot).values(snapshotInserts);
    }

    if (suggestions.length > 0) {
      await db.insert(schema.healingSuggestion).values(suggestions);
    }

    // Calculate aggregated metrics
    const totalAccuracy =
      metricsInserts.reduce((sum, m) => sum + (m.accuracy ?? 0), 0) /
      metricsInserts.length;
    const totalConversionRate =
      metricsInserts.reduce((sum, m) => sum + (m.conversionRate ?? 0), 0) /
      metricsInserts.length;
    const totalAvgLatency =
      metricsInserts.reduce((sum, m) => sum + (m.avgLatency ?? 0), 0) /
      metricsInserts.length;

    logger.info(`Epoch ${payload.epochId} analysis complete`, {
      metrics: metricsInserts.length,
      snapshots: snapshotInserts.length,
      suggestions: suggestions.length,
      accuracy: totalAccuracy,
      conversionRate: totalConversionRate,
    });

    return {
      epochId: payload.epochId,
      metrics: metricsInserts.map((m) => ({
        personalityId: m.personalityId,
        accuracy: m.accuracy,
        conversionRate: m.conversionRate,
        sessionsCount: m.sessionsCount,
      })),
      snapshots: snapshotInserts.map((s) => s.id),
      suggestions: suggestions.map((s) => ({
        id: s.id,
        issue: s.issue,
        severity: s.severity,
      })),
      aggregated: {
        accuracy: totalAccuracy,
        conversionRate: totalConversionRate,
        avgLatency: totalAvgLatency,
      },
    };
  },
});

export type AnalyzeEpochTaskType = typeof AnalyzeEpochTask;
