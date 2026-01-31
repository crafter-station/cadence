"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  getExperimentsAction,
  getExperimentAction,
  createExperimentAction,
  startExperimentAction,
  pauseExperimentAction,
  resumeExperimentAction,
  declareWinnerAction,
  updateVariantTrafficAction,
  deleteExperimentAction,
  type CreateExperimentInput,
} from "@/actions/experiment.actions";
import type { ExperimentSelect } from "@/db/schema";

export function useExperiments(userId: string) {
  return useQuery({
    queryKey: ["experiments", userId],
    queryFn: () => getExperimentsAction(userId),
    enabled: !!userId,
  });
}

export function useExperiment(experimentId: string | null) {
  return useQuery({
    queryKey: ["experiment", experimentId],
    queryFn: () => (experimentId ? getExperimentAction(experimentId) : null),
    enabled: !!experimentId,
  });
}

export function useCreateExperiment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createExperimentAction,
    onMutate: async (input: CreateExperimentInput) => {
      await queryClient.cancelQueries({
        queryKey: ["experiments", input.userId],
      });

      const previousExperiments = queryClient.getQueryData<ExperimentSelect[]>([
        "experiments",
        input.userId,
      ]);

      // Optimistic update
      const optimisticExperiment: Partial<ExperimentSelect> = {
        id: `optimistic-${Date.now()}`,
        userId: input.userId,
        name: input.name,
        description: input.description ?? null,
        hypothesis: input.hypothesis ?? null,
        status: "draft",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryClient.setQueryData<ExperimentSelect[]>(
        ["experiments", input.userId],
        (old) => [optimisticExperiment as ExperimentSelect, ...(old ?? [])]
      );

      return { previousExperiments };
    },
    onError: (_err, input, context) => {
      if (context?.previousExperiments) {
        queryClient.setQueryData(
          ["experiments", input.userId],
          context.previousExperiments
        );
      }
    },
    onSuccess: (_result, input) => {
      queryClient.invalidateQueries({ queryKey: ["experiments", input.userId] });
    },
  });
}

export function useStartExperiment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      experimentId,
      userId,
    }: {
      experimentId: string;
      userId: string;
    }) => startExperimentAction(experimentId, userId),
    onSuccess: (_result, { userId, experimentId }) => {
      queryClient.invalidateQueries({ queryKey: ["experiments", userId] });
      queryClient.invalidateQueries({ queryKey: ["experiment", experimentId] });
    },
  });
}

export function usePauseExperiment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      experimentId,
      userId,
    }: {
      experimentId: string;
      userId: string;
    }) => pauseExperimentAction(experimentId, userId),
    onSuccess: (_result, { userId, experimentId }) => {
      queryClient.invalidateQueries({ queryKey: ["experiments", userId] });
      queryClient.invalidateQueries({ queryKey: ["experiment", experimentId] });
    },
  });
}

export function useResumeExperiment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      experimentId,
      userId,
    }: {
      experimentId: string;
      userId: string;
    }) => resumeExperimentAction(experimentId, userId),
    onSuccess: (_result, { userId, experimentId }) => {
      queryClient.invalidateQueries({ queryKey: ["experiments", userId] });
      queryClient.invalidateQueries({ queryKey: ["experiment", experimentId] });
    },
  });
}

export function useDeclareWinner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      experimentId,
      variantId,
      userId,
    }: {
      experimentId: string;
      variantId: string;
      userId: string;
    }) => declareWinnerAction(experimentId, variantId, userId),
    onSuccess: (_result, { userId, experimentId }) => {
      queryClient.invalidateQueries({ queryKey: ["experiments", userId] });
      queryClient.invalidateQueries({ queryKey: ["experiment", experimentId] });
    },
  });
}

export function useUpdateVariantTraffic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      experimentId,
      userId,
      variantUpdates,
    }: {
      experimentId: string;
      userId: string;
      variantUpdates: { variantId: string; trafficPercent: number }[];
    }) => updateVariantTrafficAction(experimentId, userId, variantUpdates),
    onSuccess: (_result, { userId, experimentId }) => {
      queryClient.invalidateQueries({ queryKey: ["experiments", userId] });
      queryClient.invalidateQueries({ queryKey: ["experiment", experimentId] });
    },
  });
}

export function useDeleteExperiment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      experimentId,
      userId,
    }: {
      experimentId: string;
      userId: string;
    }) => deleteExperimentAction(experimentId, userId),
    onSuccess: (_result, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["experiments", userId] });
    },
  });
}
