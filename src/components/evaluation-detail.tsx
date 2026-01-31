"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import {
  ArrowLeft,
  Play,
  Pause,
  MessageSquare,
  X,
  FileText,
  Users,
  ChevronRight,
  ArrowRight,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { PromptDiffView } from "@/components/prompt-diff-view"
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
  const [selectedEpoch, setSelectedEpoch] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<"sessions" | "prompts">("sessions")

  // Derive values from evaluation (must be before any early returns)
  const config = evaluation?.config
  const epochs = (evaluation as any)?.epochs ?? []
  const currentEpoch = epochs.find((e: any) => e.status === "running") ?? epochs[epochs.length - 1]

  // Get all sessions from all epochs for the sessions view (must be before early returns)
  const allSessions = useMemo(() => {
    const sessions: any[] = []
    for (const epoch of epochs) {
      const epochSessions = epoch?.testRun?.sessions ?? []
      for (const s of epochSessions) {
        sessions.push({
          ...s,
          epochNumber: epoch.epochNumber,
        })
      }
    }
    return sessions
  }, [epochs])

  // Get sessions for current view
  const sessions = useMemo(() => {
    if (selectedEpoch !== null) {
      return epochs.find((e: any) => e.epochNumber === selectedEpoch)?.testRun?.sessions ?? []
    }
    return currentEpoch?.testRun?.sessions ?? []
  }, [epochs, selectedEpoch, currentEpoch])

  const progress = config?.maxEpochs && evaluation
    ? (evaluation.currentEpochNumber / config.maxEpochs) * 100
    : 0

  // Early returns after all hooks
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as "sessions" | "prompts")} className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border px-6">
          <TabsList className="h-10 bg-transparent p-0 gap-4">
            <TabsTrigger
              value="sessions"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2"
            >
              <Users className="w-4 h-4 mr-2" />
              Sessions
            </TabsTrigger>
            <TabsTrigger
              value="prompts"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2"
            >
              <FileText className="w-4 h-4 mr-2" />
              Prompt Evolution
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="flex-1 flex overflow-hidden m-0">
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
        </TabsContent>

        {/* Prompts Tab */}
        <TabsContent value="prompts" className="flex-1 overflow-auto m-0 p-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {epochs.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <p>No epochs yet</p>
                  <p className="text-sm mt-1">Start the evaluation to see prompt evolution</p>
                </div>
              </div>
            ) : (
              epochs.map((epoch: any, index: number) => {
                const prevEpoch = index > 0 ? epochs[index - 1] : null
                const improvement = epoch.improvementApplied

                return (
                  <div key={epoch.id} className="relative">
                    {/* Connection line */}
                    {index > 0 && (
                      <div className="absolute -top-6 left-6 w-0.5 h-6 bg-border" />
                    )}

                    <Card className={`${
                      epoch.status === "running" ? "border-chart-2/50 ring-1 ring-chart-2/20" :
                      epoch.isAccepted ? "border-chart-1/50" : ""
                    }`}>
                      <CardHeader className="px-4 py-3 flex flex-row items-center justify-between space-y-0 border-b border-border">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            epoch.status === "running" ? "bg-chart-2/10 text-chart-2" :
                            epoch.status === "completed" && epoch.isAccepted ? "bg-chart-1/10 text-chart-1" :
                            epoch.status === "completed" ? "bg-secondary text-muted-foreground" :
                            "bg-secondary text-muted-foreground"
                          }`}>
                            {epoch.epochNumber}
                          </div>
                          <div>
                            <h3 className="font-medium">Epoch {epoch.epochNumber}</h3>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {epoch.status === "running" && (
                                <span className="flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 bg-chart-2 rounded-full animate-pulse" />
                                  Running
                                </span>
                              )}
                              {epoch.status === "completed" && (
                                <>
                                  <span>{epoch.accuracy?.toFixed(1)}% accuracy</span>
                                  {epoch.conversionRate != null && (
                                    <>
                                      <span>•</span>
                                      <span>{epoch.conversionRate?.toFixed(1)}% conversion</span>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {epoch.isAccepted && (
                            <Badge variant="secondary" className="bg-chart-1/10 text-chart-1">
                              Accepted
                            </Badge>
                          )}
                          {epoch.accuracyDelta != null && epoch.accuracyDelta !== 0 && (
                            <Badge variant="outline" className={epoch.accuracyDelta > 0 ? "text-chart-1" : "text-chart-3"}>
                              {epoch.accuracyDelta > 0 ? "+" : ""}{epoch.accuracyDelta.toFixed(1)}%
                            </Badge>
                          )}
                        </div>
                      </CardHeader>

                      {improvement && (
                        <CardContent className="p-4 space-y-4">
                          {/* Reasoning */}
                          {improvement.reasoning && (
                            <div>
                              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                                <Sparkles className="w-3 h-3" />
                                AI REASONING
                              </div>
                              <p className="text-sm">{improvement.reasoning}</p>
                            </div>
                          )}

                          {/* Changes */}
                          {improvement.changes && improvement.changes.length > 0 && (
                            <div>
                              <div className="text-xs font-medium text-muted-foreground mb-2">
                                CHANGES APPLIED ({improvement.changes.length})
                              </div>
                              <div className="space-y-2">
                                {improvement.changes.map((change: any, i: number) => (
                                  <div key={i} className="p-3 bg-secondary/50 rounded-lg">
                                    {/* Handle structured changes (new format) */}
                                    {typeof change === "object" && change.type ? (
                                      <>
                                        <div className="flex items-center gap-2 mb-2">
                                          <Badge
                                            variant="outline"
                                            className={`text-xs capitalize ${
                                              change.type === "added" ? "text-chart-1 border-chart-1/30" :
                                              change.type === "removed" ? "text-chart-3 border-chart-3/30" :
                                              change.type === "modified" ? "text-chart-2 border-chart-2/30" :
                                              ""
                                            }`}
                                          >
                                            {change.type}
                                          </Badge>
                                          <span className="text-sm font-medium">{change.section}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-2">{change.description}</p>

                                        {/* Diff view for before/after */}
                                        {(change.before || change.after) && (
                                          <div className="space-y-1.5 text-xs font-mono">
                                            {change.before && (
                                              <div className="p-2 bg-chart-3/10 text-chart-3 rounded border border-chart-3/20 whitespace-pre-wrap">
                                                <span className="opacity-60 select-none">- </span>
                                                {change.before}
                                              </div>
                                            )}
                                            {change.after && (
                                              <div className="p-2 bg-chart-1/10 text-chart-1 rounded border border-chart-1/20 whitespace-pre-wrap">
                                                <span className="opacity-60 select-none">+ </span>
                                                {change.after}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      /* Handle string changes (old format) */
                                      <p className="text-sm">{typeof change === "string" ? change : JSON.stringify(change)}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Full Prompt Diff */}
                          {improvement.originalPrompt && improvement.improvedPrompt && (
                            <div className="pt-3 border-t border-border">
                              <details className="group">
                                <summary className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground flex items-center gap-1 mb-3">
                                  <ChevronRight className="w-3 h-3 transition-transform group-open:rotate-90" />
                                  View full prompt diff
                                </summary>
                                <PromptDiffView
                                  originalPrompt={improvement.originalPrompt}
                                  improvedPrompt={improvement.improvedPrompt}
                                  originalLabel={`v${epoch.epochNumber}`}
                                  improvedLabel={`v${epoch.epochNumber + 1}`}
                                  className="max-h-80"
                                />
                              </details>
                            </div>
                          )}

                          {/* Fallback: View current prompt version */}
                          {!improvement.improvedPrompt && epoch.prompt && (
                            <div className="pt-2 border-t border-border">
                              <details className="group">
                                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground flex items-center gap-1">
                                  <ChevronRight className="w-3 h-3 transition-transform group-open:rotate-90" />
                                  View full prompt v{epoch.prompt.version}
                                </summary>
                                <pre className="mt-3 p-3 bg-secondary/50 rounded-lg text-xs overflow-auto max-h-64 whitespace-pre-wrap">
                                  {epoch.prompt.content}
                                </pre>
                              </details>
                            </div>
                          )}
                        </CardContent>
                      )}

                      {!improvement && epoch.status === "completed" && (
                        <CardContent className="p-4 text-sm text-muted-foreground">
                          Baseline epoch - no changes applied
                        </CardContent>
                      )}

                      {epoch.status === "running" && (
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 text-sm text-chart-2">
                            <div className="w-2 h-2 bg-chart-2 rounded-full animate-pulse" />
                            Analyzing and optimizing...
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  </div>
                )
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Epochs List at Bottom */}
      {epochs.length > 0 && (
        <div className="border-t border-border px-6 py-3">
          <div className="flex items-center gap-2 overflow-auto">
            <span className="text-xs text-muted-foreground shrink-0">Epochs:</span>
            <button
              onClick={() => setSelectedEpoch(null)}
              className={`shrink-0 text-xs px-2 py-1 rounded ${
                selectedEpoch === null ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
              }`}
            >
              Current
            </button>
            {epochs.map((epoch: any) => (
              <button
                key={epoch.id}
                onClick={() => setSelectedEpoch(epoch.epochNumber)}
                className={`shrink-0 text-xs px-2 py-1 rounded flex items-center gap-1 ${
                  selectedEpoch === epoch.epochNumber ? "bg-primary text-primary-foreground" :
                  epoch.status === "running" ? "bg-chart-2/10 text-chart-2" :
                  epoch.isAccepted ? "bg-chart-1/10 text-chart-1 hover:bg-chart-1/20" :
                  "hover:bg-secondary"
                }`}
              >
                E{epoch.epochNumber}
                {epoch.accuracy != null && ` • ${epoch.accuracy.toFixed(0)}%`}
              </button>
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
