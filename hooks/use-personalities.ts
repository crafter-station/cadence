"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  getPersonalitiesAction,
  createPersonalityAction,
  updatePersonalityAction,
  deletePersonalityAction,
  seedDefaultPersonalitiesAction,
  type CreatePersonalityInput,
} from "@/actions/personality.actions";
import type { PersonalitySelect } from "@/db/schema";

export function usePersonalities(userId?: string) {
  return useQuery({
    queryKey: ["personalities", userId],
    queryFn: () => getPersonalitiesAction(userId),
  });
}

export function useCreatePersonality() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPersonalityAction,
    onMutate: async (input: CreatePersonalityInput) => {
      await queryClient.cancelQueries({
        queryKey: ["personalities", input.userId],
      });

      const previousPersonalities = queryClient.getQueryData<
        PersonalitySelect[]
      >(["personalities", input.userId]);

      // Optimistic update
      const optimisticPersonality: Partial<PersonalitySelect> = {
        id: `optimistic-${Date.now()}`,
        userId: input.userId,
        name: input.name,
        description: input.description,
        traits: input.traits,
        systemPrompt: input.systemPrompt ?? null,
        color: input.color ?? "chart-1",
        isDefault: false,
        isActive: true,
        createdAt: new Date(),
      };

      queryClient.setQueryData<PersonalitySelect[]>(
        ["personalities", input.userId],
        (old) => [...(old ?? []), optimisticPersonality as PersonalitySelect]
      );

      return { previousPersonalities };
    },
    onError: (_err, input, context) => {
      if (context?.previousPersonalities) {
        queryClient.setQueryData(
          ["personalities", input.userId],
          context.previousPersonalities
        );
      }
    },
    onSuccess: (_result, input) => {
      queryClient.invalidateQueries({
        queryKey: ["personalities", input.userId],
      });
    },
  });
}

export function useUpdatePersonality() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      personalityId,
      userId,
      updates,
    }: {
      personalityId: string;
      userId: string;
      updates: {
        name?: string;
        description?: string;
        traits?: string[];
        systemPrompt?: string;
        color?: string;
      };
    }) => updatePersonalityAction(personalityId, userId, updates),
    onSuccess: (_result, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["personalities", userId] });
    },
  });
}

export function useDeletePersonality() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      personalityId,
      userId,
    }: {
      personalityId: string;
      userId: string;
    }) => deletePersonalityAction(personalityId, userId),
    onSuccess: (_result, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["personalities", userId] });
    },
  });
}

export function useSeedDefaultPersonalities() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: seedDefaultPersonalitiesAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personalities"] });
    },
  });
}
