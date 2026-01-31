"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  GitBranch, 
  History, 
  Save, 
  RotateCcw, 
  Plus,
  Check,
  Copy,
  ChevronDown,
  FileText,
  Tag
} from "lucide-react"

interface PromptVersion {
  id: string
  version: string
  timestamp: string
  author: string
  content: string
  description: string
  metrics?: {
    accuracy: number
    latency: number
    tests: number
  }
}

const MOCK_VERSIONS: PromptVersion[] = [
  {
    id: "v4",
    version: "v1.4.0",
    timestamp: "2 hours ago",
    author: "sarah.chen",
    description: "Added empathy patterns for emotional users",
    content: `You are a helpful customer service agent for TechCorp.

PERSONALITY:
- Professional yet warm and empathetic
- Patient with confused or frustrated users
- Proactive in offering solutions

GUIDELINES:
1. Always acknowledge the customer's feelings first
2. Use simple, clear language
3. Offer step-by-step guidance when needed
4. Escalate to human agent if confidence < 70%

CONSTRAINTS:
- Never share internal pricing or policies
- Maximum 3 clarifying questions per turn
- Response time target: < 2 seconds

EMOTIONAL HANDLING:
- Detect frustration signals and adjust tone
- Use validating phrases: "I understand...", "That's frustrating..."
- Offer expedited resolution for distressed customers`,
    metrics: { accuracy: 94.2, latency: 1.8, tests: 2500 }
  },
  {
    id: "v3",
    version: "v1.3.0",
    timestamp: "1 day ago",
    author: "marcus.kim",
    description: "Improved technical explanation clarity",
    content: `You are a helpful customer service agent for TechCorp.

PERSONALITY:
- Professional yet warm
- Patient with confused users
- Proactive in offering solutions

GUIDELINES:
1. Use simple, clear language
2. Offer step-by-step guidance when needed
3. Escalate to human agent if confidence < 70%

CONSTRAINTS:
- Never share internal pricing or policies
- Maximum 3 clarifying questions per turn
- Response time target: < 2 seconds`,
    metrics: { accuracy: 89.7, latency: 2.1, tests: 1800 }
  },
  {
    id: "v2",
    version: "v1.2.0",
    timestamp: "3 days ago",
    author: "sarah.chen",
    description: "Added escalation rules",
    content: `You are a customer service agent for TechCorp.

GUIDELINES:
1. Be helpful and professional
2. Use clear language
3. Escalate when unsure

CONSTRAINTS:
- Don't share internal information
- Keep responses concise`,
    metrics: { accuracy: 82.3, latency: 2.4, tests: 1200 }
  },
  {
    id: "v1",
    version: "v1.1.0",
    timestamp: "1 week ago",
    author: "alex.wu",
    description: "Initial production prompt",
    content: `You are a customer service agent. Be helpful and professional.`,
    metrics: { accuracy: 71.5, latency: 1.9, tests: 500 }
  }
]

export function PromptEditor() {
  const [versions] = useState<PromptVersion[]>(MOCK_VERSIONS)
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion>(MOCK_VERSIONS[0])
  const [compareVersion, setCompareVersion] = useState<PromptVersion | null>(MOCK_VERSIONS[1])
  const [editedContent, setEditedContent] = useState(MOCK_VERSIONS[0].content)
  const [showVersions, setShowVersions] = useState(true)
  const [copied, setCopied] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const handleContentChange = (value: string) => {
    setEditedContent(value)
    setHasChanges(value !== selectedVersion.content)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(editedContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const selectVersion = (version: PromptVersion) => {
    setSelectedVersion(version)
    setEditedContent(version.content)
    setHasChanges(false)
  }

  const getDiff = () => {
    if (!compareVersion) return null
    
    const oldLines = compareVersion.content.split('\n')
    const newLines = selectedVersion.content.split('\n')
    
    const diff: { type: 'same' | 'added' | 'removed', line: string }[] = []
    
    const maxLen = Math.max(oldLines.length, newLines.length)
    for (let i = 0; i < maxLen; i++) {
      const oldLine = oldLines[i]
      const newLine = newLines[i]
      
      if (oldLine === newLine) {
        if (oldLine !== undefined) diff.push({ type: 'same', line: oldLine })
      } else {
        if (oldLine !== undefined && !newLines.includes(oldLine)) {
          diff.push({ type: 'removed', line: oldLine })
        }
        if (newLine !== undefined && !oldLines.includes(newLine)) {
          diff.push({ type: 'added', line: newLine })
        }
      }
    }
    
    return diff
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Toolbar */}
      <div className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">System Prompt</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowVersions(!showVersions)}
            className="gap-1.5 text-xs text-muted-foreground"
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>{selectedVersion.version}</span>
            <ChevronDown className="w-3 h-3" />
          </Button>
          {hasChanges && (
            <Badge variant="outline" className="text-chart-3 border-chart-3/30 gap-1">
              <span className="w-1.5 h-1.5 bg-chart-3" />
              Unsaved changes
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={handleCopy}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" disabled={!hasChanges}>
            <RotateCcw className="w-3.5 h-3.5" />
            Revert
          </Button>
          <Button size="sm" className="h-7 text-xs gap-1.5" disabled={!hasChanges}>
            <Save className="w-3.5 h-3.5" />
            Save Version
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Version Sidebar */}
        {showVersions && (
          <Card className="w-72 border-0 border-r border-border flex flex-col">
            <div className="px-3 py-2 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <History className="w-3.5 h-3.5" />
                <span>Version History</span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
            
            <ScrollArea className="flex-1">
              {versions.map((version) => (
                <div
                  key={version.id}
                  onClick={() => selectVersion(version)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      selectVersion(version)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={`w-full text-left px-3 py-3 border-b border-border transition-colors cursor-pointer ${
                    selectedVersion.id === version.id
                      ? 'bg-secondary'
                      : 'hover:bg-secondary/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3 h-3 text-muted-foreground" />
                      <Badge variant="outline" className="text-xs font-mono">{version.version}</Badge>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{version.timestamp}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mb-2">
                    {version.description}
                  </p>
                  {version.metrics && (
                    <div className="flex items-center gap-3 text-[10px]">
                      <Badge variant="secondary" className="text-chart-2">{version.metrics.accuracy}% acc</Badge>
                      <Badge variant="secondary" className="text-chart-1">{version.metrics.latency}s lat</Badge>
                      <span className="text-muted-foreground">{version.metrics.tests} tests</span>
                    </div>
                  )}

                  {/* Compare checkbox */}
                  <div
                    className="mt-2 flex items-center gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={compareVersion?.id === version.id}
                      onCheckedChange={(checked) => {
                        setCompareVersion(checked ? version : null)
                      }}
                      disabled={selectedVersion.id === version.id}
                      className="w-3 h-3"
                    />
                    <span className="text-[10px] text-muted-foreground">Compare</span>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </Card>
        )}

        {/* Editor Area */}
        <div className="flex-1 flex flex-col">
          {compareVersion && compareVersion.id !== selectedVersion.id ? (
            // Diff View
            <div className="flex-1 flex">
              <div className="flex-1 border-r border-border flex flex-col">
                <div className="px-3 py-2 border-b border-border bg-destructive/5">
                  <Badge variant="outline" className="text-xs font-mono text-muted-foreground">
                    {compareVersion.version} (base)
                  </Badge>
                </div>
                <ScrollArea className="flex-1 p-4 font-mono text-xs leading-relaxed">
                  {getDiff()?.map((line, i) => (
                    <div
                      key={i}
                      className={`px-2 -mx-2 ${
                        line.type === 'removed' 
                          ? 'bg-destructive/10 text-destructive' 
                          : line.type === 'added'
                          ? 'opacity-30'
                          : ''
                      }`}
                    >
                      <span className="select-none text-muted-foreground w-6 inline-block">
                        {line.type === 'removed' ? '-' : ' '}
                      </span>
                      {line.line || ' '}
                    </div>
                  ))}
                </ScrollArea>
              </div>
              <div className="flex-1 flex flex-col">
                <div className="px-3 py-2 border-b border-border bg-chart-2/5">
                  <Badge variant="outline" className="text-xs font-mono text-muted-foreground">
                    {selectedVersion.version} (current)
                  </Badge>
                </div>
                <ScrollArea className="flex-1 p-4 font-mono text-xs leading-relaxed">
                  {getDiff()?.map((line, i) => (
                    <div
                      key={i}
                      className={`px-2 -mx-2 ${
                        line.type === 'added' 
                          ? 'bg-chart-2/10 text-chart-2' 
                          : line.type === 'removed'
                          ? 'opacity-30'
                          : ''
                      }`}
                    >
                      <span className="select-none text-muted-foreground w-6 inline-block">
                        {line.type === 'added' ? '+' : ' '}
                      </span>
                      {line.line || ' '}
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </div>
          ) : (
            // Editor View
            <div className="flex-1 flex flex-col">
              <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                <Badge variant="outline" className="text-xs font-mono text-muted-foreground">
                  {selectedVersion.version} — {selectedVersion.description}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {editedContent.length} chars · {editedContent.split('\n').length} lines
                </span>
              </div>
              <Textarea
                value={editedContent}
                onChange={(e) => handleContentChange(e.target.value)}
                className="flex-1 w-full p-4 bg-transparent resize-none font-mono text-xs leading-relaxed focus-visible:ring-0 border-0"
                spellCheck={false}
              />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Status */}
      <div className="border-t border-border px-4 py-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Last saved by {selectedVersion.author}</span>
          <span>{selectedVersion.timestamp}</span>
        </div>
        {selectedVersion.metrics && (
          <div className="flex items-center gap-4">
            <span>Tested on {selectedVersion.metrics.tests.toLocaleString()} conversations</span>
            <Badge variant="secondary" className="text-chart-2 text-[10px]">{selectedVersion.metrics.accuracy}% accuracy</Badge>
          </div>
        )}
      </div>
    </div>
  )
}
