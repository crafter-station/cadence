"use client"

import { useQuery } from "@tanstack/react-query"

import { getExternalAgentsForUserAction } from "@/actions/external-agent.actions"

export function useExternalAgents(userId: string | undefined) {
  return useQuery({
    queryKey: ["external-agents", userId],
    queryFn: () => (userId ? getExternalAgentsForUserAction(userId) : []),
    enabled: !!userId,
  })
}
