"use client"

import type { Metadata } from "next"
import { useState, useCallback, useMemo } from "react"
import { PersonalityManager } from "@/components/personality-manager"
import { usePersonalities } from "@/hooks/use-personalities"
import type { Personality } from "@/lib/types"
import { FALLBACK_PERSONALITIES } from "@/lib/types"

const MOCK_USER_ID = "user_demo_123"

export default function PersonasPage() {
  const [customPersonalities, setCustomPersonalities] = useState<Personality[]>([])

  const { data: backendPersonalities } = usePersonalities(MOCK_USER_ID)

  const basePersonalities = useMemo<Personality[]>(() => {
    if (backendPersonalities?.length) {
      return backendPersonalities.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        traits: p.traits,
        color: p.color,
      }))
    }
    return FALLBACK_PERSONALITIES
  }, [backendPersonalities])

  const personalities = useMemo<Personality[]>(() => {
    // Merge base and custom, keeping original order for base items
    // Custom edits of base items stay in their original position
    const merged = basePersonalities.map((bp) => {
      const customVersion = customPersonalities.find((cp) => cp.id === bp.id)
      return customVersion || bp
    })
    // Add truly new custom personalities at the end
    const newCustom = customPersonalities.filter(
      (cp) => !basePersonalities.some((bp) => bp.id === cp.id)
    )
    return [...merged, ...newCustom]
  }, [basePersonalities, customPersonalities])

  const handleAddPersonality = useCallback((data: Omit<Personality, "id">) => {
    const newPersonality: Personality = {
      ...data,
      id: `custom-${Date.now()}`,
    }
    setCustomPersonalities((prev) => [...prev, newPersonality])
  }, [])

  const handleEditPersonality = useCallback(
    (id: string, updates: Partial<Personality>) => {
      setCustomPersonalities((prev) => {
        const existing = prev.find((p) => p.id === id)
        if (existing) {
          return prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
        }
        const base = basePersonalities.find((p) => p.id === id)
        if (base) {
          return [...prev, { ...base, ...updates }]
        }
        return prev
      })
    },
    [basePersonalities]
  )

  const handleDeletePersonality = useCallback((id: string) => {
    setCustomPersonalities((prev) => prev.filter((p) => p.id !== id))
  }, [])

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
        <PersonalityManager
          personalities={personalities}
          onAdd={handleAddPersonality}
          onEdit={handleEditPersonality}
          onDelete={handleDeletePersonality}
          disabled={false}
        />
      </div>
    </div>
  )
}
