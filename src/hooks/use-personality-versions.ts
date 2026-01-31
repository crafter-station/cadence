"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  getPersonalityVersionsAction,
  restorePersonalityVersionAction,
} from "@/actions/personality-version.actions";

export function usePersonalityVersions(personalityId: string | null) {
  return useQuery({
    queryKey: ["personality-versions", personalityId],
    queryFn: () =>
      personalityId ? getPersonalityVersionsAction(personalityId) : [],
    enabled: !!personalityId,
  });
}

export function useRestorePersonalityVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      personalityId,
      versionId,
      userId,
    }: {
      personalityId: string;
      versionId: string;
      userId: string;
    }) => restorePersonalityVersionAction(personalityId, versionId, userId),
    onSuccess: (_result, { personalityId, userId }) => {
      queryClient.invalidateQueries({
        queryKey: ["personality-versions", personalityId],
      });
      queryClient.invalidateQueries({
        queryKey: ["personalities", userId],
      });
    },
  });
}
