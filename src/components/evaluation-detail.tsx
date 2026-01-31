"use client"

import { useState } from "react"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import {
  ArrowLeft,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  useEvaluation,
  useStartEvaluation,
  usePauseEvaluation,
} from "@/hooks/use-evaluations"

interface EvaluationDetailProps {
  evaluationId: string
}

export function EvaluationDetail({ evaluationId }: EvaluationDetailProps) {
  const { user } = useUser()
  const { data: evaluation, isLoading } = useEvaluation(evaluationId)
  const startEvaluation = useStartEvaluation()
  const pauseEvaluation = usePauseEvaluation()
  const [selectedSession, setSelectedSession] = useState<any>(null)

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    )
  }

  if (!evaluation) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Not found
      </div>
    )
  }

  const config = evaluation.config
  const epochs = (evaluation as any).epochs ?? []
  const currentEpoch = epochs.find((e: any) => e.status === "running") ?? epochs[epochs.length - 1]
  const sessions = currentEpoch?.testRun?.sessions ?? []

  const progress = config?.maxEpochs
    ? (evaluation.currentEpochNumber / config.maxEpochs) * 100
    : 0

  const handleStart = async () => {
    if (!user?.id) return
    await startEvaluation.mutateAsync({
      evaluationId: evaluation.id,
      userId: user.id,
    })
  }

  const handlePause = async () => {
    if (!user?.id) return
    await pauseEvaluation.mutateAsync({
      evaluationId: evaluation.id,
      userId: user.id,
    })
  }

  const completedSessions = sessions.filter((s: any) => s.status === "completed").length
  const runningSessions = sessions.filter((s: any) => s.status === "running").length

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/app/evaluations">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold">{evaluation.name}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>Epoch {evaluation.currentEpochNumber}/{config?.maxEpochs ?? "?"}</span>
              <span>•</span>
              <span className={evaluation.status === "running" ? "text-chart-2" : ""}>
                {evaluation.status}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(evaluation.status === "pending" || evaluation.status === "paused") && (
            <Button onClick={handleStart} className="gap-2">
              <Play className="h-4 w-4" />
              Start
            </Button>
          )}
          {evaluation.status === "running" && (
            <Button onClick={handlePause} variant="secondary" className="gap-2">
              <Pause className="h-4 w-4" />
              Pause
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 py-3 border-b border-border bg-secondary/20">
        <div className="flex items-center gap-4 mb-2">
          <Progress value={progress} className="flex-1 h-2" />
          <span className="text-sm font-mono text-muted-foreground">
            {Math.round(progress)}%
          </span>
        </div>
        {sessions.length > 0 && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-chart-2 animate-pulse" />
              {runningSessions} running
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-chart-1" />
              {completedSessions} completed
            </span>
            <span>{sessions.length} total</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sessions Grid */}
        <div className="flex-1 overflow-auto p-4">
          {sessions.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p>No sessions yet</p>
                <p className="text-sm mt-1">Start the evaluation to see sessions</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {sessions.map((session: any) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onClick={() => setSelectedSession(session)}
                  isSelected={selectedSession?.id === session.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Session Detail Panel */}
        {selectedSession && (
          <div className="w-96 border-l border-border flex flex-col bg-card">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-medium">{selectedSession.personality?.name}</h3>
                <Badge
                  variant="outline"
                  className={`text-xs mt-1 ${
                    selectedSession.status === "completed" ? "text-chart-1 border-chart-1/30" :
                    selectedSession.status === "running" ? "text-chart-2 border-chart-2/30" :
                    ""
                  }`}
                >
                  {selectedSession.status}
                </Badge>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedSession(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Metrics */}
            <div className="px-4 py-3 border-b border-border grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-semibold">{selectedSession.accuracy?.toFixed(0) ?? "—"}%</div>
                <div className="text-xs text-muted-foreground">Accuracy</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{selectedSession.turns ?? 0}</div>
                <div className="text-xs text-muted-foreground">Turns</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{selectedSession.avgLatency?.toFixed(0) ?? "—"}ms</div>
                <div className="text-xs text-muted-foreground">Latency</div>
              </div>
            </div>

            {/* Transcript */}
            <div className="flex-1 overflow-auto">
              <div className="p-4 space-y-3">
                {selectedSession.transcript?.length > 0 ? (
                  selectedSession.transcript.map((msg: any, i: number) => (
                    <div key={i} className={`flex gap-3 ${msg.role === "agent" ? "flex-row-reverse" : ""}`}>
                      <div
                        className={`max-w-[80%] p-3 rounded-lg text-sm ${
                          msg.role === "user"
                            ? "bg-secondary"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        <div className="text-xs opacity-70 mb-1 uppercase">
                          {msg.role}
                        </div>
                        {msg.content}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    No messages yet
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Epochs List at Bottom */}
      {epochs.length > 0 && (
        <div className="border-t border-border px-6 py-3">
          <div className="flex items-center gap-2 overflow-auto">
            <span className="text-xs text-muted-foreground shrink-0">Epochs:</span>
            {epochs.map((epoch: any) => (
              <Badge
                key={epoch.id}
                variant={epoch.status === "completed" ? "secondary" : "outline"}
                className={`shrink-0 ${
                  epoch.status === "running" ? "bg-chart-2/10 text-chart-2 border-chart-2/30" :
                  epoch.isAccepted ? "bg-chart-1/10 text-chart-1" : ""
                }`}
              >
                E{epoch.epochNumber}
                {epoch.accuracy != null && ` • ${epoch.accuracy.toFixed(0)}%`}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SessionCard({ session, onClick, isSelected }: {
  session: any
  onClick: () => void
  isSelected: boolean
}) {
  const statusColor =
    session.status === "completed" ? "bg-chart-1" :
    session.status === "running" ? "bg-chart-2 animate-pulse" :
    session.status === "failed" ? "bg-chart-3" :
    "bg-muted"

  return (
    <Card
      className={`cursor-pointer transition-all hover:border-primary/50 ${
        isSelected ? "border-primary ring-1 ring-primary" : ""
      }`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${statusColor}`} />
          <span className="text-sm font-medium truncate">
            {session.personality?.name ?? "Unknown"}
          </span>
        </div>

        <Progress value={session.progress ?? 0} className="h-1 mb-2" />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{session.turns ?? 0} turns</span>
          <span>{session.accuracy?.toFixed(0) ?? "—"}%</span>
        </div>

        {session.transcript?.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground truncate">
            <MessageSquare className="w-3 h-3 inline mr-1" />
            {session.transcript[session.transcript.length - 1]?.content?.slice(0, 30)}...
          </div>
        )}
      </CardContent>
    </Card>
  )
}
