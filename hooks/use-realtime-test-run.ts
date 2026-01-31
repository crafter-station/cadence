"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useRealtimeRunsWithTag,
  useRealtimeRunWithStreams,
} from "@trigger.dev/react-hooks";

interface UseRealtimeTestRunOptions {
  testRunId: string | null;
  enabled?: boolean;
}

interface SessionProgress {
  sessionId: string;
  status: string;
  turns: number;
  progress: number;
  lastMessage?: {
    role: "user" | "agent";
    content: string;
  };
  accuracy?: number;
  avgLatency?: number;
  error?: string;
}

export function useRealtimeTestRun({
  testRunId,
  enabled = true,
}: UseRealtimeTestRunOptions) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [sessionProgress, setSessionProgress] = useState<
    Map<string, SessionProgress>
  >(new Map());

  // Fetch access token
  useEffect(() => {
    if (!testRunId || !enabled) {
      setAccessToken(null);
      return;
    }

    async function fetchToken() {
      try {
        const response = await fetch(
          `/api/trigger/token?testRunId=${testRunId}`
        );
        if (response.ok) {
          const data = await response.json();
          setAccessToken(data.token);
        }
      } catch (error) {
        console.error("Failed to fetch trigger token:", error);
      }
    }

    fetchToken();
  }, [testRunId, enabled]);

  // Subscribe to all runs with the test-run tag
  const { runs } = useRealtimeRunsWithTag(`test-run:${testRunId}`, {
    accessToken: accessToken ?? undefined,
    enabled: !!accessToken && !!testRunId && enabled,
  });

  // Process run updates
  useEffect(() => {
    if (!runs || runs.length === 0) return;

    setSessionProgress((prev) => {
      const newProgress = new Map(prev);
      let hasChanges = false;

      for (const run of runs) {
        // Extract session ID from tags
        const sessionTag = run.tags?.find((t: string) => t.startsWith("session:"));
        if (!sessionTag) continue;

        const sessionId = sessionTag.replace("session:", "");

        // Update progress from run metadata
        const metadata = run.metadata as Record<string, unknown> | undefined;
        if (metadata?.progress) {
          const progress = metadata.progress as SessionProgress;
          const existing = prev.get(sessionId);

          // Only update if something changed
          if (!existing ||
              existing.status !== progress.status ||
              existing.turns !== progress.turns ||
              existing.progress !== progress.progress) {
            newProgress.set(sessionId, {
              ...progress,
              sessionId,
            });
            hasChanges = true;
          }
        }
      }

      return hasChanges ? newProgress : prev;
    });
  }, [runs]);

  const clearProgress = useCallback(() => {
    setSessionProgress(new Map());
  }, []);

  return {
    accessToken,
    runs,
    sessionProgress: Array.from(sessionProgress.values()),
    clearProgress,
    isConnected: !!accessToken,
  };
}

// Hook for subscribing to a specific run with streaming
export function useRealtimeSession(
  runId: string | null,
  options: { accessToken: string | null }
) {
  const { run, streams } = useRealtimeRunWithStreams(runId ?? "", {
    accessToken: options.accessToken ?? undefined,
    enabled: !!runId && !!options.accessToken,
  });

  // Extract LLM stream if available
  const llmStream = streams?.llm;

  return {
    run,
    llmStream,
    status: run?.status,
    output: run?.output,
  };
}
