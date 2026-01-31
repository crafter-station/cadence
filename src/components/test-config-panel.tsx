"use client"

import type { Personality } from "@/app/page"
import { Settings, TrendingUp, DollarSign, Clock, Target, Users, Zap } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export interface TestConfig {
  testsPerPersonality: Record<string, number>
  concurrency: number
  businessMetrics: {
    resolutionTarget: number
    avgHandleTimeTarget: number
    csatTarget: number
    escalationRateTarget: number
    costPerCall: number
  }
}

interface TestConfigPanelProps {
  personalities: Personality[]
  selected: string[]
  config: TestConfig
  onConfigChange: (config: TestConfig) => void
  disabled: boolean
}

export function TestConfigPanel({
  personalities,
  selected,
  config,
  onConfigChange,
  disabled,
}: TestConfigPanelProps) {
  const totalTests = selected.reduce(
    (sum, id) => sum + (config.testsPerPersonality[id] || 10),
    0
  )

  const updateTestCount = (id: string, count: number) => {
    onConfigChange({
      ...config,
      testsPerPersonality: {
        ...config.testsPerPersonality,
        [id]: Math.max(1, Math.min(500, count)),
      },
    })
  }

  const updateBusinessMetric = (key: keyof TestConfig["businessMetrics"], value: number) => {
    onConfigChange({
      ...config,
      businessMetrics: {
        ...config.businessMetrics,
        [key]: value,
      },
    })
  }

  const presets = [
    { label: "Quick", count: 10 },
    { label: "Standard", count: 50 },
    { label: "Stress", count: 200 },
  ]

  const applyPreset = (count: number) => {
    const newCounts: Record<string, number> = {}
    selected.forEach((id) => {
      newCounts[id] = count
    })
    onConfigChange({
      ...config,
      testsPerPersonality: {
        ...config.testsPerPersonality,
        ...newCounts,
      },
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-border space-y-0">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Test Configuration</span>
        </div>
        <Badge variant="outline" className="font-mono text-xs">
          <Users className="h-3 w-3 mr-1" />
          {totalTests.toLocaleString()} total
        </Badge>
      </CardHeader>

      <CardContent className="p-0">
        {/* Synthetic Users per Personality */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Synthetic Users per Personality
            </span>
            <div className="flex gap-1">
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="secondary"
                  size="sm"
                  onClick={() => applyPreset(preset.count)}
                  disabled={disabled || selected.length === 0}
                  className="text-[10px] h-6 px-2"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {selected.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4">
              Select personalities to configure test volume
            </div>
          ) : (
            <div className="space-y-2">
              {selected.map((id) => {
                const personality = personalities.find((p) => p.id === id)
                if (!personality) return null
                const count = config.testsPerPersonality[id] || 10

                return (
                  <div key={id} className="flex items-center gap-3">
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
                    <div className="flex items-center gap-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => updateTestCount(id, count - 10)}
                        disabled={disabled || count <= 10}
                        className="w-6 h-6 p-0 text-xs"
                      >
                        -
                      </Button>
                      <Input
                        type="number"
                        value={count}
                        onChange={(e) => updateTestCount(id, parseInt(e.target.value) || 10)}
                        disabled={disabled}
                        className="w-16 h-6 text-center text-xs font-mono"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => updateTestCount(id, count + 10)}
                        disabled={disabled || count >= 500}
                        className="w-6 h-6 p-0 text-xs"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Distribution bar */}
          {selected.length > 0 && (
            <div className="mt-4">
              <div className="h-2 flex overflow-hidden">
                {selected.map((id) => {
                  const personality = personalities.find((p) => p.id === id)
                  const count = config.testsPerPersonality[id] || 10
                  const percentage = (count / totalTests) * 100

                  return (
                    <div
                      key={id}
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor:
                          personality?.color === "chart-1"
                            ? "oklch(0.65 0.15 250)"
                            : personality?.color === "chart-2"
                              ? "oklch(0.7 0.18 150)"
                              : personality?.color === "chart-3"
                                ? "oklch(0.65 0.2 30)"
                                : personality?.color === "chart-4"
                                  ? "oklch(0.7 0.15 330)"
                                  : "oklch(0.75 0.12 80)",
                      }}
                    />
                  )
                })}
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                <span>User Distribution</span>
                <span>{selected.length} profiles</span>
              </div>
            </div>
          )}
        </div>

        {/* Concurrency */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Concurrency
              </span>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {config.concurrency} parallel
            </Badge>
          </div>
          <input
            type="range"
            min={1}
            max={50}
            step={1}
            value={config.concurrency}
            onChange={(e) => onConfigChange({ ...config, concurrency: parseInt(e.target.value) })}
            disabled={disabled}
            className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
            <span>Sequential</span>
            <span>Max Parallel</span>
          </div>
        </div>

        {/* Business Outcome Metrics */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Business Outcome Targets
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3 bg-secondary/50 border-0">
              <div className="flex items-center gap-1.5 mb-2">
                <Target className="h-3 w-3 text-chart-2" />
                <span className="text-[10px] text-muted-foreground uppercase">Resolution Rate</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={config.businessMetrics.resolutionTarget}
                  onChange={(e) =>
                    updateBusinessMetric("resolutionTarget", parseInt(e.target.value) || 0)
                  }
                  disabled={disabled}
                  className="w-14 h-6 text-center text-xs font-mono"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </Card>

            <Card className="p-3 bg-secondary/50 border-0">
              <div className="flex items-center gap-1.5 mb-2">
                <Clock className="h-3 w-3 text-chart-1" />
                <span className="text-[10px] text-muted-foreground uppercase">Avg Handle Time</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={config.businessMetrics.avgHandleTimeTarget}
                  onChange={(e) =>
                    updateBusinessMetric("avgHandleTimeTarget", parseInt(e.target.value) || 0)
                  }
                  disabled={disabled}
                  className="w-14 h-6 text-center text-xs font-mono"
                />
                <span className="text-xs text-muted-foreground">sec</span>
              </div>
            </Card>

            <Card className="p-3 bg-secondary/50 border-0">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="h-3 w-3 text-chart-5" />
                <span className="text-[10px] text-muted-foreground uppercase">CSAT Target</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.1"
                  value={config.businessMetrics.csatTarget}
                  onChange={(e) =>
                    updateBusinessMetric("csatTarget", parseFloat(e.target.value) || 0)
                  }
                  disabled={disabled}
                  className="w-14 h-6 text-center text-xs font-mono"
                />
                <span className="text-xs text-muted-foreground">/5.0</span>
              </div>
            </Card>

            <Card className="p-3 bg-secondary/50 border-0">
              <div className="flex items-center gap-1.5 mb-2">
                <Users className="h-3 w-3 text-chart-3" />
                <span className="text-[10px] text-muted-foreground uppercase">Escalation Rate</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={config.businessMetrics.escalationRateTarget}
                  onChange={(e) =>
                    updateBusinessMetric("escalationRateTarget", parseInt(e.target.value) || 0)
                  }
                  disabled={disabled}
                  className="w-14 h-6 text-center text-xs font-mono"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </Card>

            <Card className="col-span-2 p-3 bg-secondary/50 border-0">
              <div className="flex items-center gap-1.5 mb-2">
                <DollarSign className="h-3 w-3 text-chart-2" />
                <span className="text-[10px] text-muted-foreground uppercase">Cost per Call</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={config.businessMetrics.costPerCall}
                  onChange={(e) =>
                    updateBusinessMetric("costPerCall", parseFloat(e.target.value) || 0)
                  }
                  disabled={disabled}
                  className="w-20 h-6 text-center text-xs font-mono"
                />
                <span className="text-xs text-muted-foreground flex-1 text-right">
                  Est. ${(totalTests * config.businessMetrics.costPerCall).toFixed(2)} total
                </span>
              </div>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
