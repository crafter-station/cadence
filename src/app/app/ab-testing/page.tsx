import type { Metadata } from "next"
import { ComingSoon } from "@/components/coming-soon"

export const metadata: Metadata = {
  title: "A/B Testing | Cadence",
  description: "Run A/B tests on your AI agent prompts",
}

export default function ABTestingPage() {
  return (
    <div className="h-[calc(100vh-57px)]">
      <ComingSoon
        title="A/B Testing"
        description="Run controlled A/B experiments to compare prompt variants and measure their impact on key metrics."
      />
    </div>
  )
}
