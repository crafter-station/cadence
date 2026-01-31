"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import {
  Play,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Bot,
  Cpu,
  Variable,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  createOrUpdateExternalAgentAction,
  type SyncedAgentData,
} from "@/actions/external-agent.actions"

interface AgentParams {
  daptaAgentId: string
  retellAgentId?: string
  llmId?: string
  apiKey: string
  agentName: string
}

function StressTestContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, isLoaded } = useUser()

  const [agentParams, setAgentParams] = useState<AgentParams | null>(null)
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle")
  const [error, setError] = useState<string | null>(null)
  const [syncedData, setSyncedData] = useState<SyncedAgentData | null>(null)

  // Parse URL params
  useEffect(() => {
    const daptaAgentId = searchParams.get("daptaAgentId")
    const apiKey = searchParams.get("apiKey")
    const agentName = searchParams.get("agentName")

    if (daptaAgentId && apiKey && agentName) {
      setAgentParams({
        daptaAgentId,
        retellAgentId: searchParams.get("retellAgentId") ?? undefined,
        llmId: searchParams.get("llmId") ?? undefined,
        apiKey,
        agentName: decodeURIComponent(agentName),
      })
    }
  }, [searchParams])

  // Register agent when user is loaded and params are available
  useEffect(() => {
    if (!isLoaded || !user?.id || !agentParams || status !== "idle") return

    const registerAgent = async () => {
      setStatus("loading")
      setError(null)

      const result = await createOrUpdateExternalAgentAction({
        userId: user.id,
        ...agentParams,
      })

      if (result.success && result.data) {
        setSyncedData(result.data)
        setStatus("ready")
      } else {
        setError(result.error ?? "Failed to register agent")
        setStatus("error")
      }
    }

    registerAgent()
  }, [isLoaded, user?.id, agentParams, status])

  const handleRefresh = async () => {
    if (!user?.id || !agentParams) return

    setStatus("loading")
    setError(null)

    const result = await createOrUpdateExternalAgentAction({
      userId: user.id,
      ...agentParams,
    })

    if (result.success && result.data) {
      setSyncedData(result.data)
      setStatus("ready")
    } else {
      setError(result.error ?? "Failed to sync agent")
      setStatus("error")
    }
  }

  const handleStartTest = () => {
    if (!syncedData) return
    router.push(`/app?agentId=${syncedData.agentId}&promptId=${syncedData.promptId}`)
  }

  if (!isLoaded) {
    return (
      <div className="h-[calc(100vh-57px)] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="h-[calc(100vh-57px)] flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-medium mb-2">Sign In Required</h2>
            <p className="text-sm text-muted-foreground">
              Please sign in to run stress tests on your agent.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!agentParams) {
    return (
      <div className="h-[calc(100vh-57px)] flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-lg font-medium mb-2">Missing Parameters</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Required URL parameters are missing. Please access this page from your agent platform.
            </p>
            <div className="text-xs text-muted-foreground font-mono bg-secondary p-3 rounded text-left">
              Required params:<br />
              - daptaAgentId<br />
              - apiKey<br />
              - agentName
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-57px)] overflow-auto">
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-xl font-medium tracking-tight text-foreground mb-1">
            Agent Stress Test
          </h1>
          <p className="text-muted-foreground text-sm">
            Run parallel stress tests on your external agent
          </p>
        </div>

        {/* Agent Details Card */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {syncedData?.agentName ?? agentParams.agentName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {status === "loading" && (
                  <Badge variant="secondary" className="gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Syncing...
                  </Badge>
                )}
                {status === "ready" && (
                  <>
                    <Badge variant="default" className="gap-1 bg-chart-2 text-white">
                      <CheckCircle className="h-3 w-3" />
                      Synced
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleRefresh}
                      title="Refresh agent data"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </>
                )}
                {status === "error" && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Error
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* IDs Grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground text-xs">Dapta Agent ID</span>
                <p className="font-mono text-xs truncate">{agentParams.daptaAgentId}</p>
              </div>
              {(syncedData?.voiceId || agentParams.retellAgentId) && (
                <div>
                  <span className="text-muted-foreground text-xs">Retell Agent ID</span>
                  <p className="font-mono text-xs truncate">
                    {agentParams.retellAgentId ?? "—"}
                  </p>
                </div>
              )}
              {(syncedData?.llmModel || agentParams.llmId) && (
                <div>
                  <span className="text-muted-foreground text-xs">LLM Model</span>
                  <p className="font-mono text-xs">
                    {syncedData?.llmModel ?? agentParams.llmId ?? "—"}
                  </p>
                </div>
              )}
              {syncedData?.voiceId && (
                <div>
                  <span className="text-muted-foreground text-xs">Voice ID</span>
                  <p className="font-mono text-xs truncate">{syncedData.voiceId}</p>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 rounded bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Prompt Card */}
        {syncedData?.systemPrompt && (
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">System Prompt</span>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground">
                  {syncedData.systemPrompt}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Input Variables Card */}
        {syncedData?.inputVariables && syncedData.inputVariables.length > 0 && (
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Variable className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">Input Variables</span>
                <Badge variant="secondary" className="text-xs">
                  {syncedData.inputVariables.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {syncedData.inputVariables.map((v) => (
                  <Badge key={v.key} variant="outline" className="font-mono text-xs">
                    {v.key}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Start Test CTA */}
        {status === "ready" && syncedData && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Your agent is synced and ready for stress testing with{" "}
                  {syncedData.inputVariables?.length ?? 0} input variables.
                </p>
                <Button size="lg" onClick={handleStartTest}>
                  <Play className="h-4 w-4 mr-2" />
                  Start Stress Test
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function StressTestPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100vh-57px)] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <StressTestContent />
    </Suspense>
  )
}
