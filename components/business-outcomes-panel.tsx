"use client"

import type { TestSession, Personality } from "@/app/page"
import type { TestConfig } from "@/components/test-config-panel"
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  DollarSign,
  Users,
  CheckCircle,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface BusinessOutcomesPanelProps {
  sessions: TestSession[]
  config: TestConfig
  personalities: Personality[]
  isRunning: boolean
}

export function BusinessOutcomesPanel({
  sessions,
  config,
  personalities,
  isRunning,
}: BusinessOutcomesPanelProps) {
  const completedSessions = sessions.filter((s) => s.status === "completed")
  const totalTests = completedSessions.length

  const calculateMetrics = () => {
    if (totalTests === 0) {
      return {
        resolutionRate: 0,
        avgHandleTime: 0,
        csat: 0,
        escalationRate: 0,
        actualCost: 0,
        containmentRate: 0,
        firstContactResolution: 0,
        avgLatency: 0,
      }
    }

    const avgAccuracy = completedSessions.reduce((sum, s) => sum + s.accuracy, 0) / totalTests
    const avgLatency =
      completedSessions.reduce(
        (sum, s) =>
          sum + (s.latency.length > 0 ? s.latency.reduce((a, b) => a + b, 0) / s.latency.length : 0),
        0
      ) / totalTests
    const totalErrors = completedSessions.reduce((sum, s) => sum + s.errors, 0)
    const avgTurns = completedSessions.reduce((sum, s) => sum + s.turns, 0) / totalTests

    return {
      resolutionRate: Math.min(100, avgAccuracy * 0.95 + Math.random() * 5),
      avgHandleTime: Math.round(avgTurns * 12 + avgLatency / 50),
      csat: Math.min(5, 3 + (avgAccuracy / 100) * 1.8 + (Math.random() * 0.4 - 0.2)),
      escalationRate: Math.max(0, 15 - avgAccuracy / 10 + totalErrors * 2),
      actualCost: totalTests * config.businessMetrics.costPerCall * (1 + avgTurns / 20),
      containmentRate: Math.min(100, avgAccuracy - totalErrors * 3),
      firstContactResolution: Math.min(100, avgAccuracy * 0.85 + Math.random() * 10),
      avgLatency,
    }
  }

  const metrics = calculateMetrics()

  const getStatus = (actual: number, target: number, higherIsBetter: boolean) => {
    const diff = higherIsBetter ? actual - target : target - actual
    const threshold = target * 0.1

    if (diff >= 0) return "success"
    if (diff > -threshold) return "warning"
    return "danger"
  }

  const getTrendIcon = (status: string, higherIsBetter: boolean) => {
    if (status === "success") return higherIsBetter ? ArrowUp : ArrowDown
    if (status === "danger") return higherIsBetter ? ArrowDown : ArrowUp
    return Minus
  }

  const metricCards = [
    {
      label: "Resolution Rate",
      actual: metrics.resolutionRate,
      target: config.businessMetrics.resolutionTarget,
      unit: "%",
      icon: Target,
      higherIsBetter: true,
      format: (v: number) => v.toFixed(1),
    },
    {
      label: "Avg Handle Time",
      actual: metrics.avgHandleTime,
      target: config.businessMetrics.avgHandleTimeTarget,
      unit: "sec",
      icon: Clock,
      higherIsBetter: false,
      format: (v: number) => v.toFixed(0),
    },
    {
      label: "CSAT Score",
      actual: metrics.csat,
      target: config.businessMetrics.csatTarget,
      unit: "/5",
      icon: TrendingUp,
      higherIsBetter: true,
      format: (v: number) => v.toFixed(2),
    },
    {
      label: "Escalation Rate",
      actual: metrics.escalationRate,
      target: config.businessMetrics.escalationRateTarget,
      unit: "%",
      icon: Users,
      higherIsBetter: false,
      format: (v: number) => v.toFixed(1),
    },
  ]

  const additionalMetrics = [
    {
      label: "First Contact Resolution",
      value: metrics.firstContactResolution,
      unit: "%",
      format: (v: number) => v.toFixed(1),
    },
    {
      label: "Containment Rate",
      value: metrics.containmentRate,
      unit: "%",
      format: (v: number) => v.toFixed(1),
    },
    {
      label: "Avg Response Latency",
      value: metrics.avgLatency,
      unit: "ms",
      format: (v: number) => v.toFixed(0),
    },
    {
      label: "Est. Total Cost",
      value: metrics.actualCost,
      unit: "",
      format: (v: number) => `$${v.toFixed(2)}`,
    },
  ]

  const baselineCostPerCall = 5.5
  const projectedSavings =
    totalTests > 0 ? (baselineCostPerCall - config.businessMetrics.costPerCall) * totalTests * 12 : 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-border space-y-0">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Business Outcomes</span>
        </div>
        {totalTests > 0 && (
          <Badge variant="outline" className="gap-1.5">
            <div
              className={cn(
                "h-2 w-2",
                metricCards.filter(
                  (m) => getStatus(m.actual, m.target, m.higherIsBetter) === "success"
                ).length >= 3
                  ? "bg-chart-2"
                  : metricCards.filter(
                        (m) => getStatus(m.actual, m.target, m.higherIsBetter) === "danger"
                      ).length >= 2
                    ? "bg-destructive"
                    : "bg-chart-5"
              )}
            />
            <span className="text-xs">
              {
                metricCards.filter(
                  (m) => getStatus(m.actual, m.target, m.higherIsBetter) === "success"
                ).length
              }
              /4 targets met
            </span>
          </Badge>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {totalTests === 0 ? (
          <div className="p-8 text-center">
            <TrendingUp className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
            <div className="text-muted-foreground text-sm">
              {isRunning ? "Calculating outcomes..." : "Run tests to see business impact"}
            </div>
          </div>
        ) : (
          <>
            {/* Main KPI Cards */}
            <div className="grid grid-cols-2 gap-px bg-border">
              {metricCards.map((metric) => {
                const status = getStatus(metric.actual, metric.target, metric.higherIsBetter)
                const TrendIcon = getTrendIcon(status, metric.higherIsBetter)
                const Icon = metric.icon

                return (
                  <div key={metric.label} className="bg-card p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Icon className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {metric.label}
                      </span>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="text-2xl font-light font-mono">
                          {metric.format(metric.actual)}
                        </span>
                        <span className="text-sm text-muted-foreground ml-1">{metric.unit}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "gap-1 text-xs",
                          status === "success" && "text-chart-2 border-chart-2/30",
                          status === "warning" && "text-chart-5 border-chart-5/30",
                          status === "danger" && "text-destructive border-destructive/30"
                        )}
                      >
                        <TrendIcon className="h-3 w-3" />
                        <span className="font-mono">
                          {metric.higherIsBetter
                            ? metric.actual >= metric.target
                              ? "+"
                              : ""
                            : metric.actual <= metric.target
                              ? ""
                              : "+"}
                          {(metric.actual - metric.target).toFixed(1)}
                        </span>
                      </Badge>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                        <span>vs target: {metric.format(metric.target)}</span>
                        {status === "success" && <CheckCircle className="h-3 w-3 text-chart-2" />}
                        {status === "warning" && <AlertTriangle className="h-3 w-3 text-chart-5" />}
                        {status === "danger" && <AlertTriangle className="h-3 w-3 text-destructive" />}
                      </div>
                      <Progress 
                        value={Math.min(100, (metric.actual / metric.target) * 100)} 
                        className={cn(
                          "h-1",
                          status === "success" && "[&>div]:bg-chart-2",
                          status === "warning" && "[&>div]:bg-chart-5",
                          status === "danger" && "[&>div]:bg-destructive"
                        )}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Additional Metrics */}
            <div className="p-4 border-t border-border">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Additional Metrics
              </span>
              <div className="grid grid-cols-2 gap-3 mt-3">
                {additionalMetrics.map((metric) => (
                  <div key={metric.label} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{metric.label}</span>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {metric.format(metric.value)}
                      {metric.unit}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* ROI Summary */}
            <Card className="m-4 p-4 bg-secondary/30 border-0">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-3 w-3 text-chart-2" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Projected Annual Impact
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-lg font-light font-mono text-chart-2">
                    ${(projectedSavings / 1000).toFixed(0)}k
                  </div>
                  <div className="text-[10px] text-muted-foreground">Cost Savings</div>
                </div>
                <div>
                  <div className="text-lg font-light font-mono">
                    {((metrics.resolutionRate / 100) * totalTests * 12).toFixed(0)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Resolved Calls/yr</div>
                </div>
                <div>
                  <div className="text-lg font-light font-mono">
                    {Math.round((1 - metrics.escalationRate / 100) * 100)}%
                  </div>
                  <div className="text-[10px] text-muted-foreground">Automation Rate</div>
                </div>
              </div>
            </Card>

            {/* Per-Personality Performance */}
            <div className="p-4 border-t border-border">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Performance by Persona
              </span>
              <div className="mt-3 space-y-2">
                {completedSessions.map((session) => {
                  const personality = personalities.find((p) => p.id === session.personalityId)
                  if (!personality) return null

                  const score =
                    session.accuracy * 0.4 +
                    (100 - session.errors * 10) * 0.3 +
                    Math.min(100, 100 - (session.latency.reduce((a, b) => a + b, 0) / session.latency.length - 200) / 5) * 0.3

                  return (
                    <div key={session.id} className="flex items-center gap-3">
                      <div
                        className="h-2 w-2 shrink-0"
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
                      <span className="text-xs flex-1 truncate">{personality.name}</span>
                      <Progress
                        value={score}
                        className={cn(
                          "w-24 h-1",
                          score >= 80 ? "[&>div]:bg-chart-2" : score >= 60 ? "[&>div]:bg-chart-5" : "[&>div]:bg-destructive"
                        )}
                      />
                      <Badge variant="outline" className="font-mono text-xs w-12 justify-center">
                        {score.toFixed(0)}%
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
