"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import {
  ArrowLeft,
  Target,
  Users,
  Zap,
  Plus,
  X,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usePrompts } from "@/hooks/use-prompts"
import { usePersonalities } from "@/hooks/use-personalities"
import { useCreateEvaluation } from "@/hooks/use-evaluations"

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

export function EvaluationCreator() {
  const router = useRouter()
  const { user } = useUser()
  const { data: prompts } = usePrompts(user?.id ?? "")
  const { data: personalities } = usePersonalities(user?.id ?? "")
  const createEvaluation = useCreateEvaluation()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [sourcePromptId, setSourcePromptId] = useState("")
  const [selectedPersonalities, setSelectedPersonalities] = useState<string[]>([])
  const [targetMetric, setTargetMetric] = useState<"conversion" | "accuracy" | "csat" | "latency">("conversion")
  const [maxEpochs, setMaxEpochs] = useState(5)
  const [testsPerEpoch, setTestsPerEpoch] = useState(20)
  const [concurrency, setConcurrency] = useState(5)
  const [improvementThreshold, setImprovementThreshold] = useState(2)
  const [conversionGoals, setConversionGoals] = useState<string[]>([])
  const [newGoal, setNewGoal] = useState("")

  const addGoal = () => {
    if (newGoal.trim() && !conversionGoals.includes(newGoal.trim())) {
      setConversionGoals([...conversionGoals, newGoal.trim()])
      setNewGoal("")
    }
  }

  const removeGoal = (goal: string) => {
    setConversionGoals(conversionGoals.filter((g) => g !== goal))
  }

  const togglePersonality = (id: string) => {
    setSelectedPersonalities((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    if (!user?.id || !name || !sourcePromptId || selectedPersonalities.length === 0) {
      return
    }

    const result = await createEvaluation.mutateAsync({
      userId: user.id,
      name,
      description: description || undefined,
      sourcePromptId,
      config: {
        maxEpochs,
        testsPerEpoch,
        personalityIds: selectedPersonalities,
        concurrency,
        improvementThreshold,
        targetMetric,
        conversionGoals,
      },
    })

    if (result.success && result.evaluationId) {
      router.push(`/app/evaluations/${result.evaluationId}`)
    }
  }

  const isValid = name && sourcePromptId && selectedPersonalities.length > 0

  return (
    <div className="h-full overflow-auto bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 flex items-center gap-4">
        <Link href="/app/evaluations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-lg font-semibold">Create Experiment</h1>
          <p className="text-sm text-muted-foreground">
            Configure an epoch-based prompt optimization
          </p>
        </div>
      </div>

      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-medium">Basic Information</h2>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Q1 Conversion Optimization"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                Description (optional)
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are you optimizing for?"
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                Source Prompt
              </label>
              <Select value={sourcePromptId} onValueChange={setSourcePromptId}>
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
            </div>
          </CardContent>
        </Card>

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

        {/* Personalities */}
        <Card>
          <CardHeader className="px-4 py-3 border-b border-border flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium">Test Personalities</h2>
            </div>
            <Badge variant="outline" className="text-xs">
              {selectedPersonalities.length} selected
            </Badge>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-2">
              {personalities?.map((personality) => (
                <button
                  key={personality.id}
                  onClick={() => togglePersonality(personality.id)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    selectedPersonalities.includes(personality.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor:
                          personality.color === "chart-1"
                            ? "oklch(0.65 0.15 250)"
                            : personality.color === "chart-2"
                              ? "oklch(0.7 0.18 150)"
                              : personality.color === "chart-3"
                                ? "oklch(0.65 0.2 30)"
                                : personality.color === "chart-4"
                                  ? "oklch(0.7 0.15 330)"
                                  : "oklch(0.75 0.12 80)",
                      }}
                    />
                    <span className="text-sm font-medium">{personality.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {personality.description}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card>
          <CardHeader className="px-4 py-3 border-b border-border flex flex-row items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium">Epoch Configuration</h2>
          </CardHeader>
          <CardContent className="p-4 space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Max Epochs</label>
                <span className="text-sm text-muted-foreground">{maxEpochs}</span>
              </div>
              <Slider
                value={[maxEpochs]}
                onValueChange={([v]) => setMaxEpochs(v)}
                min={1}
                max={20}
                step={1}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maximum iterations for optimization
              </p>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Tests per Epoch</label>
                <span className="text-sm text-muted-foreground">{testsPerEpoch}</span>
              </div>
              <Slider
                value={[testsPerEpoch]}
                onValueChange={([v]) => setTestsPerEpoch(v)}
                min={5}
                max={100}
                step={5}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Total test sessions per epoch (distributed across personalities)
              </p>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Concurrency</label>
                <span className="text-sm text-muted-foreground">{concurrency}</span>
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
                <label className="text-sm font-medium">
                  Improvement Threshold (%)
                </label>
                <span className="text-sm text-muted-foreground">
                  {improvementThreshold}%
                </span>
              </div>
              <Slider
                value={[improvementThreshold]}
                onValueChange={([v]) => setImprovementThreshold(v)}
                min={0.5}
                max={10}
                step={0.5}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum improvement required to accept a new prompt version
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-6">
          <Link href="/app/evaluations">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || createEvaluation.isPending}
          >
            {createEvaluation.isPending ? "Creating..." : "Create Experiment"}
          </Button>
        </div>
      </div>
    </div>
  )
}
