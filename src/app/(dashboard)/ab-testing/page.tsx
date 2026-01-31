import type { Metadata } from "next"
import { ABTestingDashboard } from "@/components/ab-testing-dashboard"

export const metadata: Metadata = {
  title: "A/B Testing | Cadence",
  description: "Run A/B tests on your AI agent prompts",
}

export default function ABTestingPage() {
  return (
    <div className="h-[calc(100vh-57px)]">
      <ABTestingDashboard />
    </div>
  )
}
