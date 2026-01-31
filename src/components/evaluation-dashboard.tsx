"use client"

import { useState } from "react"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import {
  Plus,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Target,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useEvaluations } from "@/hooks/use-evaluations"
import type { EvaluationSelect } from "@/db/schema"

const STATUS_CONFIG = {
  pending: { icon: Clock, color: "text-muted-foreground", bg: "bg-muted/50" },
  running: { icon: Play, color: "text-chart-2", bg: "bg-chart-2/10" },
  paused: { icon: Pause, color: "text-chart-5", bg: "bg-chart-5/10" },
  completed: { icon: CheckCircle, color: "text-chart-1", bg: "bg-chart-1/10" },
  failed: { icon: XCircle, color: "text-chart-3", bg: "bg-chart-3/10" },
}

export function EvaluationDashboard() {
  const { user } = useUser()
  const { data: evaluations, isLoading } = useEvaluations(user?.id ?? "")

  const stats = {
    total: evaluations?.length ?? 0,
    running: evaluations?.filter((e) => e.status === "running").length ?? 0,
    completed: evaluations?.filter((e) => e.status === "completed").length ?? 0,
    avgImprovement:
      evaluations && evaluations.length > 0
        ? evaluations
            .filter((e) => e.totalImprovement != null)
            .reduce((sum, e) => sum + (e.totalImprovement ?? 0), 0) /
          (evaluations.filter((e) => e.totalImprovement != null).length || 1)
        : 0,
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Experiments</h1>
          <p className="text-sm text-muted-foreground">
            Automated epoch-based prompt optimization
          </p>
        </div>
        <Link href="/app/evaluations/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Experiment
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="border-b border-border px-6 py-4">
        <div className="grid grid-cols-4 gap-4">
          <Card className="border-none shadow-none bg-secondary/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Target className="h-4 w-4" />
                <span className="text-xs">Total Experiments</span>
              </div>
              <span className="text-2xl font-semibold">{stats.total}</span>
            </CardContent>
          </Card>
          <Card className="border-none shadow-none bg-chart-2/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-chart-2 mb-1">
                <Play className="h-4 w-4" />
                <span className="text-xs">Running</span>
              </div>
              <span className="text-2xl font-semibold">{stats.running}</span>
            </CardContent>
          </Card>
          <Card className="border-none shadow-none bg-chart-1/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-chart-1 mb-1">
                <CheckCircle className="h-4 w-4" />
                <span className="text-xs">Completed</span>
              </div>
              <span className="text-2xl font-semibold">{stats.completed}</span>
            </CardContent>
          </Card>
          <Card className="border-none shadow-none bg-chart-2/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-chart-2 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">Avg Improvement</span>
              </div>
              <span className="text-2xl font-semibold">
                {stats.avgImprovement > 0 ? "+" : ""}
                {stats.avgImprovement.toFixed(1)}%
              </span>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-3">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-8">
              Loading evaluations...
            </div>
          ) : evaluations && evaluations.length > 0 ? (
            evaluations.map((evaluation) => (
              <EvaluationCard key={evaluation.id} evaluation={evaluation} />
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p>No experiments yet.</p>
              <p className="text-sm mt-1">
                Create your first experiment to start optimizing prompts.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function EvaluationCard({ evaluation }: { evaluation: EvaluationSelect }) {
  const status = STATUS_CONFIG[evaluation.status]
  const StatusIcon = status.icon
  const config = evaluation.config

  return (
    <Link href={`/app/evaluations/${evaluation.id}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
        <CardHeader className="px-4 py-3 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${status.bg}`}>
              <StatusIcon className={`h-4 w-4 ${status.color}`} />
            </div>
            <div>
              <h3 className="font-medium">{evaluation.name}</h3>
              {evaluation.description && (
                <p className="text-xs text-muted-foreground">
                  {evaluation.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="font-mono text-xs">
              Epoch {evaluation.currentEpochNumber}/{config?.maxEpochs ?? "?"}
            </Badge>
            <Badge
              variant="secondary"
              className={`${status.bg} ${status.color} border-0`}
            >
              {evaluation.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <span className="text-xs text-muted-foreground block">
                Target Metric
              </span>
              <span className="text-sm font-medium capitalize">
                {config?.targetMetric ?? "accuracy"}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">
                Best Accuracy
              </span>
              <span className="text-sm font-medium">
                {evaluation.bestAccuracy?.toFixed(1) ?? "—"}%
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">
                Best Conversion
              </span>
              <span className="text-sm font-medium">
                {evaluation.bestConversionRate?.toFixed(1) ?? "—"}%
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">
                Total Improvement
              </span>
              <span className="text-sm font-medium text-chart-2">
                {evaluation.totalImprovement != null
                  ? `+${evaluation.totalImprovement.toFixed(1)}%`
                  : "—"}
              </span>
            </div>
          </div>
          {config?.conversionGoals && config.conversionGoals.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground block mb-1.5">
                Conversion Goals
              </span>
              <div className="flex flex-wrap gap-1.5">
                {config.conversionGoals.slice(0, 3).map((goal, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {goal}
                  </Badge>
                ))}
                {config.conversionGoals.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{config.conversionGoals.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
