import { logger, metadata, schemaTask } from "@trigger.dev/sdk";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { put } from "@vercel/blob";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { VoiceCallClient, type VoiceCallMessage } from "@/lib/voice/voice-call-client";
import { createWebCall, getLiveKitUrl } from "@/lib/voice/dapta-api";

const MAX_DURATION_MS = 180_000; // 3 minutes
const MAX_TURNS = 20;

/**
 * Run Call Task - Executes a single voice call
 *
 * This task manages a complete voice call between a synthetic customer and the agent:
 * 1. Creates web call via Dapta API
 * 2. Connects to LiveKit and receives agent audio
 * 3. Transcribes agent speech, generates customer response, synthesizes and publishes
 * 4. Updates progress via metadata for real-time UI
 * 5. Uploads combined audio to Vercel Blob
 * 6. Stores results in test_session
 */
export const RunCallTask = schemaTask({
  id: "run-call",
  schema: z.object({
    sessionId: z.string(),
    testRunId: z.string(),
    userId: z.string(),
    promptContent: z.string(), // Customer personality prompt
    personalityId: z.string(),
    retellAgentId: z.string(),
    contactName: z.string(),
    maxDurationSeconds: z.number().optional(),
    maxTurns: z.number().optional(),
  }),
  run: async (payload) => {
    const maxDuration = (payload.maxDurationSeconds ?? 180) * 1000;
    const maxTurns = payload.maxTurns ?? MAX_TURNS;

    // Mark session as running
    await db
      .update(schema.testSession)
      .set({
        status: "running",
        startedAt: new Date(),
      })
      .where(eq(schema.testSession.id, payload.sessionId));

    // Set initial metadata for real-time updates
    metadata.set("progress", {
      status: "connecting",
      turns: 0,
      progress: 0,
      lastMessage: null,
    });

    let client: VoiceCallClient | null = null;
    const messages: VoiceCallMessage[] = [];
    const startTime = Date.now();

    try {
      // Create web call via Dapta API - DEBUG logging
      logger.info("Creating web call - DEBUG", {
        retellAgentId: payload.retellAgentId,
        retellAgentIdType: typeof payload.retellAgentId,
        retellAgentIdLength: payload.retellAgentId?.length,
        startsWithAgent: payload.retellAgentId?.startsWith("agent_"),
        contactName: payload.contactName,
        contactNameLength: payload.contactName?.length,
      });

      const callData = await createWebCall(payload.retellAgentId, payload.contactName);

      await db
        .update(schema.testSession)
        .set({ daptaCallId: callData.call_id })
        .where(eq(schema.testSession.id, payload.sessionId));

      metadata.set("progress", {
        status: "connecting",
        turns: 0,
        progress: 0,
        daptaCallId: callData.call_id,
      });

      // Initialize voice call client
      client = new VoiceCallClient({
        personalityPrompt: payload.promptContent,
        maxDurationMs: maxDuration,
        maxTurns: maxTurns,
        onMessage: async (message) => {
          messages.push(message);

          // Update metadata for real-time UI
          const turns = messages.filter((m) => m.role === "user").length;
          const progress = Math.min((messages.length / (maxTurns * 2)) * 100, 99);

          metadata.set("progress", {
            status: "running",
            turns,
            progress,
            lastMessage: {
              role: message.role,
              content: message.content,
            },
          });

          // Persist messages periodically (every 4 messages)
          if (messages.length % 4 === 0) {
            const transcript = messages.map((m) => ({
              role: m.role,
              content: m.content,
              timestamp: m.timestamp,
            }));

            await db
              .update(schema.testSession)
              .set({
                transcript,
                turns,
                progress,
              })
              .where(eq(schema.testSession.id, payload.sessionId));
          }
        },
        onError: (error) => {
          logger.error("Voice call error", { error: error.message });
        },
      });

      // Connect to LiveKit
      const livekitUrl = getLiveKitUrl();
      logger.info("Connecting to LiveKit", { url: livekitUrl });
      await client.connect(livekitUrl, callData.access_token);

      metadata.set("progress", {
        status: "running",
        turns: 0,
        progress: 0,
      });

      // Wait for call to complete
      const result = await client.waitForCompletion();

      // Get combined audio as WAV
      const audioWav = client.getCombinedAudioWav();
      const audioDuration = client.getAudioDurationSeconds();

      // Upload audio to Vercel Blob
      let audioUrl: string | null = null;
      if (audioWav && audioWav.length > 0) {
        const blob = await put(
          `voice-calls/${payload.testRunId}/${payload.sessionId}.wav`,
          Buffer.from(audioWav),
          {
            access: "public",
            contentType: "audio/wav",
          }
        );
        audioUrl = blob.url;
        logger.info("Audio uploaded to Vercel Blob", { url: audioUrl });
      }

      const durationSeconds = (Date.now() - startTime) / 1000;
      const turns = messages.filter((m) => m.role === "user").length;
      const transcript = messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      }));

      // Finalize session
      await db
        .update(schema.testSession)
        .set({
          status: result.success ? "completed" : "failed",
          progress: 100,
          transcript,
          turns,
          durationSeconds,
          audioUrl,
          audioDurationSeconds: audioDuration,
          completedAt: new Date(),
        })
        .where(eq(schema.testSession.id, payload.sessionId));

      metadata.set("progress", {
        status: result.success ? "completed" : "failed",
        turns,
        progress: 100,
        audioUrl,
      });

      logger.info(`Call ${payload.sessionId} completed`, {
        success: result.success,
        turns,
        durationSeconds,
        audioUrl,
      });

      return {
        sessionId: payload.sessionId,
        success: result.success,
        turns,
        durationSeconds,
        audioUrl,
        accuracy: null, // Voice calls don't have accuracy metric yet
        avgLatency: null,
        tokensIn: 0,
        tokensOut: 0,
        error: result.error,
      };
    } catch (error) {
      logger.error("Voice call failed", { error });

      const transcript = messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      }));

      await db
        .update(schema.testSession)
        .set({
          status: "failed",
          transcript,
          errors: 1,
          completedAt: new Date(),
        })
        .where(eq(schema.testSession.id, payload.sessionId));

      metadata.set("progress", {
        status: "failed",
        turns: messages.filter((m) => m.role === "user").length,
        progress: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    } finally {
      if (client) {
        try {
          await client.disconnect();
        } catch {
          // Ignore disconnect errors
        }
      }
    }
  },
});

export type RunCallTaskType = typeof RunCallTask;
