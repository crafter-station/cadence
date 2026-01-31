"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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
  Tag,
  Trash2,
  MoreVertical,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  usePromptsGrouped,
  usePromptVersions,
  useCreatePrompt,
  useCreatePromptVersion,
  useDeletePrompt,
} from "@/hooks/use-prompts"
import type { PromptSelect } from "@/db/schema"

export function PromptEditor() {
  const { user } = useUser()
  const userId = user?.id ?? ""

  const { data: promptGroups, isLoading } = usePromptsGrouped(userId)
  const createPrompt = useCreatePrompt()
  const createVersion = useCreatePromptVersion()
  const deletePrompt = useDeletePrompt()

  const [selectedPromptName, setSelectedPromptName] = useState<string | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<PromptSelect | null>(null)
  const [compareVersion, setCompareVersion] = useState<PromptSelect | null>(null)
  const [editedContent, setEditedContent] = useState("")
  const [showVersions, setShowVersions] = useState(true)
  const [copied, setCopied] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [showNewPromptDialog, setShowNewPromptDialog] = useState(false)
  const [newPromptName, setNewPromptName] = useState("")
  const [newPromptContent, setNewPromptContent] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Get versions for selected prompt
  const { data: versions } = usePromptVersions(userId, selectedPromptName)

  // Auto-select first prompt group
  useEffect(() => {
    if (promptGroups && promptGroups.length > 0 && !selectedPromptName) {
      setSelectedPromptName(promptGroups[0].name)
    }
  }, [promptGroups, selectedPromptName])

  // Auto-select latest version when prompt changes
  useEffect(() => {
    if (versions && versions.length > 0) {
      const latest = versions[0]
      setSelectedVersion(latest)
      setEditedContent(latest.content)
      setHasChanges(false)
      // Auto-compare with previous version if exists
      if (versions.length > 1) {
        setCompareVersion(versions[1])
      } else {
        setCompareVersion(null)
      }
    }
  }, [versions])

  const handleContentChange = (value: string) => {
    setEditedContent(value)
    setHasChanges(value !== selectedVersion?.content)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(editedContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const selectVersion = (version: PromptSelect) => {
    setSelectedVersion(version)
    setEditedContent(version.content)
    setHasChanges(false)
  }

  const handleSaveVersion = async () => {
    if (!selectedVersion || !hasChanges || !userId) return

    setIsSaving(true)
    try {
      await createVersion.mutateAsync({
        userId,
        parentId: selectedVersion.id,
        content: editedContent,
      })
      setHasChanges(false)
    } catch (error) {
      console.error("Failed to save version:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRevert = () => {
    if (selectedVersion) {
      setEditedContent(selectedVersion.content)
      setHasChanges(false)
    }
  }

  const handleCreatePrompt = async () => {
    if (!newPromptName.trim() || !userId) return

    try {
      const result = await createPrompt.mutateAsync({
        userId,
        name: newPromptName.trim(),
        content: newPromptContent || "You are a helpful assistant.",
      })
      if (result.success) {
        setShowNewPromptDialog(false)
        setNewPromptName("")
        setNewPromptContent("")
        setSelectedPromptName(newPromptName.trim())
      }
    } catch (error) {
      console.error("Failed to create prompt:", error)
    }
  }

  const handleDeletePrompt = async (promptId: string) => {
    if (!userId) return
    await deletePrompt.mutateAsync({ promptId, userId })
  }

  const getDiff = () => {
    if (!compareVersion || !selectedVersion) return null

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

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (hours < 1) return "Just now"
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return new Date(date).toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Loading prompts...
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Toolbar */}
      <div className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Prompts</span>
          </div>
          <Separator orientation="vertical" className="h-4" />

          {/* Prompt Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                <span>{selectedPromptName ?? "Select prompt"}</span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {promptGroups?.map((group) => (
                <DropdownMenuItem
                  key={group.name}
                  onClick={() => setSelectedPromptName(group.name)}
                  className="flex items-center justify-between"
                >
                  <span className="truncate">{group.name}</span>
                  <Badge variant="outline" className="text-xs font-mono ml-2">
                    v{group.latestVersion.version}
                  </Badge>
                </DropdownMenuItem>
              ))}
              {promptGroups?.length === 0 && (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No prompts yet
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-4" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowVersions(!showVersions)}
            className="gap-1.5 text-xs text-muted-foreground"
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>v{selectedVersion?.version ?? "?"}</span>
            <ChevronDown className="w-3 h-3" />
          </Button>

          {hasChanges && (
            <Badge variant="outline" className="text-chart-3 border-chart-3/30 gap-1">
              <span className="w-1.5 h-1.5 bg-chart-3 rounded-full" />
              Unsaved changes
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => setShowNewPromptDialog(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            New Prompt
          </Button>
          <Separator orientation="vertical" className="h-4" />
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={handleCopy}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5"
            disabled={!hasChanges}
            onClick={handleRevert}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Revert
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs gap-1.5"
            disabled={!hasChanges || isSaving}
            onClick={handleSaveVersion}
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? "Saving..." : "Save Version"}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Version Sidebar */}
        {showVersions && (
          <Card className="w-72 border-0 border-r border-border flex flex-col overflow-hidden rounded-none">
            <div className="px-3 py-2 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <History className="w-3.5 h-3.5" />
                <span>Version History</span>
              </div>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              {versions?.map((version) => (
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
                    selectedVersion?.id === version.id
                      ? 'bg-secondary'
                      : 'hover:bg-secondary/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3 h-3 text-muted-foreground" />
                      <Badge variant="outline" className="text-xs font-mono">v{version.version}</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(version.createdAt)}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-5 w-5">
                            <MoreVertical className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeletePrompt(version.id)
                            }}
                          >
                            <Trash2 className="w-3 h-3 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Metrics */}
                  {(version.avgAccuracy != null || version.totalRuns > 0) && (
                    <div className="flex items-center gap-2 text-[10px] mb-2">
                      {version.avgAccuracy != null && (
                        <Badge variant="secondary" className="text-chart-2">
                          {version.avgAccuracy.toFixed(1)}% acc
                        </Badge>
                      )}
                      {version.avgLatency != null && (
                        <Badge variant="secondary" className="text-chart-1">
                          {(version.avgLatency / 1000).toFixed(1)}s
                        </Badge>
                      )}
                      {version.totalRuns > 0 && (
                        <span className="text-muted-foreground">
                          {version.totalRuns} runs
                        </span>
                      )}
                    </div>
                  )}

                  {/* Compare checkbox */}
                  <div
                    className="flex items-center gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={compareVersion?.id === version.id}
                      onCheckedChange={(checked) => {
                        setCompareVersion(checked ? version : null)
                      }}
                      disabled={selectedVersion?.id === version.id}
                      className="w-3 h-3"
                    />
                    <span className="text-[10px] text-muted-foreground">Compare</span>
                  </div>
                </div>
              ))}

              {versions?.length === 0 && (
                <div className="px-3 py-8 text-center text-xs text-muted-foreground">
                  No versions yet
                </div>
              )}
            </ScrollArea>
          </Card>
        )}

        {/* Editor Area */}
        <div className="flex-1 flex flex-col">
          {compareVersion && compareVersion.id !== selectedVersion?.id ? (
            // Diff View
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 border-r border-border flex flex-col overflow-hidden">
                <div className="px-3 py-2 border-b border-border bg-destructive/5 shrink-0">
                  <Badge variant="outline" className="text-xs font-mono text-muted-foreground">
                    v{compareVersion.version} (previous)
                  </Badge>
                </div>
                <ScrollArea className="flex-1 min-h-0 p-4 font-mono text-xs leading-relaxed">
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
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-3 py-2 border-b border-border bg-chart-2/5 shrink-0">
                  <Badge variant="outline" className="text-xs font-mono text-muted-foreground">
                    v{selectedVersion?.version} (current)
                  </Badge>
                </div>
                <ScrollArea className="flex-1 min-h-0 p-4 font-mono text-xs leading-relaxed">
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
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-3 py-2 border-b border-border flex items-center justify-between shrink-0">
                <Badge variant="outline" className="text-xs font-mono text-muted-foreground">
                  v{selectedVersion?.version ?? "?"}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {editedContent.length} chars · {editedContent.split('\n').length} lines
                </span>
              </div>
              <Textarea
                value={editedContent}
                onChange={(e) => handleContentChange(e.target.value)}
                className="flex-1 min-h-0 w-full p-4 bg-transparent resize-none font-mono text-xs leading-relaxed focus-visible:ring-0 border-0 rounded-none"
                spellCheck={false}
                placeholder="Enter your prompt content..."
              />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Status */}
      <div className="border-t border-border px-4 py-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <div className="flex items-center gap-4">
          {selectedVersion && (
            <>
              <span>Created {formatDate(selectedVersion.createdAt)}</span>
              {selectedVersion.parentId && (
                <span>Based on v{(versions?.find(v => v.id === selectedVersion.parentId)?.version) ?? "?"}</span>
              )}
            </>
          )}
        </div>
        {selectedVersion?.totalRuns && selectedVersion.totalRuns > 0 && (
          <div className="flex items-center gap-4">
            <span>Tested on {selectedVersion.totalRuns.toLocaleString()} runs</span>
            {selectedVersion.avgAccuracy != null && (
              <Badge variant="secondary" className="text-chart-2 text-[10px]">
                {selectedVersion.avgAccuracy.toFixed(1)}% accuracy
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* New Prompt Dialog */}
      <Dialog open={showNewPromptDialog} onOpenChange={setShowNewPromptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Prompt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Name</label>
              <Input
                value={newPromptName}
                onChange={(e) => setNewPromptName(e.target.value)}
                placeholder="e.g., Customer Support Agent"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                Initial Content (optional)
              </label>
              <Textarea
                value={newPromptContent}
                onChange={(e) => setNewPromptContent(e.target.value)}
                placeholder="You are a helpful assistant..."
                rows={6}
                className="font-mono text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewPromptDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreatePrompt}
              disabled={!newPromptName.trim() || createPrompt.isPending}
            >
              {createPrompt.isPending ? "Creating..." : "Create Prompt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
