import { logger, metadata, schemaTask } from "@trigger.dev/sdk";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { generateUserMessage } from "@/lib/ai/generate-user-message";
import { generateAgentResponse } from "@/lib/ai/generate-agent-response";
import { analyzeTranscript } from "@/lib/ai/analyze-transcript";

const MAX_TURNS = 10;

/**
 * Run Session Task - Executes a single test session
 *
 * This task manages a complete conversation between a synthetic user and the agent:
 * 1. Loads personality and prompt configuration
 * 2. Generates synthetic user messages based on personality
 * 3. Gets agent responses using the prompt being tested
 * 4. Updates progress via metadata
 * 5. Calculates metrics and stores results
 */
export const RunSessionTask = schemaTask({
  id: "run-session",
  schema: z.object({
    sessionId: z.string(),
    testRunId: z.string(),
    userId: z.string(),
    promptContent: z.string(),
    personalityId: z.string(),
  }),
  run: async (payload) => {
    // Fetch session
    const session = await db.query.testSession.findFirst({
      where: eq(schema.testSession.id, payload.sessionId),
      with: {
        personality: true,
      },
    });

    if (!session) {
      throw new Error(`Session ${payload.sessionId} not found`);
    }

    // Mark session as running
    await db
      .update(schema.testSession)
      .set({
        status: "running",
        startedAt: new Date(),
      })
      .where(eq(schema.testSession.id, payload.sessionId));

    const sessionWithPersonality = session as typeof session & {
      personality: schema.PersonalitySelect;
    };
    const personality = sessionWithPersonality.personality;
    const transcript: schema.TestSessionSelect["transcript"] = [];
    const latencies: number[] = [];
    let totalTokensIn = 0;
    let totalTokensOut = 0;
    let errors = 0;

    logger.info(`Starting session ${payload.sessionId}`, {
      personality: personality.name,
      instanceNumber: session.instanceNumber,
    });

    // Set initial progress metadata
    metadata.set("progress", {
      status: "running",
      turns: 0,
      progress: 0,
    });

    try {
      // Main conversation loop
      for (let turn = 0; turn < MAX_TURNS; turn++) {
        const progress = ((turn + 1) / MAX_TURNS) * 100;

        // Generate synthetic user message
        const userMessage = await generateUserMessage({
          personality,
          transcript,
          turnNumber: turn,
        });

        transcript.push({
          role: "user",
          content: userMessage,
          timestamp: Date.now(),
        });

        // Update progress metadata
        metadata.set("progress", {
          status: "running",
          turns: turn + 1,
          progress,
          lastMessage: {
            role: "user",
            content: userMessage,
          },
        });

        // Generate agent response
        const agentStart = Date.now();
        const agentResult = await generateAgentResponse({
          systemPrompt: payload.promptContent,
          transcript,
        });

        const agentLatency = Date.now() - agentStart;
        latencies.push(agentLatency);

        transcript.push({
          role: "agent",
          content: agentResult.content,
          timestamp: Date.now(),
          latency: agentLatency,
          tokensIn: agentResult.tokensIn ?? undefined,
          tokensOut: agentResult.tokensOut ?? undefined,
        });

        totalTokensIn += agentResult.tokensIn ?? 0;
        totalTokensOut += agentResult.tokensOut ?? 0;

        // Update progress with agent response
        metadata.set("progress", {
          status: "running",
          turns: turn + 1,
          progress,
          lastMessage: {
            role: "agent",
            content: agentResult.content,
          },
        });

        // Update session in database periodically
        if (turn % 2 === 0 || turn === MAX_TURNS - 1) {
          await db
            .update(schema.testSession)
            .set({
              progress,
              turns: turn + 1,
              transcript,
              tokensIn: totalTokensIn,
              tokensOut: totalTokensOut,
            })
            .where(eq(schema.testSession.id, payload.sessionId));
        }

        // Check if conversation should end naturally
        if (shouldEndConversation(transcript)) {
          logger.info(
            `Session ${payload.sessionId} ended naturally at turn ${turn + 1}`
          );
          break;
        }
      }

      // Analyze transcript for accuracy
      const analysisResult = await analyzeTranscript({
        transcript,
        personality,
      });

      const avgLatency =
        latencies.length > 0
          ? latencies.reduce((a, b) => a + b, 0) / latencies.length
          : null;

      // Finalize session
      await db
        .update(schema.testSession)
        .set({
          status: "completed",
          progress: 100,
          turns: transcript.filter((t) => t.role === "user").length,
          accuracy: analysisResult.accuracy,
          avgLatency,
          errors,
          transcript,
          tokensIn: totalTokensIn,
          tokensOut: totalTokensOut,
          completedAt: new Date(),
        })
        .where(eq(schema.testSession.id, payload.sessionId));

      // Final progress update
      metadata.set("progress", {
        status: "completed",
        turns: transcript.filter((t) => t.role === "user").length,
        progress: 100,
        accuracy: analysisResult.accuracy,
        avgLatency,
      });

      logger.info(`Session ${payload.sessionId} completed`, {
        turns: transcript.filter((t) => t.role === "user").length,
        accuracy: analysisResult.accuracy,
        avgLatency,
      });

      return {
        sessionId: payload.sessionId,
        turns: transcript.filter((t) => t.role === "user").length,
        accuracy: analysisResult.accuracy,
        avgLatency,
        tokensIn: totalTokensIn,
        tokensOut: totalTokensOut,
        issues: analysisResult.issues,
      };
    } catch (error) {
      logger.error(`Session ${payload.sessionId} failed`, { error });

      await db
        .update(schema.testSession)
        .set({
          status: "failed",
          transcript,
          errors: errors + 1,
          completedAt: new Date(),
        })
        .where(eq(schema.testSession.id, payload.sessionId));

      metadata.set("progress", {
        status: "failed",
        turns: transcript.filter((t) => t.role === "user").length,
        progress: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  },
});

function shouldEndConversation(
  transcript: schema.TestSessionSelect["transcript"]
): boolean {
  if (transcript.length < 4) return false;

  const lastMessages = transcript.slice(-2);
  const lastAgentMessage = lastMessages.find((m) => m.role === "agent");

  if (!lastAgentMessage) return false;

  // Check for conversation-ending signals
  const endingPhrases = [
    "is there anything else",
    "anything else i can help",
    "have a great day",
    "thank you for contacting",
    "goodbye",
    "take care",
  ];

  const content = lastAgentMessage.content.toLowerCase();
  return endingPhrases.some((phrase) => content.includes(phrase));
}

export type RunSessionTaskType = typeof RunSessionTask;
