"use client"

import { useState } from "react"
import { 
  Clock,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
  Download,
  BarChart3,
  GitCompare
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TestRun {
  id: string
  timestamp: string
  date: string
  promptVersion: string
  totalTests: number
  personalities: string[]
  duration: string
  metrics: {
    accuracy: number
    accuracyDelta: number
    latency: number
    latencyDelta: number
    resolution: number
    resolutionDelta: number
    csat: number
    csatDelta: number
  }
  status: 'completed' | 'failed' | 'partial'
}

const MOCK_RUNS: TestRun[] = [
  {
    id: "run-001",
    timestamp: "14:32",
    date: "Today",
    promptVersion: "v1.4.0",
    totalTests: 2500,
    personalities: ["Assertive", "Confused", "Technical", "Emotional", "Multilingual", "Rapid"],
    duration: "12m 34s",
    metrics: {
      accuracy: 94.2,
      accuracyDelta: 4.5,
      latency: 1.82,
      latencyDelta: -0.28,
      resolution: 87.3,
      resolutionDelta: 3.1,
      csat: 4.6,
      csatDelta: 0.3
    },
    status: 'completed'
  },
  {
    id: "run-002",
    timestamp: "11:15",
    date: "Today",
    promptVersion: "v1.3.0",
    totalTests: 1800,
    personalities: ["Assertive", "Confused", "Technical", "Emotional"],
    duration: "8m 21s",
    metrics: {
      accuracy: 89.7,
      accuracyDelta: 7.4,
      latency: 2.10,
      latencyDelta: -0.30,
      resolution: 84.2,
      resolutionDelta: 1.9,
      csat: 4.3,
      csatDelta: 0.2
    },
    status: 'completed'
  },
  {
    id: "run-003",
    timestamp: "16:45",
    date: "Yesterday",
    promptVersion: "v1.3.0",
    totalTests: 1200,
    personalities: ["Technical", "Rapid"],
    duration: "5m 12s",
    metrics: {
      accuracy: 82.3,
      accuracyDelta: 10.8,
      latency: 2.40,
      latencyDelta: 0.50,
      resolution: 82.3,
      resolutionDelta: -1.2,
      csat: 4.1,
      csatDelta: -0.1
    },
    status: 'completed'
  },
  {
    id: "run-004",
    timestamp: "09:22",
    date: "Yesterday",
    promptVersion: "v1.2.0",
    totalTests: 500,
    personalities: ["Confused", "Emotional"],
    duration: "2m 45s",
    metrics: {
      accuracy: 71.5,
      accuracyDelta: 0,
      latency: 1.90,
      latencyDelta: 0,
      resolution: 83.5,
      resolutionDelta: 0,
      csat: 4.2,
      csatDelta: 0
    },
    status: 'completed'
  },
  {
    id: "run-005",
    timestamp: "14:10",
    date: "Jan 28",
    promptVersion: "v1.2.0",
    totalTests: 2000,
    personalities: ["Assertive", "Technical", "Multilingual"],
    duration: "—",
    metrics: {
      accuracy: 68.2,
      accuracyDelta: -3.3,
      latency: 3.20,
      latencyDelta: 1.30,
      resolution: 72.1,
      resolutionDelta: -11.4,
      csat: 3.8,
      csatDelta: -0.4
    },
    status: 'failed'
  }
]

const TREND_DATA = [
  { date: "Jan 22", accuracy: 65, latency: 2.8 },
  { date: "Jan 24", accuracy: 68, latency: 2.6 },
  { date: "Jan 26", accuracy: 71, latency: 2.4 },
  { date: "Jan 28", accuracy: 75, latency: 2.2 },
  { date: "Jan 29", accuracy: 82, latency: 2.1 },
  { date: "Jan 30", accuracy: 89, latency: 1.9 },
  { date: "Today", accuracy: 94, latency: 1.8 },
]

export function TestHistory() {
  const [selectedRuns, setSelectedRuns] = useState<string[]>([])
  const [filter, setFilter] = useState<'all' | 'completed' | 'failed'>('all')

  const toggleRunSelection = (id: string) => {
    setSelectedRuns(prev => 
      prev.includes(id) 
        ? prev.filter(r => r !== id)
        : prev.length < 2 ? [...prev, id] : [prev[1], id]
    )
  }

  const filteredRuns = MOCK_RUNS.filter(run => 
    filter === 'all' || run.status === filter
  )

  const DeltaIndicator = ({ value, inverted = false }: { value: number, inverted?: boolean }) => {
    const isPositive = inverted ? value < 0 : value > 0
    const isNegative = inverted ? value > 0 : value < 0
    
    if (value === 0) return <Minus className="w-3 h-3 text-muted-foreground" />
    
    return (
      <Badge 
        variant="outline" 
        className={`gap-0.5 text-[10px] ${isPositive ? 'text-chart-2 border-chart-2/30' : 'text-chart-3 border-chart-3/30'}`}
      >
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {Math.abs(value).toFixed(1)}{typeof value === 'number' && !inverted ? '%' : 's'}
      </Badge>
    )
  }

  const maxAccuracy = Math.max(...TREND_DATA.map(d => d.accuracy))

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Test History</span>
          <Badge variant="secondary" className="text-xs">{MOCK_RUNS.length} runs</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedRuns.length === 2 && (
            <Button size="sm" className="h-7 text-xs gap-1.5">
              <GitCompare className="w-3.5 h-3.5" />
              Compare Selected
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5">
            <Download className="w-3.5 h-3.5" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Trend Chart */}
        <Card className="w-80 border-0 border-r border-border p-4 flex flex-col">
          <CardHeader className="p-0 flex flex-row items-center justify-between mb-4 space-y-0">
            <span className="text-xs font-medium">Accuracy Trend</span>
            <Badge variant="outline" className="text-[10px]">Last 7 days</Badge>
          </CardHeader>
          
          {/* Simple bar chart */}
          <div className="flex-1 flex items-end gap-2">
            {TREND_DATA.map((point, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <Badge variant="secondary" className="text-[10px] text-chart-2 font-mono">{point.accuracy}%</Badge>
                <div 
                  className="w-full bg-chart-1 transition-all"
                  style={{ height: `${(point.accuracy / maxAccuracy) * 150}px` }}
                />
                <span className="text-[9px] text-muted-foreground">{point.date}</span>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <CardContent className="mt-6 pt-4 border-t border-border p-0 grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] text-muted-foreground mb-1">Total Tests</div>
              <div className="text-lg font-mono font-medium">8,000</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground mb-1">Avg Duration</div>
              <div className="text-lg font-mono font-medium">7m 12s</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground mb-1">Best Accuracy</div>
              <div className="text-lg font-mono font-medium text-chart-2">94.2%</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground mb-1">Best Latency</div>
              <div className="text-lg font-mono font-medium text-chart-1">1.82s</div>
            </div>
          </CardContent>
        </Card>

        {/* Run List */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Filters */}
          <div className="px-4 py-2 border-b border-border flex items-center gap-2 shrink-0">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <div className="flex items-center gap-1">
              {(['all', 'completed', 'failed'] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter(f)}
                  className="h-6 text-xs px-2"
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Button>
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground ml-auto">
              Select 2 runs to compare
            </span>
          </div>

          {/* Runs */}
          <ScrollArea className="flex-1 min-h-0">
            {filteredRuns.map((run, index) => {
              const prevDate = index > 0 ? filteredRuns[index - 1].date : null
              const showDateHeader = run.date !== prevDate

              return (
                <div key={run.id}>
                  {showDateHeader && (
                    <div className="px-4 py-2 bg-secondary/50 border-b border-border">
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        {run.date}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => toggleRunSelection(run.id)}
                    className={`w-full text-left px-4 py-3 border-b border-border transition-colors ${
                      selectedRuns.includes(run.id)
                        ? 'bg-chart-1/5 border-l-2 border-l-chart-1'
                        : 'hover:bg-secondary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedRuns.includes(run.id)}
                          className="w-3 h-3"
                        />
                        <Badge variant="outline" className="text-xs font-mono">{run.promptVersion}</Badge>
                        <Badge 
                          variant={run.status === 'completed' ? 'default' : 'destructive'}
                          className={run.status === 'completed' ? 'bg-chart-2/10 text-chart-2 border-chart-2/30' : ''}
                        >
                          {run.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {run.timestamp}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {run.totalTests.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 mb-3">
                      {run.personalities.map((p, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px]">
                          {p}
                        </Badge>
                      ))}
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <div className="text-[10px] text-muted-foreground mb-0.5">Accuracy</div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-mono">{run.metrics.accuracy}%</span>
                          <DeltaIndicator value={run.metrics.accuracyDelta} />
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground mb-0.5">Latency</div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-mono">{run.metrics.latency}s</span>
                          <DeltaIndicator value={run.metrics.latencyDelta} inverted />
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground mb-0.5">Resolution</div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-mono">{run.metrics.resolution}%</span>
                          <DeltaIndicator value={run.metrics.resolutionDelta} />
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground mb-0.5">CSAT</div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-mono">{run.metrics.csat}</span>
                          <DeltaIndicator value={run.metrics.csatDelta} />
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              )
            })}
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
