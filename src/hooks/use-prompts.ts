"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  getPromptsAction,
  getPromptAction,
  getPromptVersionsAction,
  createPromptAction,
  updatePromptAction,
  deletePromptAction,
  createPromptVersionAction,
  getAllPromptsGroupedAction,
  type CreatePromptInput,
  type CreatePromptVersionInput,
} from "@/actions/prompt.actions";
import type { PromptSelect } from "@/db/schema";

export function usePrompts(userId: string) {
  return useQuery({
    queryKey: ["prompts", userId],
    queryFn: () => getPromptsAction(userId),
    enabled: !!userId,
  });
}

export function usePrompt(promptId: string | null) {
  return useQuery({
    queryKey: ["prompt", promptId],
    queryFn: () => (promptId ? getPromptAction(promptId) : null),
    enabled: !!promptId,
  });
}

export function usePromptVersions(userId: string, promptName: string | null) {
  return useQuery({
    queryKey: ["prompt-versions", userId, promptName],
    queryFn: () =>
      promptName ? getPromptVersionsAction(userId, promptName) : [],
    enabled: !!userId && !!promptName,
  });
}

export function useCreatePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPromptAction,
    onMutate: async (input: CreatePromptInput) => {
      await queryClient.cancelQueries({ queryKey: ["prompts", input.userId] });

      const previousPrompts = queryClient.getQueryData<PromptSelect[]>([
        "prompts",
        input.userId,
      ]);

      // Optimistic update
      const optimisticPrompt: Partial<PromptSelect> = {
        id: `optimistic-${Date.now()}`,
        userId: input.userId,
        name: input.name,
        content: input.content,
        version: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryClient.setQueryData<PromptSelect[]>(
        ["prompts", input.userId],
        (old) => [optimisticPrompt as PromptSelect, ...(old ?? [])]
      );

      return { previousPrompts };
    },
    onError: (_err, input, context) => {
      if (context?.previousPrompts) {
        queryClient.setQueryData(
          ["prompts", input.userId],
          context.previousPrompts
        );
      }
    },
    onSuccess: (_result, input) => {
      queryClient.invalidateQueries({ queryKey: ["prompts", input.userId] });
    },
  });
}

export function useUpdatePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      promptId,
      userId,
      updates,
    }: {
      promptId: string;
      userId: string;
      updates: { name?: string; content?: string };
    }) => updatePromptAction(promptId, userId, updates),
    onSuccess: (_result, { userId, promptId }) => {
      queryClient.invalidateQueries({ queryKey: ["prompts", userId] });
      queryClient.invalidateQueries({ queryKey: ["prompt", promptId] });
    },
  });
}

export function useDeletePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ promptId, userId }: { promptId: string; userId: string }) =>
      deletePromptAction(promptId, userId),
    onSuccess: (_result, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["prompts", userId] });
      queryClient.invalidateQueries({ queryKey: ["prompts-grouped", userId] });
    },
  });
}

export function usePromptsGrouped(userId: string) {
  return useQuery({
    queryKey: ["prompts-grouped", userId],
    queryFn: () => getAllPromptsGroupedAction(userId),
    enabled: !!userId,
  });
}

export function useCreatePromptVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPromptVersionAction,
    onSuccess: (_result, input) => {
      queryClient.invalidateQueries({ queryKey: ["prompts", input.userId] });
      queryClient.invalidateQueries({ queryKey: ["prompts-grouped", input.userId] });
      queryClient.invalidateQueries({ queryKey: ["prompt-versions"] });
    },
  });
}
