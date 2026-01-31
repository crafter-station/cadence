"use client"

import { useState, useEffect, useRef } from "react"
import { 
  Terminal,
  Play,
  Pause,
  Trash2,
  Download,
  Filter,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  AlertTriangle,
  Info,
  Bug,
  Clock,
  Zap,
  Database,
  MessageSquare,
  Cpu,
  DollarSign
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

type LogLevel = 'debug' | 'info' | 'warn' | 'error'
type LogCategory = 'system' | 'api' | 'model' | 'latency' | 'token' | 'conversation'

interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  category: LogCategory
  message: string
  details?: Record<string, unknown>
  duration?: number
}

const generateMockLogs = (): LogEntry[] => {
  const logs: LogEntry[] = [
    {
      id: "1",
      timestamp: "14:32:45.123",
      level: "info",
      category: "system",
      message: "Test session initiated",
      details: { sessionId: "sess_abc123", personalities: ["Assertive", "Confused"], concurrency: 25 }
    },
    {
      id: "2",
      timestamp: "14:32:45.456",
      level: "debug",
      category: "model",
      message: "Loading prompt version v1.4.0",
      details: { promptLength: 2847, version: "v1.4.0" }
    },
    {
      id: "3",
      timestamp: "14:32:45.789",
      level: "info",
      category: "api",
      message: "API connection established",
      details: { endpoint: "wss://agent.api.internal", protocol: "WebSocket" }
    },
    {
      id: "4",
      timestamp: "14:32:46.012",
      level: "info",
      category: "conversation",
      message: "[Assertive-001] User: I need this fixed immediately",
      details: { turnId: 1, intent: "urgent_request", confidence: 0.94 }
    },
    {
      id: "5",
      timestamp: "14:32:46.234",
      level: "debug",
      category: "token",
      message: "Token usage for turn 1",
      details: { inputTokens: 847, outputTokens: 124, totalTokens: 971, cost: 0.00194 }
    },
    {
      id: "6",
      timestamp: "14:32:46.456",
      level: "info",
      category: "latency",
      message: "Response generated",
      duration: 1823,
      details: { ttfb: 234, processing: 1589 }
    },
    {
      id: "7",
      timestamp: "14:32:46.678",
      level: "warn",
      category: "latency",
      message: "Latency threshold exceeded",
      duration: 2341,
      details: { threshold: 2000, actual: 2341, personality: "Assertive" }
    },
    {
      id: "8",
      timestamp: "14:32:47.012",
      level: "info",
      category: "conversation",
      message: "[Confused-001] User: I don't understand what you mean",
      details: { turnId: 1, intent: "clarification_needed", confidence: 0.87 }
    },
    {
      id: "9",
      timestamp: "14:32:47.234",
      level: "error",
      category: "model",
      message: "Intent classification failed",
      details: { error: "Ambiguous input", fallback: "general_query", originalIntent: null }
    },
    {
      id: "10",
      timestamp: "14:32:47.456",
      level: "debug",
      category: "token",
      message: "Token usage for turn 1",
      details: { inputTokens: 892, outputTokens: 156, totalTokens: 1048, cost: 0.00209 }
    },
    {
      id: "11",
      timestamp: "14:32:48.012",
      level: "info",
      category: "conversation",
      message: "[Assertive-001] Agent: I understand the urgency. Let me help you right away.",
      details: { turnId: 2, responseType: "empathy_urgent" }
    },
    {
      id: "12",
      timestamp: "14:32:48.234",
      level: "info",
      category: "latency",
      message: "Response generated",
      duration: 1456,
      details: { ttfb: 187, processing: 1269 }
    }
  ]
  return logs
}

export function DebugConsole() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isLive, setIsLive] = useState(true)
  const [filter, setFilter] = useState<LogLevel | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<LogCategory | 'all'>('all')
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLogs(generateMockLogs())
  }, [])

  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(() => {
      const newLog: LogEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toTimeString().split(' ')[0] + '.' + String(Date.now() % 1000).padStart(3, '0'),
        level: ['debug', 'info', 'info', 'info', 'warn', 'error'][Math.floor(Math.random() * 6)] as LogLevel,
        category: ['system', 'api', 'model', 'latency', 'token', 'conversation'][Math.floor(Math.random() * 6)] as LogCategory,
        message: [
          "Processing user input",
          "Model inference complete",
          "Token count updated",
          "Response streamed to client",
          "Latency measurement recorded",
          "Intent classified successfully"
        ][Math.floor(Math.random() * 6)],
        duration: Math.random() > 0.5 ? Math.floor(Math.random() * 2000) + 500 : undefined,
        details: { randomId: Math.random().toString(36).substr(2, 9) }
      }
      setLogs(prev => [...prev.slice(-200), newLog])
    }, 1500)

    return () => clearInterval(interval)
  }, [isLive])

  useEffect(() => {
    if (isLive) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, isLive])

  const toggleExpand = (id: string) => {
    setExpandedLogs(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case 'debug': return <Bug className="w-3 h-3" />
      case 'info': return <Info className="w-3 h-3" />
      case 'warn': return <AlertTriangle className="w-3 h-3" />
      case 'error': return <AlertCircle className="w-3 h-3" />
    }
  }

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'debug': return 'text-muted-foreground'
      case 'info': return 'text-chart-1'
      case 'warn': return 'text-chart-5'
      case 'error': return 'text-chart-3'
    }
  }

  const getCategoryIcon = (category: LogCategory) => {
    switch (category) {
      case 'system': return <Cpu className="w-3 h-3" />
      case 'api': return <Database className="w-3 h-3" />
      case 'model': return <Zap className="w-3 h-3" />
      case 'latency': return <Clock className="w-3 h-3" />
      case 'token': return <DollarSign className="w-3 h-3" />
      case 'conversation': return <MessageSquare className="w-3 h-3" />
    }
  }

  const filteredLogs = logs.filter(log => {
    if (filter !== 'all' && log.level !== filter) return false
    if (categoryFilter !== 'all' && log.category !== categoryFilter) return false
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const logCounts = {
    debug: logs.filter(l => l.level === 'debug').length,
    info: logs.filter(l => l.level === 'info').length,
    warn: logs.filter(l => l.level === 'warn').length,
    error: logs.filter(l => l.level === 'error').length
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Debug Console</span>
          <Badge 
            variant={isLive ? 'default' : 'secondary'}
            className={isLive ? 'bg-chart-2/10 text-chart-2 border-chart-2/30 gap-1' : ''}
          >
            {isLive && <span className="w-1.5 h-1.5 bg-chart-2 animate-pulse" />}
            {isLive ? "Live" : "Paused"}
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
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-xs gap-1.5"
            onClick={() => setLogs([])}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5">
            <Download className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-border px-4 py-2 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <div className="flex items-center gap-1">
            {(['all', 'debug', 'info', 'warn', 'error'] as const).map((level) => (
              <Button
                key={level}
                variant={filter === level ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setFilter(level)}
                className="h-6 text-[10px] px-1.5 gap-1"
              >
                {level !== 'all' && <span className={getLevelColor(level)}>{getLevelIcon(level)}</span>}
                {level.charAt(0).toUpperCase() + level.slice(1)}
                {level !== 'all' && <Badge variant="outline" className="text-[9px] h-4 px-1">{logCounts[level]}</Badge>}
              </Button>
            ))}
          </div>
        </div>

        <Separator orientation="vertical" className="h-4" />

        <div className="flex items-center gap-1">
          {(['all', 'conversation', 'model', 'latency', 'token', 'api', 'system'] as const).map((cat) => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setCategoryFilter(cat)}
              className="h-6 text-[10px] px-1.5 gap-1"
            >
              {cat !== 'all' && getCategoryIcon(cat)}
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Button>
          ))}
        </div>

        <div className="flex-1" />

        <Input
          type="text"
          placeholder="Search logs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-48 h-7 text-xs"
        />
      </div>

      {/* Logs */}
      <ScrollArea className="flex-1 font-mono text-xs">
        {filteredLogs.map((log) => {
          const isExpanded = expandedLogs.has(log.id)
          
          return (
            <div
              key={log.id}
              className={`border-b border-border/50 hover:bg-secondary/30 transition-colors ${
                log.level === 'error' ? 'bg-chart-3/5' :
                log.level === 'warn' ? 'bg-chart-5/5' : ''
              }`}
            >
              <button
                onClick={() => log.details && toggleExpand(log.id)}
                className="w-full text-left px-4 py-2 flex items-start gap-3"
              >
                {log.details ? (
                  isExpanded ? (
                    <ChevronDown className="w-3 h-3 mt-0.5 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="w-3 h-3 mt-0.5 text-muted-foreground shrink-0" />
                  )
                ) : (
                  <span className="w-3 shrink-0" />
                )}
                
                <span className="text-muted-foreground shrink-0 w-24">{log.timestamp}</span>
                
                <span className={`shrink-0 w-5 ${getLevelColor(log.level)}`}>
                  {getLevelIcon(log.level)}
                </span>
                
                <span className="shrink-0 w-5 text-muted-foreground">
                  {getCategoryIcon(log.category)}
                </span>
                
                <span className="flex-1 break-all">{log.message}</span>
                
                {log.duration !== undefined && (
                  <Badge 
                    variant="outline" 
                    className={`shrink-0 font-mono ${log.duration > 2000 ? 'text-chart-3 border-chart-3/30' : log.duration > 1500 ? 'text-chart-5 border-chart-5/30' : 'text-muted-foreground'}`}
                  >
                    {log.duration}ms
                  </Badge>
                )}
              </button>
              
              {isExpanded && log.details && (
                <div className="px-4 pb-3 pl-16">
                  <Card className="p-2 bg-secondary overflow-x-auto">
                    <pre className="text-[10px] text-muted-foreground">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </Card>
                </div>
              )}
            </div>
          )
        })}
        <div ref={logsEndRef} />
      </ScrollArea>

      {/* Status Bar */}
      <div className="border-t border-border px-4 py-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>{filteredLogs.length} entries</span>
          <Badge variant="outline" className="text-chart-3 border-chart-3/30">{logCounts.error} errors</Badge>
          <Badge variant="outline" className="text-chart-5 border-chart-5/30">{logCounts.warn} warnings</Badge>
        </div>
        <span>Buffer: {logs.length}/200</span>
      </div>
    </div>
  )
}
