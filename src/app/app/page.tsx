"use client"

import { useState, useCallback, useMemo } from "react"
import { useUser } from "@clerk/nextjs"
import { Play, Square, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PersonalityGrid } from "@/components/personality-grid"
import { TestConfigPanel, type TestConfig } from "@/components/test-config-panel"
import { usePersonalities } from "@/hooks/use-personalities"
import { usePrompts } from "@/hooks/use-prompts"
import { useStartTestRun, useStopTestRun, useTestRun } from "@/hooks/use-test-runs"
import type { Personality } from "@/lib/types"

const DEFAULT_CONFIG: TestConfig = {
  testsPerPersonality: {},
  concurrency: 5,
  businessMetrics: {
    resolutionTarget: 85,
    avgHandleTimeTarget: 120,
    csatTarget: 4.2,
    escalationRateTarget: 10,
    costPerCall: 0.45,
  },
}

export default function EvaluationPage() {
  const { user } = useUser()
  const userId = user?.id ?? ""

  const [selectedPersonalities, setSelectedPersonalities] = useState<string[]>([])
  const [config, setConfig] = useState<TestConfig>(DEFAULT_CONFIG)
  const [currentTestRunId, setCurrentTestRunId] = useState<string | null>(null)
  const [selectedSession, setSelectedSession] = useState<any>(null)

  const { data: backendPersonalities } = usePersonalities(userId)
  const { data: prompts } = usePrompts(userId)
  const { data: testRun } = useTestRun(currentTestRunId)

  const startTestRunMutation = useStartTestRun()
  const stopTestRunMutation = useStopTestRun()

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

  const activePrompt = prompts?.[0]
  const sessions = (testRun as any)?.sessions ?? []
  const isRunning = testRun?.status === "running" || testRun?.status === "pending"

  const startTests = useCallback(async () => {
    if (selectedPersonalities.length === 0 || !userId || !activePrompt) return

    const result = await startTestRunMutation.mutateAsync({
      userId,
      promptId: activePrompt.id,
      personalityIds: selectedPersonalities,
      config,
    })

    if (result.success && result.testRunId) {
      setCurrentTestRunId(result.testRunId)
    }
  }, [selectedPersonalities, config, userId, activePrompt, startTestRunMutation])

  const stopTests = useCallback(async () => {
    if (!currentTestRunId || !userId) return

    await stopTestRunMutation.mutateAsync({
      testRunId: currentTestRunId,
      userId,
    })
  }, [currentTestRunId, userId, stopTestRunMutation])

  const togglePersonality = useCallback((id: string) => {
    setSelectedPersonalities((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }, [])

  const selectAll = useCallback(() => {
    setSelectedPersonalities(personalities.map((p) => p.id))
  }, [personalities])

  const completedSessions = sessions.filter((s: any) => s.status === "completed").length
  const runningSessions = sessions.filter((s: any) => s.status === "running").length
  const totalTests = selectedPersonalities.reduce(
    (sum, id) => sum + (config.testsPerPersonality[id] || 10),
    0
  )

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-medium tracking-tight mb-1">Agent Evaluation</h1>
          <p className="text-muted-foreground text-sm">
            Test your agent with synthetic user personas
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="xl:col-span-2 space-y-4">
            {/* Prompt Selection */}
            {activePrompt && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground">Testing Prompt</span>
                      <div className="font-medium">{activePrompt.name}</div>
                    </div>
                    <Badge variant="outline">v{activePrompt.version}</Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Personality Selection */}
            <PersonalityGrid
              personalities={personalities}
              selected={selectedPersonalities}
              onToggle={togglePersonality}
              onSelectAll={selectAll}
              disabled={isRunning}
            />

            {/* Test Summary Bar */}
            {selectedPersonalities.length > 0 && (
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-muted-foreground">Tests: </span>
                      <span className="font-mono">{totalTests}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Concurrency: </span>
                      <span className="font-mono">{config.concurrency}x</span>
                    </div>
                  </div>
                  {isRunning ? (
                    <Button variant="destructive" size="sm" onClick={stopTests}>
                      <Square className="h-4 w-4 mr-2" />
                      Stop
                    </Button>
                  ) : (
                    <Button size="sm" onClick={startTests} disabled={!activePrompt}>
                      <Play className="h-4 w-4 mr-2" />
                      Run Tests
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Sessions Grid */}
            {sessions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  {isRunning && <div className="w-2 h-2 bg-chart-2 animate-pulse rounded-full" />}
                  <span>{runningSessions} running</span>
                  <span>•</span>
                  <span>{completedSessions} completed</span>
                  <span>•</span>
                  <span>{sessions.length} total</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {sessions.map((session: any) => {
                    const personality = personalities.find((p) => p.id === session.personalityId)
                    const statusColor =
                      session.status === "completed" ? "bg-chart-1" :
                      session.status === "running" ? "bg-chart-2 animate-pulse" :
                      session.status === "failed" ? "bg-chart-3" : "bg-muted"

                    return (
                      <Card
                        key={session.id}
                        className={`cursor-pointer hover:border-primary/50 transition-all ${
                          selectedSession?.id === session.id ? "border-primary ring-1 ring-primary" : ""
                        }`}
                        onClick={() => setSelectedSession(session)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${statusColor}`} />
                            <span className="text-sm font-medium truncate">
                              {personality?.name ?? "Unknown"}
                            </span>
                          </div>
                          <Progress value={session.progress ?? 0} className="h-1 mb-2" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{session.turns ?? 0} turns</span>
                            <span>{session.accuracy?.toFixed(0) ?? "—"}%</span>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Config or Session Detail */}
          <div className="space-y-4">
            {selectedSession ? (
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="px-4 py-3 border-b flex-row items-center justify-between space-y-0">
                  <div>
                    <h3 className="font-medium">
                      {personalities.find((p) => p.id === selectedSession.personalityId)?.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {selectedSession.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {selectedSession.accuracy?.toFixed(0) ?? "—"}% accuracy
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedSession(null)}>
                    Close
                  </Button>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto p-4">
                  {selectedSession.transcript?.length > 0 ? (
                    <div className="space-y-3">
                      {selectedSession.transcript.map((msg: any, i: number) => (
                        <div
                          key={i}
                          className={`flex ${msg.role === "agent" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] p-3 rounded-lg text-sm ${
                              msg.role === "user"
                                ? "bg-secondary"
                                : "bg-primary text-primary-foreground"
                            }`}
                          >
                            <div className="text-xs opacity-70 mb-1 uppercase font-medium">
                              {msg.role}
                            </div>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Waiting for messages...
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <TestConfigPanel
                personalities={personalities}
                selected={selectedPersonalities}
                config={config}
                onConfigChange={setConfig}
                disabled={isRunning}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
