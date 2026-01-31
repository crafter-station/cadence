import type { Metadata } from "next"
import { EvaluationCreator } from "@/components/evaluation-creator"

export const metadata: Metadata = {
  title: "New Evaluation | Cadence",
  description: "Create a new prompt optimization evaluation",
}

export default function NewEvaluationPage() {
  return (
    <div className="h-[calc(100vh-57px)]">
      <EvaluationCreator />
    </div>
  )
}
