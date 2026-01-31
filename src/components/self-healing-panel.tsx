"use client"

import type { TestSession, Personality } from "@/lib/types"
import { 
  Sparkles, 
  AlertCircle, 
  ChevronRight, 
  Check, 
  RefreshCw,
  Wand2,
  FileText,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface SelfHealingPanelProps {
  sessions: TestSession[]
  personalities: Personality[]
  isRunning: boolean
  onApplySuggestion: (suggestionId: string) => void
}

interface PromptIssue {
  id: string
  severity: "critical" | "warning" | "info"
  personality: string
  issue: string
  suggestion: string
  impact: string
  originalPrompt: string
  improvedPrompt: string
  confidence: number
}

interface OptimizationResult {
  metric: string
  before: number
  after: number
  change: number
}

export function SelfHealingPanel({ 
  sessions, 
  personalities, 
  isRunning,
  onApplySuggestion 
}: SelfHealingPanelProps) {
  const [issues, setIssues] = useState<PromptIssue[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null)
  const [appliedFixes, setAppliedFixes] = useState<string[]>([])
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult[]>([])

  const completedSessions = sessions.filter((s) => s.status === "completed")
  const hasResults = completedSessions.length > 0

  useEffect(() => {
    if (completedSessions.length > 0 && !isRunning && issues.length === 0) {
      runAnalysis()
    }
  }, [completedSessions.length, isRunning])

  const runAnalysis = () => {
    setAnalyzing(true)
    setIssues([])
    setAppliedFixes([])
    setOptimizationResults([])

    setTimeout(() => {
      const detectedIssues: PromptIssue[] = []

      completedSessions.forEach((session) => {
        const personality = personalities.find((p) => p.id === session.personalityId)
        if (!personality) return

        if (session.personalityId === "assertive" && session.accuracy < 90) {
          detectedIssues.push({
            id: `issue-${session.id}-1`,
            severity: "critical",
            personality: personality.name,
            issue: "Response latency exceeds user tolerance threshold",
            suggestion: "Add urgency detection and fast-path responses",
            impact: "+15% satisfaction for time-sensitive users",
            originalPrompt: "You are a helpful customer service agent. Take your time to provide thorough responses.",
            improvedPrompt: "You are an efficient customer service agent. For users showing urgency cues (words like 'now', 'immediately', 'urgent'), prioritize brevity and direct answers. Skip pleasantries when user tone is direct.",
            confidence: 94,
          })
        }

        if (session.personalityId === "confused" && session.errors > 0) {
          detectedIssues.push({
            id: `issue-${session.id}-2`,
            severity: "warning",
            personality: personality.name,
            issue: "Clarification requests not handled gracefully",
            suggestion: "Implement progressive disclosure pattern",
            impact: "+22% completion rate for elderly users",
            originalPrompt: "Answer user questions directly and completely.",
            improvedPrompt: "Answer questions in simple, clear language. When users ask for clarification or seem confused, break down your response into smaller steps. Offer to repeat information when needed. Use analogies familiar to all age groups.",
            confidence: 87,
          })
        }

        if (session.personalityId === "technical") {
          detectedIssues.push({
            id: `issue-${session.id}-3`,
            severity: "info",
            personality: personality.name,
            issue: "Technical depth could be increased for expert users",
            suggestion: "Add expertise detection and detail escalation",
            impact: "+8% accuracy on technical queries",
            originalPrompt: "Provide accurate information about our products and services.",
            improvedPrompt: "Detect user expertise level from terminology used. For technical users (using jargon, asking about APIs/specs), provide detailed technical responses including exact specifications, version numbers, and implementation details. Reference documentation when available.",
            confidence: 91,
          })
        }

        if (session.personalityId === "emotional") {
          detectedIssues.push({
            id: `issue-${session.id}-4`,
            severity: "critical",
            personality: personality.name,
            issue: "Empathy acknowledgment missing in frustration scenarios",
            suggestion: "Add emotional intelligence layer",
            impact: "+31% de-escalation success rate",
            originalPrompt: "Help customers resolve their issues efficiently.",
            improvedPrompt: "PRIORITY: Detect emotional state from tone, caps, punctuation, and word choice. For frustrated users: (1) Acknowledge their feelings first, (2) Apologize for the experience, (3) Take ownership, (4) Only then provide solutions. Never use dismissive language or deflect blame.",
            confidence: 96,
          })
        }

        if (session.personalityId === "multilingual") {
          detectedIssues.push({
            id: `issue-${session.id}-5`,
            severity: "warning",
            personality: personality.name,
            issue: "Code-switching context not preserved across turns",
            suggestion: "Implement language-aware context memory",
            impact: "+18% comprehension for multilingual users",
            originalPrompt: "Respond in the language the user uses.",
            improvedPrompt: "Match user's language preference, including code-switching patterns. If user mixes languages, maintain same register. Preserve cultural context and idiomatic expressions. When user struggles with English, simplify vocabulary without being condescending.",
            confidence: 83,
          })
        }

        if (session.personalityId === "rapid") {
          detectedIssues.push({
            id: `issue-${session.id}-6`,
            severity: "info",
            personality: personality.name,
            issue: "Multi-topic requests handled sequentially instead of batched",
            suggestion: "Enable parallel topic resolution",
            impact: "+12% efficiency for multi-tasking users",
            originalPrompt: "Address user questions one at a time in order.",
            improvedPrompt: "For users asking multiple questions in one message: (1) Acknowledge all topics, (2) Provide a structured response addressing each, (3) Use clear section breaks. For rapid-fire conversations, match user's pace while maintaining accuracy.",
            confidence: 89,
          })
        }
      })

      setIssues(detectedIssues)
      setAnalyzing(false)
    }, 2000)
  }

  const applyFix = (issueId: string) => {
    setAppliedFixes((prev) => [...prev, issueId])
    onApplySuggestion(issueId)
    
    const issue = issues.find((i) => i.id === issueId)
    if (issue) {
      const newResults: OptimizationResult[] = [
        {
          metric: "Accuracy",
          before: 82.4,
          after: 82.4 + (issue.confidence / 10),
          change: issue.confidence / 10,
        },
        {
          metric: "Latency",
          before: 340,
          after: 340 - Math.floor(Math.random() * 50),
          change: -Math.floor(Math.random() * 50),
        },
      ]
      setOptimizationResults((prev) => [...prev, ...newResults])
    }
  }

  const applyAllFixes = () => {
    const unApplied = issues.filter((i) => !appliedFixes.includes(i.id))
    unApplied.forEach((issue) => {
      setTimeout(() => applyFix(issue.id), Math.random() * 500)
    })
  }

  const getSeverityColor = (severity: PromptIssue["severity"]) => {
    switch (severity) {
      case "critical": return "text-destructive"
      case "warning": return "text-chart-5"
      case "info": return "text-chart-1"
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-border space-y-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-chart-1" />
          <span className="text-sm font-medium">Self-Healing</span>
        </div>
        {hasResults && !analyzing && issues.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={runAnalysis}
          >
            <RefreshCw className="h-3 w-3" />
            Re-analyze
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {!hasResults && !analyzing && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Card className="h-10 w-10 border-dashed flex items-center justify-center mb-3">
              <Wand2 className="h-4 w-4 text-muted-foreground" />
            </Card>
            <p className="text-sm text-muted-foreground">
              Run tests to enable prompt analysis
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Self-healing activates after test completion
            </p>
          </div>
        )}

        {analyzing && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-chart-1 border-t-transparent animate-spin" />
              <span className="text-sm">Analyzing test results...</span>
            </div>
            <div className="space-y-2">
              {["Parsing transcripts", "Detecting patterns", "Generating suggestions"].map((step, i) => (
                <div 
                  key={step}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                  style={{ animationDelay: `${i * 0.3}s` }}
                >
                  <div className="h-1.5 w-1.5 bg-chart-1 animate-pulse" />
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {!analyzing && issues.length > 0 && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-px bg-border">
              <Card className="p-2.5 text-center border-0">
                <div className="text-lg font-mono text-destructive">
                  {issues.filter((i) => i.severity === "critical").length}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Critical</div>
              </Card>
              <Card className="p-2.5 text-center border-0">
                <div className="text-lg font-mono text-chart-5">
                  {issues.filter((i) => i.severity === "warning").length}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Warnings</div>
              </Card>
              <Card className="p-2.5 text-center border-0">
                <div className="text-lg font-mono text-chart-2">
                  {appliedFixes.length}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Fixed</div>
              </Card>
            </div>

            {/* Apply All Button */}
            {appliedFixes.length < issues.length && (
              <Button
                onClick={applyAllFixes}
                className="w-full gap-2"
                size="sm"
              >
                <Zap className="h-3.5 w-3.5" />
                Apply All Fixes ({issues.length - appliedFixes.length})
              </Button>
            )}

            {/* Issues List */}
            <ScrollArea className="h-[400px]">
              <div className="space-y-2 pr-4">
                {issues.map((issue) => {
                  const isExpanded = expandedIssue === issue.id
                  const isApplied = appliedFixes.includes(issue.id)

                  return (
                    <Collapsible
                      key={issue.id}
                      open={isExpanded}
                      onOpenChange={() => setExpandedIssue(isExpanded ? null : issue.id)}
                    >
                      <Card className={cn("transition-all", isApplied && "opacity-60")}>
                        <CollapsibleTrigger className="w-full px-3 py-2.5 flex items-start gap-2 text-left">
                          <AlertCircle className={cn("h-4 w-4 mt-0.5 shrink-0", getSeverityColor(issue.severity))} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <Badge 
                                variant={issue.severity === "critical" ? "destructive" : "secondary"}
                                className={cn(
                                  "text-[10px]",
                                  issue.severity === "warning" && "bg-chart-5/10 text-chart-5 border-chart-5/30",
                                  issue.severity === "info" && "bg-chart-1/10 text-chart-1 border-chart-1/30"
                                )}
                              >
                                {issue.severity}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground truncate">
                                {issue.personality}
                              </span>
                            </div>
                            <p className="text-sm">{issue.issue}</p>
                          </div>
                          <ChevronRight className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform shrink-0",
                            isExpanded && "rotate-90"
                          )} />
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
                            {/* Suggestion */}
                            <div className="space-y-1">
                              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Suggestion</span>
                              <p className="text-sm">{issue.suggestion}</p>
                            </div>

                            {/* Impact */}
                            <Card className="flex items-center gap-2 p-2 bg-chart-2/10 border-chart-2/20">
                              <Zap className="h-3.5 w-3.5 text-chart-2" />
                              <span className="text-xs text-chart-2">{issue.impact}</span>
                            </Card>

                            {/* Prompt Diff */}
                            <div className="space-y-2">
                              <span className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                                <FileText className="h-3 w-3" />
                                Prompt Modification
                              </span>
                              
                              <div className="space-y-1.5">
                                <Card className="p-2 bg-destructive/5 border-l-2 border-destructive/30 border-t-0 border-r-0 border-b-0">
                                  <Badge variant="outline" className="text-destructive/70 text-[10px] mb-1">BEFORE</Badge>
                                  <code className="text-xs text-muted-foreground font-mono leading-relaxed block">
                                    {issue.originalPrompt}
                                  </code>
                                </Card>
                                <Card className="p-2 bg-chart-2/5 border-l-2 border-chart-2/50 border-t-0 border-r-0 border-b-0">
                                  <Badge variant="outline" className="text-chart-2 text-[10px] mb-1">AFTER</Badge>
                                  <code className="text-xs text-foreground font-mono leading-relaxed block">
                                    {issue.improvedPrompt}
                                  </code>
                                </Card>
                              </div>
                            </div>

                            {/* Confidence & Apply */}
                            <div className="flex items-center justify-between pt-2">
                              <div className="flex items-center gap-2">
                                <Progress value={issue.confidence} className="h-1.5 w-16" />
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  {issue.confidence}% confidence
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant={isApplied ? "secondary" : "default"}
                                className="h-7 text-xs gap-1.5"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (!isApplied) applyFix(issue.id)
                                }}
                                disabled={isApplied}
                              >
                                {isApplied ? (
                                  <>
                                    <Check className="h-3 w-3" />
                                    Applied
                                  </>
                                ) : (
                                  <>
                                    <Wand2 className="h-3 w-3" />
                                    Apply Fix
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  )
                })}
              </div>
            </ScrollArea>

            {/* Optimization Results */}
            {optimizationResults.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  Optimization Impact
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {optimizationResults.slice(0, 4).map((result, i) => (
                    <Card key={i} className="p-2 bg-secondary/50 border-0">
                      <div className="text-[10px] text-muted-foreground mb-1">{result.metric}</div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-mono text-sm">
                          {result.metric === "Latency" ? `${result.after.toFixed(0)}ms` : `${result.after.toFixed(1)}%`}
                        </span>
                        <Badge 
                          variant="outline"
                          className={cn(
                            "text-[10px] font-mono",
                            result.change > 0 && result.metric !== "Latency" && "text-chart-2 border-chart-2/30",
                            result.change < 0 && result.metric === "Latency" && "text-chart-2 border-chart-2/30",
                            result.change > 0 && result.metric === "Latency" && "text-destructive border-destructive/30",
                            result.change < 0 && result.metric !== "Latency" && "text-destructive border-destructive/30"
                          )}
                        >
                          {result.change > 0 ? "+" : ""}{result.change.toFixed(1)}{result.metric === "Latency" ? "ms" : "%"}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
