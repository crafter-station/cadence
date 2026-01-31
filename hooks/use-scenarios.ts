"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  getScenariosAction,
  getScenarioAction,
  createScenarioAction,
  updateScenarioAction,
  deleteScenarioAction,
  addScenarioStepAction,
  updateScenarioStepAction,
  deleteScenarioStepAction,
  runScenarioAction,
  type CreateScenarioInput,
} from "@/actions/scenario.actions";
import type { ScenarioSelect } from "@/db/schema";

export function useScenarios(userId: string) {
  return useQuery({
    queryKey: ["scenarios", userId],
    queryFn: () => getScenariosAction(userId),
    enabled: !!userId,
  });
}

export function useScenario(scenarioId: string | null) {
  return useQuery({
    queryKey: ["scenario", scenarioId],
    queryFn: () => (scenarioId ? getScenarioAction(scenarioId) : null),
    enabled: !!scenarioId,
  });
}

export function useCreateScenario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createScenarioAction,
    onMutate: async (input: CreateScenarioInput) => {
      await queryClient.cancelQueries({ queryKey: ["scenarios", input.userId] });

      const previousScenarios = queryClient.getQueryData<ScenarioSelect[]>([
        "scenarios",
        input.userId,
      ]);

      // Optimistic update
      const optimisticScenario: Partial<ScenarioSelect> = {
        id: `optimistic-${Date.now()}`,
        userId: input.userId,
        name: input.name,
        description: input.description ?? null,
        tags: input.tags ?? [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryClient.setQueryData<ScenarioSelect[]>(
        ["scenarios", input.userId],
        (old) => [optimisticScenario as ScenarioSelect, ...(old ?? [])]
      );

      return { previousScenarios };
    },
    onError: (_err, input, context) => {
      if (context?.previousScenarios) {
        queryClient.setQueryData(
          ["scenarios", input.userId],
          context.previousScenarios
        );
      }
    },
    onSuccess: (_result, input) => {
      queryClient.invalidateQueries({ queryKey: ["scenarios", input.userId] });
    },
  });
}

export function useUpdateScenario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      scenarioId,
      userId,
      updates,
    }: {
      scenarioId: string;
      userId: string;
      updates: { name?: string; description?: string; tags?: string[] };
    }) => updateScenarioAction(scenarioId, userId, updates),
    onSuccess: (_result, { userId, scenarioId }) => {
      queryClient.invalidateQueries({ queryKey: ["scenarios", userId] });
      queryClient.invalidateQueries({ queryKey: ["scenario", scenarioId] });
    },
  });
}

export function useDeleteScenario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      scenarioId,
      userId,
    }: {
      scenarioId: string;
      userId: string;
    }) => deleteScenarioAction(scenarioId, userId),
    onSuccess: (_result, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["scenarios", userId] });
    },
  });
}

export function useAddScenarioStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      scenarioId,
      userId,
      step,
    }: {
      scenarioId: string;
      userId: string;
      step: {
        userMessage: string;
        expectedBehavior?: string;
        assertions?: {
          type: "contains" | "not_contains" | "regex" | "sentiment" | "custom";
          value: string;
          description?: string;
        }[];
        personalityId?: string;
      };
    }) => addScenarioStepAction(scenarioId, userId, step),
    onSuccess: (_result, { userId, scenarioId }) => {
      queryClient.invalidateQueries({ queryKey: ["scenarios", userId] });
      queryClient.invalidateQueries({ queryKey: ["scenario", scenarioId] });
    },
  });
}

export function useUpdateScenarioStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      stepId,
      userId,
      updates,
    }: {
      stepId: string;
      userId: string;
      scenarioId: string;
      updates: {
        userMessage?: string;
        expectedBehavior?: string;
        assertions?: {
          type: "contains" | "not_contains" | "regex" | "sentiment" | "custom";
          value: string;
          description?: string;
        }[];
        personalityId?: string;
      };
    }) => updateScenarioStepAction(stepId, userId, updates),
    onSuccess: (_result, { userId, scenarioId }) => {
      queryClient.invalidateQueries({ queryKey: ["scenarios", userId] });
      queryClient.invalidateQueries({ queryKey: ["scenario", scenarioId] });
    },
  });
}

export function useDeleteScenarioStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      stepId,
      userId,
    }: {
      stepId: string;
      userId: string;
      scenarioId: string;
    }) => deleteScenarioStepAction(stepId, userId),
    onSuccess: (_result, { userId, scenarioId }) => {
      queryClient.invalidateQueries({ queryKey: ["scenarios", userId] });
      queryClient.invalidateQueries({ queryKey: ["scenario", scenarioId] });
    },
  });
}

export function useRunScenario() {
  return useMutation({
    mutationFn: ({
      scenarioId,
      promptId,
      userId,
    }: {
      scenarioId: string;
      promptId: string;
      userId: string;
    }) => runScenarioAction(scenarioId, promptId, userId),
  });
}
