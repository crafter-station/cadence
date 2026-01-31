"use client"

import type { TestSession, Personality } from "@/app/page"
import { Play, Square, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TestRunnerProps {
  sessions: TestSession[]
  personalities: Personality[]
  isRunning: boolean
  onStart: () => void
  onStop: () => void
  hasSelection: boolean
}

export function TestRunner({
  sessions,
  personalities,
  isRunning,
  onStart,
  onStop,
  hasSelection,
}: TestRunnerProps) {
  const getPersonality = (id: string) =>
    personalities.find((p) => p.id === id)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-border space-y-0">
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-2 w-2",
            isRunning ? "bg-chart-2 animate-pulse" : sessions.length > 0 ? "bg-chart-1" : "bg-muted-foreground"
          )} />
          <span className="text-sm font-medium">
            {isRunning ? "Running Tests" : sessions.length > 0 ? "Test Complete" : "Test Runner"}
          </span>
          {isRunning && (
            <Badge variant="outline" className="text-xs font-mono">
              {sessions.filter((s) => s.status === "running").length} active
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isRunning ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={onStop}
              className="gap-1.5"
            >
              <Square className="h-3 w-3" />
              Stop
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onStart}
              disabled={!hasSelection}
              className="gap-1.5"
            >
              <Play className="h-3 w-3" />
              Run Tests
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {sessions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-muted-foreground text-sm">
              Select personalities above and click Run Tests to start parallel evaluation
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sessions.map((session) => {
              const personality = getPersonality(session.personalityId)
              if (!personality) return null

              return (
                <div key={session.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2" style={{
                        backgroundColor: personality.color === "chart-1" ? "oklch(0.65 0.15 250)" :
                          personality.color === "chart-2" ? "oklch(0.7 0.18 150)" :
                          personality.color === "chart-3" ? "oklch(0.65 0.2 30)" :
                          personality.color === "chart-4" ? "oklch(0.7 0.15 330)" :
                          "oklch(0.75 0.12 80)"
                      }} />
                      <span className="text-sm font-medium">{personality.name}</span>
                      <Badge 
                        variant={session.status === "running" ? "default" : session.status === "completed" ? "secondary" : "destructive"}
                        className={cn(
                          "text-[10px]",
                          session.status === "running" && "bg-chart-2/20 text-chart-2 border-chart-2/30",
                          session.status === "completed" && "bg-chart-1/20 text-chart-1 border-chart-1/30"
                        )}
                      >
                        {session.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                      <span>{session.turns} turns</span>
                      <span>{session.latency.length > 0 ? Math.round(session.latency.reduce((a, b) => a + b, 0) / session.latency.length) : 0}ms avg</span>
                      <span>{session.accuracy.toFixed(1)}%</span>
                    </div>
                  </div>

                  <Progress value={session.progress} className="h-1 mb-4" />

                  <div className="bg-secondary/50 p-3">
                    <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />
                      Live Transcript
                    </div>
                    <ScrollArea className="h-32">
                      <div className="space-y-2">
                        {session.transcript.map((msg, idx) => (
                          <div key={idx} className="flex gap-2 text-xs">
                            <span className={cn(
                              "shrink-0 w-12 font-mono uppercase",
                              msg.role === "user" ? "text-chart-3" : "text-chart-1"
                            )}>
                              {msg.role}
                            </span>
                            <span className="text-foreground/80">{msg.content}</span>
                          </div>
                        ))}
                        {session.status === "running" && (
                          <div className="flex gap-2 text-xs">
                            <span className="shrink-0 w-12 font-mono uppercase text-muted-foreground">
                              ...
                            </span>
                            <span className="text-muted-foreground animate-pulse">Processing</span>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
