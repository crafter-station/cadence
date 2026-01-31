import type { Metadata } from "next"
import { PromptEditor } from "@/components/prompt-editor"

export const metadata: Metadata = {
  title: "Prompts | Cadence",
  description: "Manage and version your AI agent prompts",
}

export default function PromptsPage() {
  return (
    <div className="h-[calc(100vh-57px)]">
      <PromptEditor />
    </div>
  )
}
