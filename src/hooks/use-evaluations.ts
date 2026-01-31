"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createEvaluationAction,
  startEvaluationAction,
  pauseEvaluationAction,
  getEvaluationsAction,
  getEvaluationAction,
  getEpochAction,
  getSnapshotAction,
  getEpochSnapshotsAction,
  type CreateEvaluationInput,
} from "@/actions/evaluation.actions";
import type { EvaluationSelect, EvaluationEpochSelect } from "@/db/schema";

export function useEvaluations(userId: string) {
  return useQuery({
    queryKey: ["evaluations", userId],
    queryFn: () => getEvaluationsAction(userId),
    enabled: !!userId,
  });
}

export function useEvaluation(evaluationId: string | null) {
  return useQuery({
    queryKey: ["evaluation", evaluationId],
    queryFn: () => (evaluationId ? getEvaluationAction(evaluationId) : null),
    enabled: !!evaluationId,
    refetchInterval: (query) => {
      const data = query.state.data as EvaluationSelect | null;
      // Refetch every 3 seconds while running
      if (data?.status === "running" || data?.status === "pending") {
        return 3000;
      }
      return false;
    },
  });
}

export function useEpoch(epochId: string | null) {
  return useQuery({
    queryKey: ["epoch", epochId],
    queryFn: () => (epochId ? getEpochAction(epochId) : null),
    enabled: !!epochId,
    refetchInterval: (query) => {
      const data = query.state.data as EvaluationEpochSelect | null;
      // Refetch while running
      if (data?.status === "running" || data?.status === "pending") {
        return 2000;
      }
      return false;
    },
  });
}

export function useEpochSnapshots(epochId: string | null) {
  return useQuery({
    queryKey: ["epoch-snapshots", epochId],
    queryFn: () => (epochId ? getEpochSnapshotsAction(epochId) : []),
    enabled: !!epochId,
  });
}

export function useSnapshot(snapshotId: string | null) {
  return useQuery({
    queryKey: ["snapshot", snapshotId],
    queryFn: () => (snapshotId ? getSnapshotAction(snapshotId) : null),
    enabled: !!snapshotId,
  });
}

export function useCreateEvaluation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEvaluationAction,
    onMutate: async (input: CreateEvaluationInput) => {
      await queryClient.cancelQueries({ queryKey: ["evaluations", input.userId] });

      const previousEvaluations = queryClient.getQueryData<EvaluationSelect[]>([
        "evaluations",
        input.userId,
      ]);

      const optimisticEvaluation: Partial<EvaluationSelect> = {
        id: `optimistic-${Date.now()}`,
        userId: input.userId,
        name: input.name,
        description: input.description ?? null,
        sourcePromptId: input.sourcePromptId,
        config: input.config,
        status: "pending",
        currentEpochNumber: 0,
        totalEpochs: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryClient.setQueryData<EvaluationSelect[]>(
        ["evaluations", input.userId],
        (old) => [optimisticEvaluation as EvaluationSelect, ...(old ?? [])]
      );

      return { previousEvaluations };
    },
    onError: (_err, input, context) => {
      if (context?.previousEvaluations) {
        queryClient.setQueryData(
          ["evaluations", input.userId],
          context.previousEvaluations
        );
      }
    },
    onSuccess: (result, input) => {
      if (result.success && result.evaluationId) {
        queryClient.invalidateQueries({ queryKey: ["evaluations", input.userId] });
      }
    },
  });
}

export function useStartEvaluation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      evaluationId,
      userId,
    }: {
      evaluationId: string;
      userId: string;
    }) => startEvaluationAction(evaluationId, userId),
    onSuccess: (_result, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["evaluations", userId] });
    },
  });
}

export function usePauseEvaluation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      evaluationId,
      userId,
    }: {
      evaluationId: string;
      userId: string;
    }) => pauseEvaluationAction(evaluationId, userId),
    onSuccess: (_result, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["evaluations", userId] });
    },
  });
}
