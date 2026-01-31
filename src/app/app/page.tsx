"use client"

import { TestRunner } from "@/components/test-runner"
import { MetricsPanel } from "@/components/metrics-panel"
import { PersonalityGrid } from "@/components/personality-grid"
import { SelfHealingPanel } from "@/components/self-healing-panel"
import { TestConfigPanel, type TestConfig } from "@/components/test-config-panel"
import { BusinessOutcomesPanel } from "@/components/business-outcomes-panel"
import { useState, useCallback, useEffect, useMemo } from "react"
import { useUser } from "@clerk/nextjs"
import { usePersonalities } from "@/hooks/use-personalities"
import { useStartTestRun, useStopTestRun } from "@/hooks/use-test-runs"
import { useRealtimeTestRun } from "@/hooks/use-realtime-test-run"
import type { Personality, TestSession, TestStatus } from "@/lib/types"

const DEFAULT_CONFIG: TestConfig = {
  testsPerPersonality: {},
  concurrency: 10,
  businessMetrics: {
    resolutionTarget: 85,
    avgHandleTimeTarget: 120,
    csatTarget: 4.2,
    escalationRateTarget: 10,
    costPerCall: 0.45,
  },
}

const MOCK_PROMPT_ID = "prompt_demo_123"

export default function EvaluationPage() {
  const { user } = useUser()
  const userId = user?.id

  const [sessions, setSessions] = useState<TestSession[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [selectedPersonalities, setSelectedPersonalities] = useState<string[]>([])
  const [config, setConfig] = useState<TestConfig>(DEFAULT_CONFIG)
  const [activeTab, setActiveTab] = useState<"config" | "metrics" | "healing" | "outcomes">("config")
  const [currentTestRunId, setCurrentTestRunId] = useState<string | null>(null)
  const [useSimulation, setUseSimulation] = useState(true)

  const { data: backendPersonalities, isLoading: isLoadingPersonalities } = usePersonalities(userId)

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

  const startTestRunMutation = useStartTestRun()
  const stopTestRunMutation = useStopTestRun()

  const { sessionProgress, isConnected } = useRealtimeTestRun({
    testRunId: currentTestRunId,
    enabled: !useSimulation && !!currentTestRunId,
  })

  useEffect(() => {
    if (!useSimulation && sessionProgress.length > 0) {
      setSessions((prev) => {
        const updated = [...prev]
        for (const progress of sessionProgress) {
          const idx = updated.findIndex((s) => s.id === progress.sessionId)
          if (idx >= 0) {
            updated[idx] = {
              ...updated[idx],
              status: progress.status as TestStatus,
              progress: progress.progress,
              turns: progress.turns,
              accuracy: progress.accuracy ?? updated[idx].accuracy,
            }
          }
        }

        const allComplete = updated.every((s) => s.status === "completed" || s.status === "failed")
        if (allComplete && updated.length > 0) {
          setIsRunning(false)
        }

        return updated
      })
    }
  }, [sessionProgress, useSimulation])

  const startTests = useCallback(async () => {
    if (selectedPersonalities.length === 0) return
    if (!useSimulation && !userId) return

    setIsRunning(true)

    if (!useSimulation && userId) {
      const result = await startTestRunMutation.mutateAsync({
        userId,
        promptId: MOCK_PROMPT_ID,
        personalityIds: selectedPersonalities,
        config,
      })

      if (result.success && result.testRunId) {
        setCurrentTestRunId(result.testRunId)
        const newSessions: TestSession[] = []
        selectedPersonalities.forEach((pId) => {
          const testCount = config.testsPerPersonality[pId] || 10
          for (let i = 0; i < testCount; i++) {
            newSessions.push({
              id: `session-${pId}-${i}-${Date.now()}`,
              personalityId: pId,
              instanceId: i + 1,
              status: "running",
              progress: 0,
              latency: [],
              accuracy: 0,
              turns: 0,
              errors: 0,
              transcript: [],
            })
          }
        })
        setSessions(newSessions)
      } else {
        setIsRunning(false)
        console.error("Failed to start test run:", result.error)
      }
    } else {
      const newSessions: TestSession[] = []
      selectedPersonalities.forEach((pId) => {
        const testCount = config.testsPerPersonality[pId] || 10
        for (let i = 0; i < testCount; i++) {
          newSessions.push({
            id: `session-${pId}-${i}-${Date.now()}`,
            personalityId: pId,
            instanceId: i + 1,
            status: "running",
            progress: 0,
            latency: [],
            accuracy: 0,
            turns: 0,
            errors: 0,
            transcript: [],
          })
        }
      })
      setSessions(newSessions)

      const runBatch = (batch: TestSession[], batchIndex: number) => {
        batch.forEach((session, idx) => {
          simulateTest(session.id, batchIndex * 50 + idx * 20)
        })
      }

      for (let i = 0; i < newSessions.length; i += config.concurrency) {
        const batch = newSessions.slice(i, i + config.concurrency)
        setTimeout(
          () => runBatch(batch, Math.floor(i / config.concurrency)),
          Math.floor(i / config.concurrency) * 200
        )
      }
    }
  }, [selectedPersonalities, config, useSimulation, userId, startTestRunMutation])

  const simulateTest = (sessionId: string, delay: number) => {
    const baseDelay = delay
    let progress = 0

    setTimeout(() => {
      const interval = setInterval(() => {
        progress += Math.random() * 12 + 3
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)
        }

        setSessions((prev) => {
          const updated = prev.map((s) => {
            if (s.id !== sessionId) return s

            const newLatency = [...s.latency, Math.floor(Math.random() * 400 + 100)]
            const newTurns = Math.floor(progress / 10)
            const newErrors = Math.floor(Math.random() * 3)
            const newAccuracy = Math.min(99, 70 + Math.random() * 25)

            const transcriptMessages = generateTranscript(newTurns, s.personalityId)

            return {
              ...s,
              progress,
              status: (progress >= 100 ? "completed" : "running") as TestStatus,
              latency: newLatency.slice(-20),
              turns: newTurns,
              errors: newErrors,
              accuracy: newAccuracy,
              transcript: transcriptMessages,
            }
          })

          const allComplete = updated.every((s) => s.status === "completed" || s.status === "failed")
          if (allComplete) {
            setTimeout(() => setIsRunning(false), 100)
          }

          return updated
        })
      }, 150 + Math.random() * 100)
    }, baseDelay)
  }

  const generateTranscript = (turns: number, personalityId: string) => {
    const transcripts: Record<string, { role: "user" | "agent"; content: string }[]> = {
      "assertive-executive": [
        { role: "user", content: "I need this resolved now." },
        { role: "agent", content: "I understand the urgency. Let me help you immediately." },
        { role: "user", content: "Skip the pleasantries. What's the status?" },
        { role: "agent", content: "Your order ships tomorrow, tracking in 2 hours." },
        { role: "user", content: "Fine. What about the refund?" },
        { role: "agent", content: "Processed. 3-5 business days to your account." },
      ],
      "confused-elder": [
        { role: "user", content: "Hello? Is this... the support line?" },
        { role: "agent", content: "Yes, this is customer support. How can I help you today?" },
        { role: "user", content: "I'm sorry, could you repeat that?" },
        { role: "agent", content: "Of course. I'm here to help. What do you need assistance with?" },
        { role: "user", content: "My grandson said something about an account..." },
        { role: "agent", content: "I can help you with your account. Do you have your account number?" },
      ],
      "technical-expert": [
        { role: "user", content: "What's your API rate limit for the v3 endpoint?" },
        { role: "agent", content: "The v3 REST API allows 1000 requests per minute per API key." },
        { role: "user", content: "Does that include websocket connections?" },
        { role: "agent", content: "No, websocket connections have a separate limit of 100 concurrent." },
        { role: "user", content: "What's the payload size limit for batch operations?" },
        { role: "agent", content: "Batch payloads are limited to 10MB with max 500 items per request." },
      ],
      "emotional-customer": [
        { role: "user", content: "I've been waiting for THREE WEEKS!" },
        { role: "agent", content: "I completely understand your frustration. That wait is unacceptable." },
        { role: "user", content: "This is the worst experience I've ever had." },
        { role: "agent", content: "I'm truly sorry. Let me make this right for you personally." },
        { role: "user", content: "I just want this to be over..." },
        { role: "agent", content: "I hear you. I'm prioritizing your case right now." },
      ],
      "multilingual-user": [
        { role: "user", content: "Hi, I need help with mi cuenta, please." },
        { role: "agent", content: "Of course, I can help with your account. What do you need?" },
        { role: "user", content: "The payment, it says rechazado?" },
        { role: "agent", content: "I see the payment was declined. Let me check the reason." },
        { role: "user", content: "Ay, maybe it's the tarjeta expiration?" },
        { role: "agent", content: "Yes, your card expired last month. Would you like to update it?" },
      ],
      "rapid-speaker": [
        { role: "user", content: "Hey quick question about shipping also billing and returns" },
        { role: "agent", content: "I can help with all three. Let's start with shipping." },
        { role: "user", content: "Yeah shipping first also what's the warranty period" },
        { role: "agent", content: "Shipping is 3-5 days. Warranty is 2 years for electronics." },
        { role: "user", content: "Perfect and the return window international orders" },
        { role: "agent", content: "30 days for returns, 45 days for international orders." },
      ],
    }

    const messages = transcripts[personalityId] || transcripts["assertive-executive"] || []
    return messages.slice(0, Math.min(turns, messages.length)).map((m, i) => ({
      ...m,
      timestamp: Date.now() - (messages.length - i) * 2000,
    }))
  }

  const stopTests = useCallback(async () => {
    if (!useSimulation && currentTestRunId && userId) {
      await stopTestRunMutation.mutateAsync({
        testRunId: currentTestRunId,
        userId,
      })
    }

    setIsRunning(false)
    setCurrentTestRunId(null)
    setSessions((prev) =>
      prev.map((s) => ({
        ...s,
        status: s.status === "running" ? "failed" : s.status,
      }))
    )
  }, [useSimulation, currentTestRunId, userId, stopTestRunMutation])

  const togglePersonality = useCallback((id: string) => {
    setSelectedPersonalities((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }, [])

  const selectAll = useCallback(() => {
    setSelectedPersonalities(personalities.map((p) => p.id))
  }, [personalities])

  const aggregatedSessions = selectedPersonalities.map((pId) => {
    const personalitySessions = sessions.filter((s) => s.personalityId === pId)
    const completed = personalitySessions.filter((s) => s.status === "completed").length
    const total = personalitySessions.length
    const avgProgress = total > 0 ? personalitySessions.reduce((sum, s) => sum + s.progress, 0) / total : 0
    const avgAccuracy =
      completed > 0
        ? personalitySessions.filter((s) => s.status === "completed").reduce((sum, s) => sum + s.accuracy, 0) / completed
        : 0
    const allLatencies = personalitySessions.flatMap((s) => s.latency)
    const latestTranscript = personalitySessions.length > 0 ? personalitySessions[personalitySessions.length - 1].transcript : []

    return {
      id: `agg-${pId}`,
      personalityId: pId,
      instanceId: 0,
      status: (completed === total && total > 0 ? "completed" : total > 0 ? "running" : "idle") as TestStatus,
      progress: avgProgress,
      latency: allLatencies.slice(-20),
      accuracy: avgAccuracy,
      turns: Math.max(...personalitySessions.map((s) => s.turns), 0),
      errors: personalitySessions.reduce((sum, s) => sum + s.errors, 0),
      transcript: latestTranscript,
    }
  })

  const totalTests = selectedPersonalities.reduce((sum, id) => sum + (config.testsPerPersonality[id] || 10), 0)

  const completedTests = sessions.filter((s) => s.status === "completed").length

  const tabs = [
    { id: "config", label: "Configuration" },
    { id: "metrics", label: "Metrics" },
    { id: "healing", label: "Self-Healing" },
    { id: "outcomes", label: "Business" },
  ] as const

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-medium tracking-tight text-foreground mb-1">Agent Evaluation</h1>
            <p className="text-muted-foreground text-sm">Large-scale parallel testing with synthetic user personas</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <button
              onClick={() => setUseSimulation(!useSimulation)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                useSimulation ? "bg-yellow-500/20 text-yellow-600" : "bg-green-500/20 text-green-600"
              }`}
            >
              {useSimulation ? "Simulation" : "Live"}
            </button>
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 ${!useSimulation && isConnected ? "bg-chart-2" : "bg-muted"}`} />
              {!useSimulation && isConnected ? "Connected" : useSimulation ? "Simulated" : "Disconnected"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-4">
            <PersonalityGrid
              personalities={personalities}
              selected={selectedPersonalities}
              onToggle={togglePersonality}
              onSelectAll={selectAll}
              disabled={isRunning}
            />

            {selectedPersonalities.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border border-border bg-card">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Total Tests</span>
                    <span className="text-sm font-mono">{totalTests.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Concurrency</span>
                    <span className="text-sm font-mono">{config.concurrency}x</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Est. Cost</span>
                    <span className="text-sm font-mono">${(totalTests * config.businessMetrics.costPerCall).toFixed(2)}</span>
                  </div>
                </div>
                {isRunning && (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-chart-2 animate-pulse" />
                    <span className="text-xs font-mono">
                      {completedTests}/{sessions.length}
                    </span>
                  </div>
                )}
              </div>
            )}

            <TestRunner
              sessions={aggregatedSessions as unknown as TestSession[]}
              personalities={personalities}
              isRunning={isRunning}
              onStart={startTests}
              onStop={stopTests}
              hasSelection={selectedPersonalities.length > 0}
            />
          </div>

          <div className="flex flex-col min-h-0 overflow-hidden">
            <div className="flex border border-border border-b-0 bg-card shrink-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-2 py-2.5 text-xs font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto border border-border border-t-0">
              {activeTab === "config" && (
                <TestConfigPanel
                  personalities={personalities}
                  selected={selectedPersonalities}
                  config={config}
                  onConfigChange={setConfig}
                  disabled={isRunning}
                />
              )}
              {activeTab === "metrics" && <MetricsPanel sessions={sessions} personalities={personalities} />}
              {activeTab === "healing" && (
                <SelfHealingPanel
                  sessions={sessions}
                  personalities={personalities}
                  isRunning={isRunning}
                  onApplySuggestion={(id) => console.log("Applied:", id)}
                />
              )}
              {activeTab === "outcomes" && (
                <BusinessOutcomesPanel sessions={sessions} config={config} personalities={personalities} isRunning={isRunning} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
