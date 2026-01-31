"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import {
  Play,
  Settings2,
  Zap,
  Target,
  Sparkles,
  Plus,
  X,
  FileText,
  ChevronDown,
  ExternalLink,
  RefreshCw,
  Bot,
  Cpu,
  Mic,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PersonalityGrid } from "@/components/personality-grid"
import { usePersonalities } from "@/hooks/use-personalities"
import { usePrompts, useCreatePromptVersion } from "@/hooks/use-prompts"
import { useCreateEvaluation, useStartEvaluation } from "@/hooks/use-evaluations"
import {
  useExternalAgentByPromptId,
  useSyncExternalAgent,
} from "@/hooks/use-external-agents"
import type { Personality } from "@/lib/types"

const TARGET_METRICS = [
  { value: "conversion", label: "Conversion Rate", description: "Optimize for conversion goals" },
  { value: "accuracy", label: "Accuracy", description: "Optimize for response accuracy" },
  { value: "csat", label: "CSAT", description: "Optimize for customer satisfaction" },
  { value: "latency", label: "Latency", description: "Optimize for response speed" },
]

const PREDEFINED_GOALS = [
  { label: "Schedule Demo", value: "Schedule a demo" },
  { label: "Book Meeting", value: "Book a meeting" },
  { label: "Collect Email", value: "Collect email address" },
  { label: "Sign Up", value: "Complete sign up" },
  { label: "Purchase", value: "Complete purchase" },
  { label: "Upgrade Plan", value: "Upgrade subscription" },
  { label: "Get Quote", value: "Request a quote" },
  { label: "Contact Sales", value: "Contact sales team" },
  { label: "Download", value: "Download resource" },
  { label: "Start Trial", value: "Start free trial" },
]

export default function EvaluationPage() {
  const router = useRouter()
  const { user } = useUser()
  const userId = user?.id ?? ""

  // Configuration state
  const [selectedPersonalities, setSelectedPersonalities] = useState<string[]>([])
  const [selectedPromptId, setSelectedPromptId] = useState("")
  const [testsPerPersonality, setTestsPerPersonality] = useState(10)
  const [maxEpochs, setMaxEpochs] = useState(3)
  const [concurrency, setConcurrency] = useState(5)
  const [improvementThreshold, setImprovementThreshold] = useState(2)
  const [targetMetric, setTargetMetric] = useState<"conversion" | "accuracy" | "csat" | "latency">("conversion")
  const [conversionGoals, setConversionGoals] = useState<string[]>([])
  const [newGoal, setNewGoal] = useState("")
  const [isStarting, setIsStarting] = useState(false)
  const [showPromptPreview, setShowPromptPreview] = useState(false)
  const [editedPromptContent, setEditedPromptContent] = useState("")
  const [hasPromptChanges, setHasPromptChanges] = useState(false)

  const { data: backendPersonalities } = usePersonalities(userId)
  const { data: prompts } = usePrompts(userId)
  const createEvaluation = useCreateEvaluation()
  const startEvaluation = useStartEvaluation()
  const createPromptVersion = useCreatePromptVersion()

  // Check if selected prompt is from an external agent
  const { data: externalAgent, isExternalAgent } = useExternalAgentByPromptId(
    userId,
    selectedPromptId
  )
  const syncAgent = useSyncExternalAgent()

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

  // Auto-select first prompt
  const activePrompt = prompts?.find(p => p.id === selectedPromptId) ?? prompts?.[0]

  // Set prompt ID when prompts load
  useEffect(() => {
    if (prompts && prompts.length > 0 && !selectedPromptId) {
      setSelectedPromptId(prompts[0].id)
    }
  }, [prompts, selectedPromptId])

  // Sync edited content with selected prompt
  useEffect(() => {
    if (activePrompt) {
      setEditedPromptContent(activePrompt.content)
      setHasPromptChanges(false)
    }
  }, [activePrompt])

  const handlePromptContentChange = (value: string) => {
    setEditedPromptContent(value)
    setHasPromptChanges(value !== activePrompt?.content)
  }

  const handleSavePromptVersion = async () => {
    if (!activePrompt || !hasPromptChanges || !userId) return

    try {
      const result = await createPromptVersion.mutateAsync({
        userId,
        parentId: activePrompt.id,
        content: editedPromptContent,
      })
      if (result.success && result.promptId) {
        setSelectedPromptId(result.promptId)
        setHasPromptChanges(false)
      }
    } catch (error) {
      console.error("Failed to save prompt version:", error)
    }
  }

  const addGoal = () => {
    if (newGoal.trim() && !conversionGoals.includes(newGoal.trim())) {
      setConversionGoals([...conversionGoals, newGoal.trim()])
      setNewGoal("")
    }
  }

  const removeGoal = (goal: string) => {
    setConversionGoals(conversionGoals.filter((g) => g !== goal))
  }

  const togglePersonality = useCallback((id: string) => {
    setSelectedPersonalities((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }, [])

  const selectAll = useCallback(() => {
    setSelectedPersonalities(personalities.map((p) => p.id))
  }, [personalities])

  const totalTests = selectedPersonalities.length * testsPerPersonality
  const isValid = selectedPersonalities.length > 0 && activePrompt && externalAgent

  const handleStartExperiment = async () => {
    if (!userId || !activePrompt || selectedPersonalities.length === 0) return

    setIsStarting(true)
    try {
      // Create experiment
      const experimentName = `${activePrompt.name} - ${new Date().toLocaleString()}`
      const result = await createEvaluation.mutateAsync({
        userId,
        name: experimentName,
        sourcePromptId: activePrompt.id,
        externalAgentId: externalAgent!.id,
        config: {
          maxEpochs,
          testsPerEpoch: totalTests,
          personalityIds: selectedPersonalities,
          concurrency,
          improvementThreshold,
          targetMetric,
          conversionGoals,
        },
      })

      if (result.success && result.evaluationId) {
        // Start the experiment
        await startEvaluation.mutateAsync({
          evaluationId: result.evaluationId,
          userId,
        })

        // Redirect to experiment detail
        router.push(`/app/evaluations/${result.evaluationId}`)
      }
    } catch (error) {
      console.error("Failed to start experiment:", error)
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-medium tracking-tight mb-1">Agent Evaluation</h1>
          <p className="text-muted-foreground text-sm">
            Configure and run prompt optimization experiments
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Config */}
          <div className="lg:col-span-2 space-y-4">
            {/* Prompt Selection */}
            <Card>
              <CardHeader className="px-4 py-3 border-b border-border flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-medium">Source Prompt</h2>
                </div>
                {isExternalAgent && externalAgent ? (
                  <Link href={`/app/agents/${externalAgent.id}`}>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                      <ExternalLink className="w-3 h-3" />
                      Manage
                    </Button>
                  </Link>
                ) : (
                  <Link href="/app/prompts">
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                      <ExternalLink className="w-3 h-3" />
                      Manage
                    </Button>
                  </Link>
                )}
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Select value={selectedPromptId} onValueChange={(id) => {
                  setSelectedPromptId(id)
                  setShowPromptPreview(false)
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a prompt to optimize" />
                  </SelectTrigger>
                  <SelectContent>
                    {prompts?.map((prompt) => (
                      <SelectItem key={prompt.id} value={prompt.id}>
                        {prompt.name} (v{prompt.version})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* External Agent Info */}
                {isExternalAgent && externalAgent && (
                  <div className="space-y-3 pt-3 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Dapta Agent</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          syncAgent.mutate({ agentId: externalAgent.id, userId })
                        }
                        disabled={syncAgent.isPending}
                        className="h-7 gap-1 text-xs"
                      >
                        <RefreshCw
                          className={`h-3 w-3 ${syncAgent.isPending ? "animate-spin" : ""}`}
                        />
                        Sync
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {externalAgent.llmModel && (
                        <div className="flex items-center gap-1.5">
                          <Cpu className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Model:</span>
                          <span className="font-mono">{externalAgent.llmModel}</span>
                        </div>
                      )}
                      {externalAgent.voiceId && (
                        <div className="flex items-center gap-1.5">
                          <Mic className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Voice:</span>
                          <span className="font-mono truncate max-w-[100px]">
                            {externalAgent.voiceId.slice(0, 15)}...
                          </span>
                        </div>
                      )}
                    </div>

                    {externalAgent.lastSyncedAt && (
                      <p className="text-xs text-muted-foreground">
                        Last synced:{" "}
                        {new Date(externalAgent.lastSyncedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Prompt Preview & Editor */}
                {activePrompt && (
                  <Collapsible open={showPromptPreview} onOpenChange={setShowPromptPreview}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between h-8 text-xs text-muted-foreground"
                      >
                        <span className="flex items-center gap-1.5">
                          {showPromptPreview ? "Hide" : "Preview"} prompt content
                          {hasPromptChanges && (
                            <Badge variant="outline" className="text-chart-3 border-chart-3/30 text-[10px] px-1">
                              Unsaved
                            </Badge>
                          )}
                        </span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${showPromptPreview ? "rotate-180" : ""}`} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3">
                      <div className="space-y-3">
                        <Textarea
                          value={editedPromptContent}
                          onChange={(e) => handlePromptContentChange(e.target.value)}
                          className="min-h-[200px] font-mono text-xs"
                          placeholder="Enter your prompt..."
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">
                            {editedPromptContent.length} chars · v{activePrompt.version}
                          </span>
                          <div className="flex items-center gap-2">
                            {hasPromptChanges && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => {
                                  setEditedPromptContent(activePrompt.content)
                                  setHasPromptChanges(false)
                                }}
                              >
                                Revert
                              </Button>
                            )}
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              disabled={!hasPromptChanges || createPromptVersion.isPending}
                              onClick={handleSavePromptVersion}
                            >
                              {createPromptVersion.isPending ? "Saving..." : "Save as New Version"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </CardContent>
            </Card>

            {/* Personality Selection */}
            <PersonalityGrid
              personalities={personalities}
              selected={selectedPersonalities}
              onToggle={togglePersonality}
              onSelectAll={selectAll}
              disabled={isStarting}
            />

            {/* Target Metric */}
            <Card>
              <CardHeader className="px-4 py-3 border-b border-border flex flex-row items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-medium">Target Metric</h2>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  {TARGET_METRICS.map((metric) => (
                    <button
                      key={metric.value}
                      onClick={() => setTargetMetric(metric.value as typeof targetMetric)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        targetMetric === metric.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <span className="text-sm font-medium block">{metric.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {metric.description}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Conversion Goals */}
            {targetMetric === "conversion" && (
              <Card>
                <CardHeader className="px-4 py-3 border-b border-border flex flex-row items-center gap-2">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-medium">Conversion Goals</h2>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {/* Predefined Goals */}
                  <div>
                    <div className="text-xs text-muted-foreground mb-2">Quick select</div>
                    <div className="flex flex-wrap gap-2">
                      {PREDEFINED_GOALS.map((goal) => {
                        const isSelected = conversionGoals.includes(goal.value)
                        return (
                          <button
                            key={goal.value}
                            onClick={() => {
                              if (isSelected) {
                                removeGoal(goal.value)
                              } else {
                                setConversionGoals([...conversionGoals, goal.value])
                              }
                            }}
                            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border hover:border-primary/50 hover:bg-secondary/50"
                            }`}
                          >
                            {goal.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Custom Goal Input */}
                  <div>
                    <div className="text-xs text-muted-foreground mb-2">Or add custom</div>
                    <div className="flex gap-2">
                      <Input
                        value={newGoal}
                        onChange={(e) => setNewGoal(e.target.value)}
                        placeholder="Enter custom goal..."
                        onKeyDown={(e) => e.key === "Enter" && addGoal()}
                        className="text-sm"
                      />
                      <Button onClick={addGoal} size="sm" variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Selected Goals Summary */}
                  {conversionGoals.length > 0 && (
                    <div className="pt-3 border-t border-border">
                      <div className="text-xs text-muted-foreground mb-2">
                        Selected ({conversionGoals.length})
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {conversionGoals.map((goal) => (
                          <Badge key={goal} variant="secondary" className="gap-1 pr-1">
                            {goal}
                            <button
                              onClick={() => removeGoal(goal)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Settings */}
          <div className="space-y-4">
            {/* Experiment Settings */}
            <Card>
              <CardHeader className="px-4 py-3 border-b border-border flex flex-row items-center gap-2">
                <Settings2 className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-medium">Experiment Settings</h2>
              </CardHeader>
              <CardContent className="p-4 space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">Tests per Persona</label>
                    <span className="text-sm text-muted-foreground">{testsPerPersonality}</span>
                  </div>
                  <Slider
                    value={[testsPerPersonality]}
                    onValueChange={([v]) => setTestsPerPersonality(v)}
                    min={1}
                    max={50}
                    step={1}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">Max Epochs</label>
                    <span className="text-sm text-muted-foreground">{maxEpochs}</span>
                  </div>
                  <Slider
                    value={[maxEpochs]}
                    onValueChange={([v]) => setMaxEpochs(v)}
                    min={1}
                    max={10}
                    step={1}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Optimization iterations
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">Concurrency</label>
                    <span className="text-sm text-muted-foreground">{concurrency}x</span>
                  </div>
                  <Slider
                    value={[concurrency]}
                    onValueChange={([v]) => setConcurrency(v)}
                    min={1}
                    max={20}
                    step={1}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">Improvement Threshold</label>
                    <span className="text-sm text-muted-foreground">{improvementThreshold}%</span>
                  </div>
                  <Slider
                    value={[improvementThreshold]}
                    onValueChange={([v]) => setImprovementThreshold(v)}
                    min={0.5}
                    max={10}
                    step={0.5}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Min improvement to accept new version
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Summary & Run */}
            <Card>
              <CardHeader className="px-4 py-3 border-b border-border flex flex-row items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-medium">Summary</h2>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Personas</span>
                    <span className="font-mono">{selectedPersonalities.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tests per Epoch</span>
                    <span className="font-mono">{totalTests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Epochs</span>
                    <span className="font-mono">{maxEpochs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Tests (max)</span>
                    <span className="font-mono">{totalTests * maxEpochs}</span>
                  </div>
                </div>

                <Button
                  onClick={handleStartExperiment}
                  disabled={!isValid || isStarting}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Play className="h-4 w-4" />
                  {isStarting ? "Starting..." : "Run Experiment"}
                </Button>

                {!isValid && selectedPersonalities.length === 0 && (
                  <p className="text-xs text-center text-muted-foreground">
                    Select at least one persona to continue
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
