"use client"

import type { Personality } from "@/lib/types"
import { Users, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface PersonalityGridProps {
  personalities: Personality[]
  selected: string[]
  onToggle: (id: string) => void
  onSelectAll: () => void
  disabled: boolean
}

export function PersonalityGrid({
  personalities,
  selected,
  onToggle,
  onSelectAll,
  disabled,
}: PersonalityGridProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-border space-y-0">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Test Personalities</span>
          <Badge variant="secondary" className="text-xs">
            {selected.length} selected
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onSelectAll}
          disabled={disabled}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Select all
        </Button>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
          {personalities.map((personality) => {
            const isSelected = selected.includes(personality.id)
            return (
              <div
                key={personality.id}
                onClick={() => !disabled && onToggle(personality.id)}
                className={cn(
                  "p-4 text-left bg-card hover:bg-secondary/50 transition-colors cursor-pointer",
                  isSelected && "bg-secondary/80",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="h-2 w-2 mt-1" style={{
                    backgroundColor: personality.color === "chart-1" ? "oklch(0.65 0.15 250)" :
                      personality.color === "chart-2" ? "oklch(0.7 0.18 150)" :
                      personality.color === "chart-3" ? "oklch(0.65 0.2 30)" :
                      personality.color === "chart-4" ? "oklch(0.7 0.15 330)" :
                      "oklch(0.75 0.12 80)"
                  }} />
                  <div
                    className={cn(
                      "size-4 shrink-0 rounded-[4px] border shadow-xs flex items-center justify-center transition-colors",
                      isSelected
                        ? "bg-foreground border-foreground text-background"
                        : "border-input bg-transparent"
                    )}
                  >
                    {isSelected && <Check className="size-3" />}
                  </div>
                </div>
                <div className="text-sm font-medium mb-1">{personality.name}</div>
                <div className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {personality.description}
                </div>
                <div className="flex flex-wrap gap-1">
                  {personality.traits.slice(0, 2).map((trait) => (
                    <Badge key={trait} variant="secondary" className="text-[10px] font-normal">
                      {trait}
                    </Badge>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
