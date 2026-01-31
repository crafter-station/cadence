"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, X, Save, Users } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Personality } from "@/app/page"

interface PersonalityManagerProps {
  personalities: Personality[]
  onAdd: (personality: Omit<Personality, "id">) => void
  onEdit: (id: string, personality: Partial<Personality>) => void
  onDelete: (id: string) => void
  disabled?: boolean
}

const COLORS = [
  { value: "chart-1", label: "Blue", preview: "oklch(0.65 0.15 250)" },
  { value: "chart-2", label: "Green", preview: "oklch(0.7 0.18 150)" },
  { value: "chart-3", label: "Orange", preview: "oklch(0.65 0.2 30)" },
  { value: "chart-4", label: "Pink", preview: "oklch(0.7 0.15 330)" },
  { value: "chart-5", label: "Yellow", preview: "oklch(0.75 0.12 80)" },
]

interface PersonalityFormData {
  name: string
  description: string
  traits: string[]
  color: string
  systemPrompt?: string
}

const DEFAULT_FORM_DATA: PersonalityFormData = {
  name: "",
  description: "",
  traits: [],
  color: "chart-1",
  systemPrompt: "",
}

export function PersonalityManager({
  personalities,
  onAdd,
  onEdit,
  onDelete,
  disabled = false,
}: PersonalityManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<PersonalityFormData>(DEFAULT_FORM_DATA)
  const [newTrait, setNewTrait] = useState("")

  const openAddDialog = () => {
    setEditingId(null)
    setFormData(DEFAULT_FORM_DATA)
    setIsDialogOpen(true)
  }

  const openEditDialog = (personality: Personality) => {
    setEditingId(personality.id)
    setFormData({
      name: personality.name,
      description: personality.description,
      traits: [...personality.traits],
      color: personality.color,
    })
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.name.trim() || !formData.description.trim()) return

    if (editingId) {
      onEdit(editingId, formData)
    } else {
      onAdd(formData)
    }
    setIsDialogOpen(false)
    setFormData(DEFAULT_FORM_DATA)
    setEditingId(null)
  }

  const addTrait = () => {
    if (newTrait.trim() && !formData.traits.includes(newTrait.trim())) {
      setFormData((prev) => ({
        ...prev,
        traits: [...prev.traits, newTrait.trim()],
      }))
      setNewTrait("")
    }
  }

  const removeTrait = (trait: string) => {
    setFormData((prev) => ({
      ...prev,
      traits: prev.traits.filter((t) => t !== trait),
    }))
  }

  const getColorPreview = (colorValue: string) => {
    return COLORS.find((c) => c.value === colorValue)?.preview || COLORS[0].preview
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-border space-y-0">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Manage Personalities</span>
            <Badge variant="secondary" className="text-xs">
              {personalities.length} total
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={openAddDialog}
            disabled={disabled}
            className="text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add New
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {personalities.map((personality) => (
              <div
                key={personality.id}
                className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className="h-3 w-3 mt-1 rounded-sm shrink-0"
                    style={{ backgroundColor: getColorPreview(personality.color) }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{personality.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {personality.description}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {personality.traits.slice(0, 3).map((trait) => (
                        <Badge key={trait} variant="secondary" className="text-[10px] font-normal">
                          {trait}
                        </Badge>
                      ))}
                      {personality.traits.length > 3 && (
                        <Badge variant="secondary" className="text-[10px] font-normal">
                          +{personality.traits.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openEditDialog(personality)}
                    disabled={disabled}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => onDelete(personality.id)}
                    disabled={disabled}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}

            {personalities.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No personalities yet. Add your first test personality to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Personality" : "Add New Personality"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g., Frustrated Customer"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe how this persona behaves..."
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Select
                value={formData.color}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, color: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLORS.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-sm"
                          style={{ backgroundColor: color.preview }}
                        />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Behavioral Traits</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a trait..."
                  value={newTrait}
                  onChange={(e) => setNewTrait(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addTrait()
                    }
                  }}
                />
                <Button type="button" variant="outline" size="icon" onClick={addTrait}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                {formData.traits.map((trait) => (
                  <Badge
                    key={trait}
                    variant="secondary"
                    className="text-xs gap-1 pr-1"
                  >
                    {trait}
                    <button
                      type="button"
                      onClick={() => removeTrait(trait)}
                      className="ml-0.5 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="systemPrompt">System Prompt (Optional)</Label>
              <Textarea
                id="systemPrompt"
                placeholder="Custom instructions for how the AI should roleplay this personality..."
                value={formData.systemPrompt || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, systemPrompt: e.target.value }))}
                rows={4}
                className="font-mono text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.name.trim() || !formData.description.trim()}>
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {editingId ? "Save Changes" : "Add Personality"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
