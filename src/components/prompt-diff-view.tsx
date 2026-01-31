"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface PromptDiffViewProps {
  originalPrompt: string
  improvedPrompt: string
  originalLabel?: string
  improvedLabel?: string
  className?: string
}

interface DiffLine {
  type: 'same' | 'added' | 'removed'
  line: string
}

function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')
  const diff: DiffLine[] = []

  const maxLen = Math.max(oldLines.length, newLines.length)
  for (let i = 0; i < maxLen; i++) {
    const oldLine = oldLines[i]
    const newLine = newLines[i]

    if (oldLine === newLine) {
      if (oldLine !== undefined) diff.push({ type: 'same', line: oldLine })
    } else {
      if (oldLine !== undefined && !newLines.includes(oldLine)) {
        diff.push({ type: 'removed', line: oldLine })
      }
      if (newLine !== undefined && !oldLines.includes(newLine)) {
        diff.push({ type: 'added', line: newLine })
      }
    }
  }

  return diff
}

export function PromptDiffView({
  originalPrompt,
  improvedPrompt,
  originalLabel = "Original",
  improvedLabel = "Improved",
  className = "",
}: PromptDiffViewProps) {
  const diff = useMemo(
    () => computeDiff(originalPrompt, improvedPrompt),
    [originalPrompt, improvedPrompt]
  )

  const addedCount = diff.filter(d => d.type === 'added').length
  const removedCount = diff.filter(d => d.type === 'removed').length

  return (
    <div className={`flex flex-col border border-border rounded-lg overflow-hidden ${className}`}>
      {/* Header with stats */}
      <div className="px-3 py-2 bg-secondary/30 border-b border-border flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Prompt Diff</span>
        <div className="flex items-center gap-2 text-xs">
          {addedCount > 0 && (
            <span className="text-chart-1">+{addedCount} added</span>
          )}
          {removedCount > 0 && (
            <span className="text-destructive">-{removedCount} removed</span>
          )}
        </div>
      </div>

      {/* Side by side diff */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left - Original */}
        <div className="flex-1 border-r border-border flex flex-col overflow-hidden">
          <div className="px-3 py-1.5 border-b border-border bg-destructive/5 shrink-0">
            <Badge variant="outline" className="text-xs font-mono text-destructive/80">
              {originalLabel}
            </Badge>
          </div>
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-3 font-mono text-xs leading-relaxed">
              {diff.map((line, i) => (
                <div
                  key={i}
                  className={`px-2 -mx-2 ${
                    line.type === 'removed'
                      ? 'bg-destructive/10 text-destructive'
                      : line.type === 'added'
                      ? 'opacity-0 h-0 overflow-hidden'
                      : ''
                  }`}
                >
                  <span className="select-none text-muted-foreground w-5 inline-block">
                    {line.type === 'removed' ? '-' : ' '}
                  </span>
                  {line.line || ' '}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Right - Improved */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-3 py-1.5 border-b border-border bg-chart-1/5 shrink-0">
            <Badge variant="outline" className="text-xs font-mono text-chart-1/80">
              {improvedLabel}
            </Badge>
          </div>
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-3 font-mono text-xs leading-relaxed">
              {diff.map((line, i) => (
                <div
                  key={i}
                  className={`px-2 -mx-2 ${
                    line.type === 'added'
                      ? 'bg-chart-1/10 text-chart-1'
                      : line.type === 'removed'
                      ? 'opacity-0 h-0 overflow-hidden'
                      : ''
                  }`}
                >
                  <span className="select-none text-muted-foreground w-5 inline-block">
                    {line.type === 'added' ? '+' : ' '}
                  </span>
                  {line.line || ' '}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
