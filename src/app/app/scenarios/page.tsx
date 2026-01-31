import type { Metadata } from "next"
import { ComingSoon } from "@/components/coming-soon"

export const metadata: Metadata = {
  title: "Scenarios | Cadence",
  description: "Build and manage test scenarios for your AI agent",
}

export default function ScenariosPage() {
  return (
    <div className="h-[calc(100vh-57px)]">
      <ComingSoon
        title="Scenarios"
        description="Create and manage test scenarios with custom conversation flows and edge cases."
      />
    </div>
  )
}
