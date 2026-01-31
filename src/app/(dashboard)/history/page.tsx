import type { Metadata } from "next"
import { TestHistory } from "@/components/test-history"

export const metadata: Metadata = {
  title: "History | Cadence",
  description: "View past test runs and results",
}

export default function HistoryPage() {
  return (
    <div className="h-[calc(100vh-57px)]">
      <TestHistory />
    </div>
  )
}
