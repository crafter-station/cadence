"use client"

import React from "react"
import type { TestSession, Personality } from "@/lib/types"
import { BarChart3, Clock, AlertTriangle, CheckCircle2, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface MetricsPanelProps {
  sessions: TestSession[]
  personalities: Personality[]
}

export function MetricsPanel({ sessions, personalities }: MetricsPanelProps) {
  const [time, setTime] = useState(0)

  useEffect(() => {
    const isRunning = sessions.some((s) => s.status === "running")
    if (!isRunning) {
      if (sessions.length === 0) setTime(0)
      return
    }
    
    const interval = setInterval(() => {
      setTime((t) => t + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [sessions])

  const totalTurns = sessions.reduce((acc, s) => acc + s.turns, 0)
  const avgLatency = sessions.length > 0
    ? Math.round(
        sessions.reduce((acc, s) => {
          const avg = s.latency.length > 0
            ? s.latency.reduce((a, b) => a + b, 0) / s.latency.length
            : 0
          return acc + avg
        }, 0) / sessions.length
      )
    : 0
  const avgAccuracy = sessions.length > 0
    ? sessions.reduce((acc, s) => acc + s.accuracy, 0) / sessions.length
    : 0
  const totalErrors = sessions.reduce((acc, s) => acc + s.errors, 0)
  const completedCount = sessions.filter((s) => s.status === "completed").length

  const getPersonality = (id: string) =>
    personalities.find((p) => p.id === id)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 px-4 py-3 border-b border-border space-y-0">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Metrics</span>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Timer */}
        <Card className="flex items-center justify-between p-3 bg-secondary border-0">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Elapsed</span>
          </div>
          <span className="font-mono text-lg">
            {String(Math.floor(time / 60)).padStart(2, "0")}:
            {String(time % 60).padStart(2, "0")}
          </span>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-px bg-border">
          <MetricCard
            label="Avg Latency"
            value={`${avgLatency}ms`}
            icon={<Activity className="h-3.5 w-3.5" />}
            trend={avgLatency < 300 ? "good" : avgLatency < 500 ? "warn" : "bad"}
          />
          <MetricCard
            label="Accuracy"
            value={`${avgAccuracy.toFixed(1)}%`}
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
            trend={avgAccuracy > 90 ? "good" : avgAccuracy > 75 ? "warn" : "bad"}
          />
          <MetricCard
            label="Total Turns"
            value={totalTurns.toString()}
            icon={<BarChart3 className="h-3.5 w-3.5" />}
          />
          <MetricCard
            label="Errors"
            value={totalErrors.toString()}
            icon={<AlertTriangle className="h-3.5 w-3.5" />}
            trend={totalErrors === 0 ? "good" : totalErrors < 3 ? "warn" : "bad"}
          />
        </div>

        {/* Progress Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Completion</span>
            <span className="font-mono">
              {completedCount}/{sessions.length}
            </span>
          </div>
          <Progress 
            value={sessions.length > 0 ? (completedCount / sessions.length) * 100 : 0} 
            className="h-2"
          />
        </div>

        {/* Individual Session Stats */}
        {sessions.length > 0 && (
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">By Personality</span>
            <div className="space-y-1">
              {sessions.map((session) => {
                const personality = getPersonality(session.personalityId)
                if (!personality) return null
                
                return (
                  <div
                    key={session.id}
                    className="flex items-center gap-2 p-2 bg-secondary/50"
                  >
                    <div className="h-1.5 w-1.5" style={{
                      backgroundColor: personality.color === "chart-1" ? "oklch(0.65 0.15 250)" :
                        personality.color === "chart-2" ? "oklch(0.7 0.18 150)" :
                        personality.color === "chart-3" ? "oklch(0.65 0.2 30)" :
                        personality.color === "chart-4" ? "oklch(0.7 0.15 330)" :
                        "oklch(0.75 0.12 80)"
                    }} />
                    <span className="text-xs flex-1 truncate">{personality.name}</span>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                      <span>{Math.round(session.progress)}%</span>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[10px] px-1 py-0",
                          session.status === "completed" && "text-chart-1 border-chart-1/30",
                          session.status === "running" && "text-chart-2 border-chart-2/30",
                          session.status === "failed" && "text-destructive border-destructive/30"
                        )}
                      >
                        {session.status === "completed" ? "done" :
                         session.status === "running" ? "live" : "fail"}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Latency Distribution */}
        {sessions.some((s) => s.latency.length > 0) && (
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground">Latency Distribution</span>
            <div className="flex items-end gap-px h-16">
              {Array.from({ length: 20 }).map((_, i) => {
                const allLatencies = sessions.flatMap((s) => s.latency)
                const bucket = allLatencies.filter(
                  (l) => l >= i * 50 && l < (i + 1) * 50
                ).length
                const maxBucket = Math.max(
                  1,
                  ...Array.from({ length: 20 }).map((_, j) =>
                    allLatencies.filter((l) => l >= j * 50 && l < (j + 1) * 50).length
                  )
                )
                const height = (bucket / maxBucket) * 100

                return (
                  <div
                    key={i}
                    className="flex-1 bg-chart-1 transition-all duration-300"
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                )
              })}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>0ms</span>
              <span>500ms</span>
              <span>1000ms</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function MetricCard({
  label,
  value,
  icon,
  trend,
}: {
  label: string
  value: string
  icon: React.ReactNode
  trend?: "good" | "warn" | "bad"
}) {
  return (
    <div className="p-3 bg-card">
      <div className="flex items-center gap-1.5 mb-1">
        <span className={cn(
          "text-muted-foreground",
          trend === "good" && "text-chart-2",
          trend === "warn" && "text-chart-5",
          trend === "bad" && "text-destructive"
        )}>
          {icon}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="text-lg font-mono">{value}</div>
    </div>
  )
}
