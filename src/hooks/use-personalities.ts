"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  getPersonalitiesAction,
  createPersonalityAction,
  updatePersonalityAction,
  deletePersonalityAction,
  seedDefaultPersonalitiesAction,
  cloneDefaultsForUserAction,
  resetToDefaultsAction,
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
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
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
      changeReason,
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
      changeReason?: string;
    }) => updatePersonalityAction(personalityId, userId, updates, changeReason),
    onMutate: async ({ personalityId, userId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["personalities", userId] });
      const previous = queryClient.getQueryData<PersonalitySelect[]>([
        "personalities",
        userId,
      ]);

      // Optimistic update
      queryClient.setQueryData<PersonalitySelect[]>(
        ["personalities", userId],
        (old) =>
          old?.map((p) =>
            p.id === personalityId ? { ...p, ...updates, updatedAt: new Date() } : p
          )
      );

      return { previous };
    },
    onError: (_err, { userId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["personalities", userId], context.previous);
      }
    },
    onSettled: (_result, _err, { userId, personalityId }) => {
      queryClient.invalidateQueries({ queryKey: ["personalities", userId] });
      queryClient.invalidateQueries({
        queryKey: ["personality-versions", personalityId],
      });
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
    onMutate: async ({ personalityId, userId }) => {
      await queryClient.cancelQueries({ queryKey: ["personalities", userId] });
      const previous = queryClient.getQueryData<PersonalitySelect[]>([
        "personalities",
        userId,
      ]);

      // Optimistic delete - remove immediately
      queryClient.setQueryData<PersonalitySelect[]>(
        ["personalities", userId],
        (old) => old?.filter((p) => p.id !== personalityId)
      );

      return { previous };
    },
    onError: (_err, { userId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["personalities", userId], context.previous);
      }
    },
    onSettled: (_result, _err, { userId }) => {
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

export function useCloneDefaultsForUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cloneDefaultsForUserAction,
    onSuccess: (_result, userId) => {
      queryClient.invalidateQueries({ queryKey: ["personalities", userId] });
    },
  });
}

export function useResetToDefaults() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resetToDefaultsAction,
    onSuccess: (_result, userId) => {
      queryClient.invalidateQueries({ queryKey: ["personalities", userId] });
    },
  });
}
