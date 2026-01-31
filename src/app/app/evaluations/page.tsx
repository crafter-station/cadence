import type { Metadata } from "next"
import { EvaluationDashboard } from "@/components/evaluation-dashboard"

export const metadata: Metadata = {
  title: "Evaluations | Cadence",
  description: "Epoch-based prompt optimization campaigns",
}

export default function EvaluationsPage() {
  return (
    <div className="h-[calc(100vh-57px)]">
      <EvaluationDashboard />
    </div>
  )
}
