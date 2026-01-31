import type { Metadata } from "next"
import { ComingSoon } from "@/components/coming-soon"

export const metadata: Metadata = {
  title: "History | Cadence",
  description: "View past test runs and results",
}

export default function HistoryPage() {
  return (
    <div className="h-[calc(100vh-57px)]">
      <ComingSoon
        title="History"
        description="View detailed history of all your past test runs, compare results, and track performance trends."
      />
    </div>
  )
}
