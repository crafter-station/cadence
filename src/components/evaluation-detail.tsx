"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import {
  ArrowLeft,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  FileText,
  BarChart3,
  GitCompare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  useEvaluation,
  useStartEvaluation,
  usePauseEvaluation,
} from "@/hooks/use-evaluations"
import { EvaluationMetricsChart } from "@/components/evaluation-metrics-chart"

const STATUS_CONFIG = {
  pending: { icon: Clock, color: "text-muted-foreground", bg: "bg-muted/50" },
  running: { icon: Play, color: "text-chart-2", bg: "bg-chart-2/10" },
  paused: { icon: Pause, color: "text-chart-5", bg: "bg-chart-5/10" },
  completed: { icon: CheckCircle, color: "text-chart-1", bg: "bg-chart-1/10" },
  failed: { icon: XCircle, color: "text-chart-3", bg: "bg-chart-3/10" },
}

interface EvaluationDetailProps {
  evaluationId: string
}

export function EvaluationDetail({ evaluationId }: EvaluationDetailProps) {
  const router = useRouter()
  const { user } = useUser()
  const { data: evaluation, isLoading } = useEvaluation(evaluationId)
  const startEvaluation = useStartEvaluation()
  const pauseEvaluation = usePauseEvaluation()
  const [activeTab, setActiveTab] = useState<"epochs" | "metrics" | "prompts">("epochs")

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Loading evaluation...
      </div>
    )
  }

  if (!evaluation) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Evaluation not found
      </div>
    )
  }

  const status = STATUS_CONFIG[evaluation.status]
  const StatusIcon = status.icon
  const config = evaluation.config
  const epochs = (evaluation as any).epochs ?? []
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

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <Link href="/app/evaluations">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold">{evaluation.name}</h1>
                <Badge
                  variant="secondary"
                  className={`${status.bg} ${status.color} border-0`}
                >
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {evaluation.status}
                </Badge>
              </div>
              {evaluation.description && (
                <p className="text-sm text-muted-foreground">
                  {evaluation.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(evaluation.status === "pending" || evaluation.status === "paused") && (
              <Button onClick={handleStart} className="gap-2">
                <Play className="h-4 w-4" />
                {evaluation.status === "paused" ? "Resume" : "Start"}
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

        {/* Progress */}
        <div className="flex items-center gap-4">
          <Progress value={progress} className="flex-1 h-2" />
          <span className="text-sm text-muted-foreground font-mono">
            Epoch {evaluation.currentEpochNumber}/{config?.maxEpochs ?? "?"}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="border-b border-border px-6 py-4">
        <div className="grid grid-cols-5 gap-4">
          <Card className="border-none shadow-none bg-secondary/30">
            <CardContent className="p-3">
              <span className="text-xs text-muted-foreground block mb-0.5">
                Target Metric
              </span>
              <span className="text-sm font-medium capitalize">
                {config?.targetMetric ?? "accuracy"}
              </span>
            </CardContent>
          </Card>
          <Card className="border-none shadow-none bg-secondary/30">
            <CardContent className="p-3">
              <span className="text-xs text-muted-foreground block mb-0.5">
                Best Accuracy
              </span>
              <span className="text-sm font-medium">
                {evaluation.bestAccuracy?.toFixed(1) ?? "—"}%
              </span>
            </CardContent>
          </Card>
          <Card className="border-none shadow-none bg-secondary/30">
            <CardContent className="p-3">
              <span className="text-xs text-muted-foreground block mb-0.5">
                Best Conversion
              </span>
              <span className="text-sm font-medium">
                {evaluation.bestConversionRate?.toFixed(1) ?? "—"}%
              </span>
            </CardContent>
          </Card>
          <Card className="border-none shadow-none bg-chart-2/10">
            <CardContent className="p-3">
              <span className="text-xs text-chart-2 block mb-0.5">
                Total Improvement
              </span>
              <span className="text-sm font-medium text-chart-2">
                {evaluation.totalImprovement != null
                  ? `+${evaluation.totalImprovement.toFixed(1)}%`
                  : "—"}
              </span>
            </CardContent>
          </Card>
          <Card className="border-none shadow-none bg-secondary/30">
            <CardContent className="p-3">
              <span className="text-xs text-muted-foreground block mb-0.5">
                Tests/Epoch
              </span>
              <span className="text-sm font-medium">
                {config?.testsPerEpoch ?? "—"}
              </span>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border px-6">
        <div className="flex gap-1">
          {[
            { id: "epochs", label: "Epochs", icon: Clock },
            { id: "metrics", label: "Metrics", icon: BarChart3 },
            { id: "prompts", label: "Prompt Versions", icon: GitCompare },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {activeTab === "epochs" && (
            <EpochList epochs={epochs} evaluationId={evaluationId} />
          )}
          {activeTab === "metrics" && <EvaluationMetricsChart epochs={epochs} />}
          {activeTab === "prompts" && <PromptVersions epochs={epochs} />}
        </div>
      </ScrollArea>
    </div>
  )
}

function EpochList({
  epochs,
  evaluationId,
}: {
  epochs: any[]
  evaluationId: string
}) {
  if (epochs.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>No epochs yet.</p>
        <p className="text-sm mt-1">Start the evaluation to begin optimization.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {epochs.map((epoch: any) => (
        <Link
          key={epoch.id}
          href={`/app/evaluations/${evaluationId}?epoch=${epoch.id}`}
        >
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      Epoch {epoch.epochNumber}
                    </Badge>
                    <Badge
                      variant={
                        epoch.status === "completed"
                          ? "secondary"
                          : epoch.status === "running"
                            ? "default"
                            : "outline"
                      }
                      className={
                        epoch.status === "completed"
                          ? "bg-chart-1/10 text-chart-1 border-0"
                          : epoch.status === "running"
                            ? "bg-chart-2/10 text-chart-2 border-0"
                            : ""
                      }
                    >
                      {epoch.status}
                    </Badge>
                    {epoch.isAccepted && (
                      <Badge className="bg-chart-2/10 text-chart-2 border-0">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Accepted
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground block">
                      Accuracy
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium">
                        {epoch.accuracy?.toFixed(1) ?? "—"}%
                      </span>
                      {epoch.accuracyDelta != null && epoch.accuracyDelta !== 0 && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            epoch.accuracyDelta > 0
                              ? "text-chart-2 border-chart-2/30"
                              : "text-chart-3 border-chart-3/30"
                          }`}
                        >
                          {epoch.accuracyDelta > 0 ? (
                            <TrendingUp className="h-3 w-3 mr-0.5" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-0.5" />
                          )}
                          {Math.abs(epoch.accuracyDelta).toFixed(1)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground block">
                      Conversion
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium">
                        {epoch.conversionRate?.toFixed(1) ?? "—"}%
                      </span>
                      {epoch.conversionDelta != null && epoch.conversionDelta !== 0 && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            epoch.conversionDelta > 0
                              ? "text-chart-2 border-chart-2/30"
                              : "text-chart-3 border-chart-3/30"
                          }`}
                        >
                          {epoch.conversionDelta > 0 ? (
                            <TrendingUp className="h-3 w-3 mr-0.5" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-0.5" />
                          )}
                          {Math.abs(epoch.conversionDelta).toFixed(1)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              {epoch.improvementApplied?.changes?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground block mb-1.5">
                    Changes Applied
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {epoch.improvementApplied.changes.slice(0, 3).map(
                      (change: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {change.slice(0, 50)}
                          {change.length > 50 ? "..." : ""}
                        </Badge>
                      )
                    )}
                    {epoch.improvementApplied.changes.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{epoch.improvementApplied.changes.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

function PromptVersions({ epochs }: { epochs: any[] }) {
  const completedEpochs = epochs.filter((e) => e.status === "completed")

  if (completedEpochs.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>No prompt versions yet.</p>
        <p className="text-sm mt-1">
          Prompt versions are created after each epoch completes.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {completedEpochs.map((epoch: any, index: number) => (
        <Card key={epoch.id}>
          <CardHeader className="px-4 py-3 border-b border-border flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                v{epoch.prompt?.version ?? index + 1}
              </span>
              <Badge variant="outline" className="text-xs font-mono">
                Epoch {epoch.epochNumber}
              </Badge>
              {epoch.isAccepted && (
                <Badge className="bg-chart-2/10 text-chart-2 border-0 text-xs">
                  Best Version
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                Accuracy: <strong>{epoch.accuracy?.toFixed(1) ?? "—"}%</strong>
              </span>
              <span className="text-muted-foreground">
                Conversion:{" "}
                <strong>{epoch.conversionRate?.toFixed(1) ?? "—"}%</strong>
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {epoch.improvementApplied?.reasoning && (
              <div className="mb-4">
                <span className="text-xs text-muted-foreground block mb-1">
                  Reasoning
                </span>
                <p className="text-sm">{epoch.improvementApplied.reasoning}</p>
              </div>
            )}
            {epoch.improvementApplied?.changes?.length > 0 && (
              <div>
                <span className="text-xs text-muted-foreground block mb-1.5">
                  Changes
                </span>
                <ul className="list-disc list-inside space-y-1">
                  {epoch.improvementApplied.changes.map(
                    (change: string, i: number) => (
                      <li key={i} className="text-sm">
                        {change}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
