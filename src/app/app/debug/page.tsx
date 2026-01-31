import type { Metadata } from "next"
import { ComingSoon } from "@/components/coming-soon"

export const metadata: Metadata = {
  title: "Debug | Cadence",
  description: "Debug console for troubleshooting",
}

export default function DebugPage() {
  return (
    <div className="h-[calc(100vh-57px)]">
      <ComingSoon
        title="Debug Console"
        description="Advanced debugging tools for troubleshooting conversations, viewing logs, and analyzing agent behavior."
      />
    </div>
  )
}
