import type { Metadata } from "next"
import { DebugConsole } from "@/components/debug-console"

export const metadata: Metadata = {
  title: "Debug | Cadence",
  description: "Debug console for troubleshooting",
}

export default function DebugPage() {
  return (
    <div className="h-[calc(100vh-57px)]">
      <DebugConsole />
    </div>
  )
}
