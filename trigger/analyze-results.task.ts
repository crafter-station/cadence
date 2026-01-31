import { logger, schemaTask } from "@trigger.dev/sdk";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { nanoid } from "@/lib/nanoid";
import { generateHealingSuggestions } from "@/lib/ai/analyze-transcript";

/**
 * Analyze Results Task - Generates self-healing suggestions from test results
 *
 * This task analyzes completed test sessions to:
 * 1. Group sessions by personality
 * 2. Identify patterns of failures or low performance
 * 3. Generate AI-powered prompt improvement suggestions
 * 4. Store suggestions for user review
 */
export const AnalyzeResultsTask = schemaTask({
  id: "analyze-results",
  schema: z.object({
    testRunId: z.string(),
    userId: z.string(),
  }),
  run: async (payload) => {
    // Fetch test run with sessions and prompt
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
      logger.info(`No completed sessions for test run ${payload.testRunId}`);
      return { suggestions: [] };
    }

    logger.info(
      `Analyzing ${completedSessions.length} completed sessions for test run ${payload.testRunId}`
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

    const suggestions: schema.HealingSuggestionInsert[] = [];

    // Analyze each personality group
    for (const [personalityId, sessions] of sessionsByPersonality) {
      const personality = sessions[0].personality;

      // Calculate average metrics for this personality
      const avgAccuracy =
        sessions.reduce((sum, s) => sum + (s.accuracy ?? 0), 0) /
        sessions.length;
      const avgLatency =
        sessions.reduce((sum, s) => sum + (s.avgLatency ?? 0), 0) /
        sessions.length;

      // Skip if performance is good
      if (avgAccuracy >= 85) {
        continue;
      }

      logger.info(
        `Generating suggestions for personality ${personality.name}`,
        {
          avgAccuracy,
          avgLatency,
          sessionCount: sessions.length,
        }
      );

      // Collect sample transcripts for analysis
      const sampleTranscripts = sessions
        .slice(0, 3)
        .map((s) => s.transcript);

      const testRunWithPrompt = testRun as typeof testRun & { prompt: { content: string } };

      // Generate AI-powered suggestions
      const aiSuggestions = await generateHealingSuggestions({
        promptContent: testRunWithPrompt.prompt.content,
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

    // Store suggestions in database
    if (suggestions.length > 0) {
      await db.insert(schema.healingSuggestion).values(suggestions);

      logger.info(
        `Created ${suggestions.length} healing suggestions for test run ${payload.testRunId}`
      );
    }

    return {
      testRunId: payload.testRunId,
      suggestionsCount: suggestions.length,
      suggestions: suggestions.map((s) => ({
        id: s.id,
        issue: s.issue,
        severity: s.severity,
      })),
    };
  },
});

export type AnalyzeResultsTaskType = typeof AnalyzeResultsTask;
