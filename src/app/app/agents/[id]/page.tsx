"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import {
  ArrowLeft,
  Bot,
  Cpu,
  Mic,
  RefreshCw,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Globe,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  useExternalAgentWithPrompt,
  useLiveAgentData,
  useSyncExternalAgent,
  useUpdateExternalAgentPrompt,
} from "@/hooks/use-external-agents"

export default function AgentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const userId = user?.id ?? ""
  const agentId = params.id as string

  const { data: agent, isLoading: isLoadingAgent } = useExternalAgentWithPrompt(
    agentId,
    userId
  )
  const { data: liveData, isLoading: isLoadingLive } = useLiveAgentData(
    agentId,
    userId
  )
  const syncAgent = useSyncExternalAgent()
  const updatePrompt = useUpdateExternalAgentPrompt()

  const [editedPrompt, setEditedPrompt] = useState("")
  const [hasChanges, setHasChanges] = useState(false)

  // Initialize edited prompt when agent loads
  useEffect(() => {
    if (agent?.promptContent) {
      setEditedPrompt(agent.promptContent)
    }
  }, [agent?.promptContent])

  // Track changes
  useEffect(() => {
    if (agent?.promptContent) {
      setHasChanges(editedPrompt !== agent.promptContent)
    }
  }, [editedPrompt, agent?.promptContent])

  const handleSave = async () => {
    if (!agentId || !userId || !hasChanges) return

    await updatePrompt.mutateAsync({
      agentId,
      userId,
      newPrompt: editedPrompt,
    })
  }

  const handleSync = async () => {
    if (!agentId || !userId) return
    await syncAgent.mutateAsync({ agentId, userId })
  }

  if (isLoadingAgent) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-lg font-medium mb-2">Agent Not Found</h2>
            <p className="text-sm text-muted-foreground mb-4">
              The requested agent could not be found.
            </p>
            <Link href="/app">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/app">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-xl font-medium">{agent.agentName}</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Manage your Dapta agent configuration
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncAgent.isPending}
              className="gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${syncAgent.isPending ? "animate-spin" : ""}`}
              />
              Sync from Dapta
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || updatePrompt.isPending}
              className="gap-2"
            >
              {updatePrompt.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save to Dapta
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Agent Info */}
          <div className="space-y-4">
            {/* Agent Details */}
            <Card>
              <CardHeader className="px-4 py-3 border-b border-border">
                <h2 className="text-sm font-medium">Agent Details</h2>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">
                    Dapta Agent ID
                  </span>
                  <code className="text-xs font-mono bg-secondary px-2 py-1 rounded">
                    {agent.daptaAgentId.slice(0, 20)}...
                  </code>
                </div>

                {(liveData?.model || agent.llmModel) && (
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-xs text-muted-foreground block">
                        LLM Model
                      </span>
                      <span className="text-sm font-medium">
                        {liveData?.model || agent.llmModel}
                      </span>
                    </div>
                  </div>
                )}

                {(liveData?.voiceId || agent.voiceId) && (
                  <div className="flex items-center gap-2">
                    <Mic className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-xs text-muted-foreground block">
                        Voice
                      </span>
                      <span className="text-sm font-mono truncate block max-w-[180px]">
                        {(liveData?.voiceId || agent.voiceId)?.slice(0, 25)}...
                      </span>
                    </div>
                  </div>
                )}

                {liveData?.voiceLanguage && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-xs text-muted-foreground block">
                        Language
                      </span>
                      <span className="text-sm">{liveData.voiceLanguage}</span>
                    </div>
                  </div>
                )}

                {agent.lastSyncedAt && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-xs text-muted-foreground block">
                        Last Synced
                      </span>
                      <span className="text-sm">
                        {new Date(agent.lastSyncedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {hasChanges ? (
                    <Badge variant="outline" className="gap-1 text-amber-500">
                      <AlertCircle className="h-3 w-3" />
                      Unsaved changes
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-green-500">
                      <CheckCircle className="h-3 w-3" />
                      Synced
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Input Variables */}
            {liveData?.inputVariables && liveData.inputVariables.length > 0 && (
              <Card>
                <CardHeader className="px-4 py-3 border-b border-border">
                  <h2 className="text-sm font-medium">Input Variables</h2>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {liveData.inputVariables.map((v) => (
                      <Badge
                        key={v.key}
                        variant="secondary"
                        className="font-mono text-xs"
                      >
                        {`{{${v.key}}}`}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right - Prompt Editor */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="px-4 py-3 border-b border-border flex flex-row items-center justify-between">
                <h2 className="text-sm font-medium">System Prompt</h2>
                <span className="text-xs text-muted-foreground">
                  {editedPrompt.length.toLocaleString()} characters
                </span>
              </CardHeader>
              <CardContent className="p-4">
                <Textarea
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                  className="min-h-[500px] font-mono text-sm resize-none"
                  placeholder="Enter your system prompt..."
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
