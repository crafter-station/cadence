"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  startTestRunAction,
  stopTestRunAction,
  getTestRunsAction,
  getTestRunAction,
  type StartTestRunInput,
} from "@/actions/test-run.actions";
import type { TestRunSelect } from "@/db/schema";

export function useTestRuns(userId: string) {
  return useQuery({
    queryKey: ["test-runs", userId],
    queryFn: () => getTestRunsAction(userId),
    enabled: !!userId,
  });
}

export function useTestRun(testRunId: string | null) {
  return useQuery({
    queryKey: ["test-run", testRunId],
    queryFn: () => (testRunId ? getTestRunAction(testRunId) : null),
    enabled: !!testRunId,
    refetchInterval: (query) => {
      const data = query.state.data as TestRunSelect | null;
      // Refetch every 1 second while running for real-time feel
      if (data?.status === "running") {
        return 1000;
      }
      if (data?.status === "pending") {
        return 1500;
      }
      return false;
    },
  });
}

export function useStartTestRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startTestRunAction,
    onMutate: async (input: StartTestRunInput) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["test-runs", input.userId] });

      // Snapshot the previous value
      const previousTestRuns = queryClient.getQueryData<TestRunSelect[]>([
        "test-runs",
        input.userId,
      ]);

      // Optimistically update
      const optimisticTestRun: Partial<TestRunSelect> = {
        id: `optimistic-${Date.now()}`,
        userId: input.userId,
        promptId: input.promptId,
        status: "pending",
        config: input.config,
        totalSessions: Object.values(input.config.testsPerPersonality).reduce(
          (a, b) => a + b,
          0
        ),
        completedSessions: 0,
        failedSessions: 0,
        createdAt: new Date(),
      };

      queryClient.setQueryData<TestRunSelect[]>(
        ["test-runs", input.userId],
        (old) => [optimisticTestRun as TestRunSelect, ...(old ?? [])]
      );

      return { previousTestRuns };
    },
    onError: (_err, input, context) => {
      // Roll back on error
      if (context?.previousTestRuns) {
        queryClient.setQueryData(
          ["test-runs", input.userId],
          context.previousTestRuns
        );
      }
    },
    onSuccess: (result, input) => {
      if (result.success && result.testRunId) {
        // Remove optimistic update and refetch
        queryClient.invalidateQueries({ queryKey: ["test-runs", input.userId] });
      }
    },
  });
}

export function useStopTestRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ testRunId, userId }: { testRunId: string; userId: string }) =>
      stopTestRunAction(testRunId, userId),
    onSuccess: (_result, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["test-runs", userId] });
    },
  });
}
