import type { Metadata } from "next"
import { ScenarioBuilder } from "@/components/scenario-builder"

export const metadata: Metadata = {
  title: "Scenarios | Cadence",
  description: "Build and manage test scenarios for your AI agent",
}

export default function ScenariosPage() {
  return (
    <div className="h-[calc(100vh-57px)]">
      <ScenarioBuilder />
    </div>
  )
}
