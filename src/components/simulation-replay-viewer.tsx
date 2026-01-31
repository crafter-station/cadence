"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  MessageSquare,
  Target,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { useSnapshot } from "@/hooks/use-evaluations"

interface SimulationReplayViewerProps {
  evaluationId: string
  snapshotId: string
}

export function SimulationReplayViewer({
  evaluationId,
  snapshotId,
}: SimulationReplayViewerProps) {
  const { data: snapshot, isLoading } = useSnapshot(snapshotId)
  const [currentTurn, setCurrentTurn] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Loading replay...
      </div>
    )
  }

  if (!snapshot) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Snapshot not found
      </div>
    )
  }

  const data = snapshot.snapshotData
  if (!data) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        No replay data available
      </div>
    )
  }

  const transcript = data.transcript ?? []
  const totalTurns = transcript.length
  const visibleTranscript = transcript.slice(0, currentTurn + 1)
  const progress = totalTurns > 0 ? ((currentTurn + 1) / totalTurns) * 100 : 0

  const handlePlay = () => {
    if (currentTurn >= totalTurns - 1) {
      setCurrentTurn(0)
    }
    setIsPlaying(true)

    const interval = setInterval(() => {
      setCurrentTurn((prev) => {
        if (prev >= totalTurns - 1) {
          clearInterval(interval)
          setIsPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, 1500)
  }

  const handlePause = () => {
    setIsPlaying(false)
  }

  const handleReset = () => {
    setCurrentTurn(0)
    setIsPlaying(false)
  }

  const handlePrev = () => {
    setCurrentTurn((prev) => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setCurrentTurn((prev) => Math.min(totalTurns - 1, prev + 1))
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/app/evaluations/${evaluationId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold">Simulation Replay</h1>
            <p className="text-sm text-muted-foreground">
              {data.personality.name} • Epoch {data.environment.epochNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">
            Turn {currentTurn + 1}/{totalTurns}
          </Badge>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Transcript Panel */}
        <div className="flex-1 flex flex-col border-r border-border">
          {/* Playback Controls */}
          <div className="border-b border-border px-6 py-3 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handlePrev}>
                <SkipBack className="h-4 w-4" />
              </Button>
              {isPlaying ? (
                <Button onClick={handlePause} size="icon">
                  <Pause className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handlePlay} size="icon">
                  <Play className="h-4 w-4" />
                </Button>
              )}
              <Button variant="outline" size="icon" onClick={handleNext}>
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
            <Progress value={progress} className="flex-1 h-2" />
          </div>

          {/* Transcript */}
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-4">
              {visibleTranscript.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex gap-4 ${
                    idx === currentTurn ? "opacity-100" : "opacity-60"
                  }`}
                >
                  <div
                    className={`shrink-0 w-12 font-mono text-xs uppercase ${
                      message.role === "user" ? "text-chart-3" : "text-chart-1"
                    }`}
                  >
                    {message.role}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{message.content}</p>
                    {message.latency != null && (
                      <span className="text-xs text-muted-foreground mt-1 block">
                        {message.latency}ms
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {currentTurn < totalTurns - 1 && (
                <div className="flex gap-4 opacity-30">
                  <div className="shrink-0 w-12 font-mono text-xs uppercase text-muted-foreground">
                    ...
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {totalTurns - currentTurn - 1} more messages
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Info Panel */}
        <div className="w-80 flex flex-col bg-secondary/10">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Personality */}
              <Card>
                <CardHeader className="px-4 py-3 border-b border-border">
                  <h3 className="text-sm font-medium">Personality</h3>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-3 w-3 rounded-full bg-chart-1" />
                    <span className="font-medium">{data.personality.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {data.personality.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {data.personality.traits.map((trait) => (
                      <Badge key={trait} variant="outline" className="text-xs">
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Metrics */}
              <Card>
                <CardHeader className="px-4 py-3 border-b border-border">
                  <h3 className="text-sm font-medium">Metrics</h3>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Accuracy</span>
                    <span className="text-sm font-medium">
                      {data.metrics.accuracy?.toFixed(1) ?? "—"}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Conversion Score
                    </span>
                    <span className="text-sm font-medium">
                      {data.metrics.conversionScore?.toFixed(1) ?? "—"}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Avg Latency
                    </span>
                    <span className="text-sm font-medium">
                      {data.metrics.latency?.toFixed(0) ?? "—"}ms
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Conversion Result */}
              <Card>
                <CardHeader className="px-4 py-3 border-b border-border flex flex-row items-center gap-2 space-y-0">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">Conversion</h3>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge
                      className={
                        data.conversionResult.achieved
                          ? "bg-chart-2/10 text-chart-2 border-0"
                          : "bg-chart-3/10 text-chart-3 border-0"
                      }
                    >
                      {data.conversionResult.achieved ? "Achieved" : "Not Achieved"}
                    </Badge>
                  </div>
                  {data.conversionResult.goals.length > 0 && (
                    <div className="mb-3">
                      <span className="text-xs text-muted-foreground block mb-1">
                        Goals
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {data.conversionResult.goals.map((goal) => (
                          <Badge key={goal} variant="outline" className="text-xs">
                            {goal}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {data.conversionResult.missedOpportunities.length > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">
                        Missed Opportunities
                      </span>
                      <div className="space-y-1">
                        {data.conversionResult.missedOpportunities.map((opp, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 text-xs text-chart-3"
                          >
                            <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                            {opp}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Environment */}
              <Card>
                <CardHeader className="px-4 py-3 border-b border-border">
                  <h3 className="text-sm font-medium">Environment</h3>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Model</span>
                    <span className="text-sm font-mono">
                      {data.environment.model.split("/").pop()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Epoch</span>
                    <span className="text-sm font-mono">
                      {data.environment.epochNumber}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
