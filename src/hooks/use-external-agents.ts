"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  getExternalAgentsForUserAction,
  getExternalAgentWithPromptAction,
  syncExternalAgentAction,
  fetchLiveAgentDataAction,
  updateExternalAgentPromptAction,
  type ExternalAgentWithPrompt,
  type LiveAgentData,
  type SyncedAgentData,
} from "@/actions/external-agent.actions";
import type { ExternalAgentSelect } from "@/db/schema";

export function useExternalAgents(userId: string) {
  return useQuery({
    queryKey: ["external-agents", userId],
    queryFn: () => getExternalAgentsForUserAction(userId),
    enabled: !!userId,
  });
}

export function useExternalAgentByPromptId(
  userId: string,
  promptId: string | null
) {
  const { data: agents } = useExternalAgents(userId);

  // Find the external agent that has this promptId
  const agent = agents?.find((a) => a.promptId === promptId) ?? null;

  return {
    data: agent,
    isExternalAgent: !!agent,
  };
}

export function useExternalAgentWithPrompt(
  agentId: string | null,
  userId: string
) {
  return useQuery({
    queryKey: ["external-agent-with-prompt", agentId],
    queryFn: () =>
      agentId ? getExternalAgentWithPromptAction(agentId, userId) : null,
    enabled: !!agentId && !!userId,
  });
}

export function useLiveAgentData(agentId: string | null, userId: string) {
  return useQuery({
    queryKey: ["live-agent-data", agentId],
    queryFn: async () => {
      if (!agentId) return null;
      const result = await fetchLiveAgentDataAction(agentId, userId);
      return result.success ? result.data : null;
    },
    enabled: !!agentId && !!userId,
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}

export function useSyncExternalAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      agentId,
      userId,
    }: {
      agentId: string;
      userId: string;
    }) => syncExternalAgentAction(agentId, userId),
    onSuccess: (result, { agentId, userId }) => {
      if (result.success) {
        queryClient.invalidateQueries({
          queryKey: ["external-agents", userId],
        });
        queryClient.invalidateQueries({
          queryKey: ["external-agent-with-prompt", agentId],
        });
        queryClient.invalidateQueries({
          queryKey: ["live-agent-data", agentId],
        });
        queryClient.invalidateQueries({
          queryKey: ["prompts", userId],
        });
      }
    },
  });
}

export function useUpdateExternalAgentPrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      agentId,
      userId,
      newPrompt,
    }: {
      agentId: string;
      userId: string;
      newPrompt: string;
    }) => updateExternalAgentPromptAction(agentId, userId, newPrompt),
    onSuccess: (result, { agentId, userId }) => {
      if (result.success) {
        queryClient.invalidateQueries({
          queryKey: ["external-agents", userId],
        });
        queryClient.invalidateQueries({
          queryKey: ["external-agent-with-prompt", agentId],
        });
        queryClient.invalidateQueries({
          queryKey: ["live-agent-data", agentId],
        });
        queryClient.invalidateQueries({
          queryKey: ["prompts", userId],
        });
      }
    },
  });
}
