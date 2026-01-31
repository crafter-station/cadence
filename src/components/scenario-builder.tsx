"use client"

import { useState } from "react"
import { 
  Plus,
  Trash2,
  GripVertical,
  MessageSquare,
  Copy,
  Play,
  ChevronDown,
  ChevronRight,
  Folder,
  FileText,
  Zap,
  Target
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface ScenarioStep {
  id: string
  type: 'user' | 'expected' | 'assertion'
  content: string
  metadata?: {
    intent?: string
    emotion?: string
    expectedIntent?: string
    condition?: string
  }
}

interface Scenario {
  id: string
  name: string
  description: string
  category: string
  steps: ScenarioStep[]
  tags: string[]
  priority: 'critical' | 'high' | 'medium' | 'low'
}

const MOCK_SCENARIOS: Scenario[] = [
  {
    id: "s1",
    name: "Password Reset - Frustrated User",
    description: "User can't reset password after multiple attempts",
    category: "Authentication",
    priority: "critical",
    tags: ["auth", "frustration", "escalation"],
    steps: [
      { id: "1", type: "user", content: "I've tried resetting my password 5 times and it's not working!", metadata: { intent: "password_reset", emotion: "frustrated" } },
      { id: "2", type: "expected", content: "Acknowledge frustration, offer immediate assistance", metadata: { expectedIntent: "empathy_response" } },
      { id: "3", type: "assertion", content: "Response contains empathy phrase", metadata: { condition: "contains('understand', 'frustrating', 'sorry')" } },
      { id: "4", type: "user", content: "I need this fixed NOW, I have a meeting in 10 minutes", metadata: { intent: "urgent_request", emotion: "stressed" } },
      { id: "5", type: "expected", content: "Prioritize urgency, offer fastest resolution path", metadata: { expectedIntent: "expedited_support" } },
      { id: "6", type: "assertion", content: "Offers immediate solution or escalation", metadata: { condition: "latency < 1.5s AND contains('immediately', 'right now', 'let me')" } }
    ]
  },
  {
    id: "s2",
    name: "Billing Dispute - Missing Charge",
    description: "Customer disputes an unrecognized charge",
    category: "Billing",
    priority: "high",
    tags: ["billing", "dispute", "verification"],
    steps: [
      { id: "1", type: "user", content: "There's a charge on my account for $49.99 that I didn't make", metadata: { intent: "billing_dispute", emotion: "concerned" } },
      { id: "2", type: "expected", content: "Acknowledge concern, ask for verification", metadata: { expectedIntent: "verify_identity" } },
      { id: "3", type: "user", content: "My email is john@example.com and the last 4 of my card is 4242", metadata: { intent: "provide_info", emotion: "neutral" } },
      { id: "4", type: "assertion", content: "Does not expose full account details", metadata: { condition: "NOT contains(full_card_number, ssn, full_address)" } }
    ]
  },
  {
    id: "s3",
    name: "Technical Support - API Integration",
    description: "Developer needs help with API authentication",
    category: "Technical",
    priority: "medium",
    tags: ["api", "developer", "technical"],
    steps: [
      { id: "1", type: "user", content: "I'm getting a 401 error when calling your REST API with my bearer token", metadata: { intent: "technical_issue", emotion: "neutral" } },
      { id: "2", type: "expected", content: "Ask for technical details, offer debugging steps", metadata: { expectedIntent: "technical_support" } },
      { id: "3", type: "assertion", content: "Provides code example or documentation link", metadata: { condition: "contains('```', 'docs.', 'example')" } }
    ]
  }
]

const CATEGORIES = [
  { name: "Authentication", count: 12 },
  { name: "Billing", count: 8 },
  { name: "Technical", count: 15 },
  { name: "General Inquiry", count: 6 },
  { name: "Complaints", count: 9 },
  { name: "Edge Cases", count: 4 }
]

export function ScenarioBuilder() {
  const [scenarios] = useState<Scenario[]>(MOCK_SCENARIOS)
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(MOCK_SCENARIOS[0])
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["Authentication", "Billing", "Technical"])
  const [editingStep, setEditingStep] = useState<string | null>(null)

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const getPriorityVariant = (priority: string): "destructive" | "default" | "secondary" | "outline" => {
    switch (priority) {
      case 'critical': return 'destructive'
      case 'high': return 'default'
      default: return 'secondary'
    }
  }

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'user': return <MessageSquare className="w-3.5 h-3.5" />
      case 'expected': return <Target className="w-3.5 h-3.5" />
      case 'assertion': return <Zap className="w-3.5 h-3.5" />
      default: return null
    }
  }

  const getStepColor = (type: string) => {
    switch (type) {
      case 'user': return 'border-l-chart-1 bg-chart-1/5'
      case 'expected': return 'border-l-chart-2 bg-chart-2/5'
      case 'assertion': return 'border-l-chart-4 bg-chart-4/5'
      default: return 'border-l-border bg-secondary'
    }
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Folder className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Scenario Builder</span>
          <Badge variant="secondary" className="text-xs">{scenarios.length} scenarios</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5">
            <Copy className="w-3.5 h-3.5" />
            Duplicate
          </Button>
          <Button size="sm" className="h-7 text-xs gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            New Scenario
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Category Sidebar */}
        <Card className="w-64 border-0 border-r border-border flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-border shrink-0">
            <Input
              type="text"
              placeholder="Search scenarios..."
              className="h-7 text-xs"
            />
          </div>

          <ScrollArea className="flex-1 min-h-0">
            {CATEGORIES.map((category) => {
              const isExpanded = expandedCategories.includes(category.name)
              const categoryScenarios = scenarios.filter(s => s.category === category.name)
              
              return (
                <Collapsible key={category.name} open={isExpanded} onOpenChange={() => toggleCategory(category.name)}>
                  <CollapsibleTrigger className="w-full px-3 py-2 flex items-center justify-between hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                      <span className="text-xs">{category.name}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{category.count}</Badge>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    {categoryScenarios.map((scenario) => (
                      <button
                        key={scenario.id}
                        onClick={() => setSelectedScenario(scenario)}
                        className={`w-full pl-8 pr-3 py-2 text-left transition-colors ${
                          selectedScenario?.id === scenario.id
                            ? 'bg-secondary'
                            : 'hover:bg-secondary/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs truncate flex-1">{scenario.name}</span>
                        </div>
                        <div className="flex items-center gap-1 pl-5">
                          <Badge variant={getPriorityVariant(scenario.priority)} className="text-[9px] h-4">
                            {scenario.priority}
                          </Badge>
                          <span className="text-[9px] text-muted-foreground">
                            {scenario.steps.length} steps
                          </span>
                        </div>
                      </button>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
          </ScrollArea>
        </Card>

        {/* Scenario Editor */}
        {selectedScenario ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Scenario Header */}
            <div className="px-4 py-3 border-b border-border shrink-0">
              <div className="flex items-center justify-between mb-2">
                <Input
                  type="text"
                  value={selectedScenario.name}
                  className="text-sm font-medium bg-transparent border-none focus-visible:ring-0 h-auto p-0"
                  readOnly
                />
                <div className="flex items-center gap-2">
                  <Badge variant={getPriorityVariant(selectedScenario.priority)} className="text-[10px]">
                    {selectedScenario.priority}
                  </Badge>
                  <Button size="sm" className="h-7 text-xs gap-1.5">
                    <Play className="w-3.5 h-3.5" />
                    Run Test
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{selectedScenario.description}</p>
              <div className="flex items-center gap-1">
                {selectedScenario.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
                <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1.5">
                  + Add tag
                </Button>
              </div>
            </div>

            {/* Steps */}
            <ScrollArea className="flex-1 min-h-0 p-4">
              <div className="space-y-3">
                {selectedScenario.steps.map((step, index) => (
                  <Card
                    key={step.id}
                    className={`border-l-2 ${getStepColor(step.type)} p-3 group`}
                  >
                    <div className="flex items-start gap-2">
                      <button className="mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                        <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {String(index + 1).padStart(2, '0')}
                          </Badge>
                          <Badge 
                            variant="secondary"
                            className={`gap-1 text-[10px] ${
                              step.type === 'user' ? 'bg-chart-1/10 text-chart-1' :
                              step.type === 'expected' ? 'bg-chart-2/10 text-chart-2' :
                              'bg-chart-4/10 text-chart-4'
                            }`}
                          >
                            {getStepIcon(step.type)}
                            {step.type === 'user' ? 'User Input' : 
                             step.type === 'expected' ? 'Expected Behavior' : 'Assertion'}
                          </Badge>
                          {step.metadata?.intent && (
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {step.metadata.intent}
                            </Badge>
                          )}
                          {step.metadata?.emotion && (
                            <Badge variant="secondary" className="text-[10px]">
                              {step.metadata.emotion}
                            </Badge>
                          )}
                        </div>
                        
                        {editingStep === step.id ? (
                          <Textarea
                            value={step.content}
                            className="w-full text-xs resize-none"
                            rows={2}
                            onBlur={() => setEditingStep(null)}
                            autoFocus
                          />
                        ) : (
                          <p 
                            className="text-xs cursor-text hover:bg-secondary/50 p-1 -m-1 transition-colors"
                            onClick={() => setEditingStep(step.id)}
                          >
                            {step.content}
                          </p>
                        )}
                        
                        {step.metadata?.condition && (
                          <div className="mt-2 flex items-center gap-1.5">
                            <Zap className="w-3 h-3 text-chart-4" />
                            <Badge variant="secondary" className="text-[10px] font-mono bg-chart-4/10 text-chart-4">
                              {step.metadata.condition}
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive transition-colors" />
                      </Button>
                    </div>
                  </Card>
                ))}
                
                {/* Add Step */}
                <div className="flex items-center gap-2 pt-2">
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 border-dashed bg-transparent">
                    <Plus className="w-3.5 h-3.5" />
                    User Input
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 border-dashed bg-transparent">
                    <Plus className="w-3.5 h-3.5" />
                    Expected
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 border-dashed bg-transparent">
                    <Plus className="w-3.5 h-3.5" />
                    Assertion
                  </Button>
                </div>
              </div>
            </ScrollArea>

            {/* Scenario Stats */}
            <div className="border-t border-border px-4 py-2 flex items-center justify-between text-[10px] text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>{selectedScenario.steps.filter(s => s.type === 'user').length} user turns</span>
                <span>{selectedScenario.steps.filter(s => s.type === 'assertion').length} assertions</span>
              </div>
              <span>Last edited 2 hours ago</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Select a scenario to edit
          </div>
        )}
      </div>
    </div>
  )
}
