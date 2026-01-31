"use client"

import { useState, useEffect } from "react"
import { 
  Play,
  Pause,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Clock,
  Users,
  Trophy,
  Scale
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface Variant {
  id: string
  name: string
  promptVersion: string
  description: string
  traffic: number
  metrics: {
    accuracy: number
    latency: number
    resolution: number
    csat: number
    cost: number
  }
  samples: number
  confidence: number
}

interface Experiment {
  id: string
  name: string
  status: 'running' | 'completed' | 'paused'
  startedAt: string
  duration: string
  totalSamples: number
  targetSamples: number
  winner: string | null
  variants: Variant[]
}

const MOCK_EXPERIMENT: Experiment = {
  id: "exp-001",
  name: "Empathy Pattern Test",
  status: "running",
  startedAt: "Jan 30, 2026 09:00",
  duration: "5h 32m",
  totalSamples: 4250,
  targetSamples: 10000,
  winner: null,
  variants: [
    {
      id: "control",
      name: "Control",
      promptVersion: "v1.3.0",
      description: "Current production prompt",
      traffic: 50,
      metrics: {
        accuracy: 89.7,
        latency: 2.10,
        resolution: 84.2,
        csat: 4.3,
        cost: 0.0082
      },
      samples: 2125,
      confidence: 95
    },
    {
      id: "variant-a",
      name: "Variant A",
      promptVersion: "v1.4.0",
      description: "Added empathy patterns for emotional users",
      traffic: 50,
      metrics: {
        accuracy: 94.2,
        latency: 1.82,
        resolution: 87.3,
        csat: 4.6,
        cost: 0.0089
      },
      samples: 2125,
      confidence: 97
    }
  ]
}

const PAST_EXPERIMENTS = [
  { id: "exp-000", name: "Response Length Optimization", winner: "Variant B", lift: "+12.3%", date: "Jan 28" },
  { id: "exp-002", name: "Technical Jargon Reduction", winner: "Variant A", lift: "+8.7%", date: "Jan 25" },
  { id: "exp-003", name: "Greeting Style Test", winner: "Control", lift: "0%", date: "Jan 22" }
]

export function ABTestingDashboard() {
  const [experiment] = useState<Experiment>(MOCK_EXPERIMENT)
  const [isLive, setIsLive] = useState(true)
  const [primaryMetric, setPrimaryMetric] = useState<'accuracy' | 'latency' | 'resolution' | 'csat'>('accuracy')
  const [liveMetrics, setLiveMetrics] = useState(experiment.variants.map(v => ({ ...v.metrics })))

  useEffect(() => {
    if (!isLive) return
    
    const interval = setInterval(() => {
      setLiveMetrics(prev => prev.map((metrics) => ({
        accuracy: Math.min(100, Math.max(0, metrics.accuracy + (Math.random() - 0.5) * 0.3)),
        latency: Math.max(0.5, metrics.latency + (Math.random() - 0.5) * 0.05),
        resolution: Math.min(100, Math.max(0, metrics.resolution + (Math.random() - 0.5) * 0.2)),
        csat: Math.min(5, Math.max(1, metrics.csat + (Math.random() - 0.5) * 0.02)),
        cost: metrics.cost
      })))
    }, 2000)

    return () => clearInterval(interval)
  }, [isLive])

  const getWinningVariant = () => {
    const control = liveMetrics[0]
    const variant = liveMetrics[1]
    
    const controlScore = control[primaryMetric]
    const variantScore = variant[primaryMetric]
    
    if (primaryMetric === 'latency') {
      return variantScore < controlScore ? 'variant-a' : 'control'
    }
    return variantScore > controlScore ? 'variant-a' : 'control'
  }

  const getLift = () => {
    const control = liveMetrics[0][primaryMetric]
    const variant = liveMetrics[1][primaryMetric]
    const lift = ((variant - control) / control) * 100
    return primaryMetric === 'latency' ? -lift : lift
  }

  const winningVariant = getWinningVariant()
  const lift = getLift()
  const progress = (experiment.totalSamples / experiment.targetSamples) * 100

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Scale className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">A/B Testing</span>
          <Badge 
            variant={experiment.status === 'running' ? 'default' : 'secondary'}
            className={experiment.status === 'running' ? 'bg-chart-2/10 text-chart-2 border-chart-2/30 gap-1' : ''}
          >
            {experiment.status === 'running' && <span className="w-1.5 h-1.5 bg-chart-2 animate-pulse" />}
            {experiment.status}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-xs gap-1.5"
            onClick={() => setIsLive(!isLive)}
          >
            {isLive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isLive ? "Pause" : "Resume"}
          </Button>
          <Button size="sm" className="h-7 text-xs gap-1.5">
            <Trophy className="w-3.5 h-3.5" />
            Declare Winner
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-auto">
          {/* Experiment Info */}
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-medium mb-1">{experiment.name}</h2>
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Started {experiment.startedAt}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {experiment.totalSamples.toLocaleString()} / {experiment.targetSamples.toLocaleString()} samples
              </span>
              <span>Duration: {experiment.duration}</span>
            </div>
            
            {/* Progress bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground">Experiment Progress</span>
                <Badge variant="outline" className="text-[10px] font-mono">{progress.toFixed(1)}%</Badge>
              </div>
              <Progress value={progress} className="h-1" />
            </div>
          </div>

          {/* Primary Metric Selector */}
          <div className="px-4 py-2 border-b border-border flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">Primary Metric:</span>
            {(['accuracy', 'latency', 'resolution', 'csat'] as const).map((metric) => (
              <Button
                key={metric}
                variant={primaryMetric === metric ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setPrimaryMetric(metric)}
                className="h-6 text-xs px-2"
              >
                {metric.charAt(0).toUpperCase() + metric.slice(1)}
              </Button>
            ))}
          </div>

          {/* Winner Banner */}
          <Card className={`mx-4 mt-4 ${lift > 5 ? 'border-chart-2/30 bg-chart-2/5' : lift < -5 ? 'border-chart-3/30 bg-chart-3/5' : 'bg-secondary/50'}`}>
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {lift > 5 ? (
                  <TrendingUp className="w-4 h-4 text-chart-2" />
                ) : lift < -5 ? (
                  <TrendingDown className="w-4 h-4 text-chart-3" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-chart-5" />
                )}
                <span className="text-xs">
                  {lift > 5 ? (
                    <><span className="font-medium">Variant A</span> is winning with <Badge variant="outline" className="font-mono text-chart-2">+{lift.toFixed(1)}%</Badge> lift</>
                  ) : lift < -5 ? (
                    <><span className="font-medium">Control</span> is winning with <Badge variant="outline" className="font-mono text-chart-2">+{Math.abs(lift).toFixed(1)}%</Badge> lift</>
                  ) : (
                    <>No significant difference detected yet</>
                  )}
                </span>
              </div>
              <Badge variant="outline" className="text-[10px]">
                Confidence: {Math.max(...experiment.variants.map(v => v.confidence))}%
              </Badge>
            </CardContent>
          </Card>

          {/* Variants Comparison */}
          <div className="flex-1 p-4">
            <div className="grid grid-cols-2 gap-4">
              {experiment.variants.map((variant, index) => {
                const metrics = liveMetrics[index]
                const isWinning = winningVariant === variant.id
                
                return (
                  <Card
                    key={variant.id}
                    className={isWinning ? 'border-chart-2/30 bg-chart-2/5' : ''}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 ${index === 0 ? 'bg-muted-foreground' : 'bg-chart-1'}`} />
                          <span className="text-sm font-medium">{variant.name}</span>
                          {isWinning && (
                            <Trophy className="w-3.5 h-3.5 text-chart-2" />
                          )}
                        </div>
                        <Badge variant="outline" className="text-[10px] font-mono">{variant.promptVersion}</Badge>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-4">{variant.description}</p>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">Traffic</span>
                          <Badge variant="secondary" className="text-xs font-mono">{variant.traffic}%</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">Samples</span>
                          <span className="text-xs font-mono">{variant.samples.toLocaleString()}</span>
                        </div>
                        
                        <Separator />
                        
                        <div className={`flex items-center justify-between ${primaryMetric === 'accuracy' ? 'bg-secondary/50 -mx-2 px-2 py-1' : ''}`}>
                          <span className="text-[10px] text-muted-foreground">Accuracy</span>
                          <span className="text-xs font-mono">{metrics.accuracy.toFixed(1)}%</span>
                        </div>
                        
                        <div className={`flex items-center justify-between ${primaryMetric === 'latency' ? 'bg-secondary/50 -mx-2 px-2 py-1' : ''}`}>
                          <span className="text-[10px] text-muted-foreground">Latency</span>
                          <span className="text-xs font-mono">{metrics.latency.toFixed(2)}s</span>
                        </div>
                        
                        <div className={`flex items-center justify-between ${primaryMetric === 'resolution' ? 'bg-secondary/50 -mx-2 px-2 py-1' : ''}`}>
                          <span className="text-[10px] text-muted-foreground">Resolution</span>
                          <span className="text-xs font-mono">{metrics.resolution.toFixed(1)}%</span>
                        </div>
                        
                        <div className={`flex items-center justify-between ${primaryMetric === 'csat' ? 'bg-secondary/50 -mx-2 px-2 py-1' : ''}`}>
                          <span className="text-[10px] text-muted-foreground">CSAT</span>
                          <span className="text-xs font-mono">{metrics.csat.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">Cost/call</span>
                          <span className="text-xs font-mono">${metrics.cost.toFixed(4)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>

        {/* Sidebar - Past Experiments */}
        <Card className="w-64 border-0 border-l border-border flex flex-col overflow-hidden">
          <CardHeader className="px-3 py-2 border-b border-border space-y-0 shrink-0">
            <span className="text-xs font-medium">Past Experiments</span>
          </CardHeader>

          <ScrollArea className="flex-1 min-h-0">
            {PAST_EXPERIMENTS.map((exp) => (
              <button
                key={exp.id}
                className="w-full text-left px-3 py-3 border-b border-border hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs truncate flex-1 mr-2">{exp.name}</span>
                  <span className="text-[10px] text-muted-foreground">{exp.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] text-chart-2 gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {exp.winner}
                  </Badge>
                  <span className="text-[10px] font-mono text-muted-foreground">{exp.lift}</span>
                </div>
              </button>
            ))}
          </ScrollArea>
          
          <div className="p-3 border-t border-border">
            <Button variant="ghost" size="sm" className="w-full h-7 text-xs">
              View All Experiments
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
