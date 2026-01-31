"use client"

import { useMemo } from "react"
import { useUser } from "@clerk/nextjs"
import { PersonalityManager } from "@/components/personality-manager"
import {
  usePersonalities,
  useCreatePersonality,
  useUpdatePersonality,
  useDeletePersonality,
} from "@/hooks/use-personalities"
import type { Personality } from "@/lib/types"

export default function PersonasPage() {
  const { user, isLoaded: isUserLoaded } = useUser()
  const userId = user?.id

  const { data: backendPersonalities, isLoading: isLoadingPersonalities } = usePersonalities(userId)
  const createMutation = useCreatePersonality()
  const updateMutation = useUpdatePersonality()
  const deleteMutation = useDeletePersonality()

  const personalities = useMemo<Personality[]>(() => {
    if (!backendPersonalities) return []
    return backendPersonalities.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      traits: p.traits,
      color: p.color,
      systemPrompt: p.systemPrompt ?? undefined,
    }))
  }, [backendPersonalities])

  const handleAddPersonality = (data: Omit<Personality, "id">) => {
    if (!userId) return
    createMutation.mutate({
      userId,
      name: data.name,
      description: data.description,
      traits: data.traits,
      systemPrompt: data.systemPrompt,
      color: data.color,
    })
  }

  const handleEditPersonality = (id: string, updates: Partial<Personality>) => {
    if (!userId) return
    updateMutation.mutate({
      personalityId: id,
      userId,
      updates: {
        name: updates.name,
        description: updates.description,
        traits: updates.traits,
        systemPrompt: updates.systemPrompt,
        color: updates.color,
      },
    })
  }

  const handleDeletePersonality = (id: string) => {
    if (!userId) return
    deleteMutation.mutate({
      personalityId: id,
      userId,
    })
  }

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending

  return (
    <div className="h-[calc(100vh-57px)] overflow-auto">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-xl font-medium tracking-tight text-foreground mb-1">
            Test Personas
          </h1>
          <p className="text-muted-foreground text-sm">
            Create and manage synthetic user personas for evaluating your AI agent
          </p>
        </div>
        {!isUserLoaded || isLoadingPersonalities ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            Loading personas...
          </div>
        ) : !userId ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            Please sign in to manage personas
          </div>
        ) : (
          <PersonalityManager
            personalities={personalities}
            backendPersonalities={backendPersonalities}
            userId={userId}
            onAdd={handleAddPersonality}
            onEdit={handleEditPersonality}
            onDelete={handleDeletePersonality}
            disabled={isMutating}
          />
        )}
      </div>
    </div>
  )
}
