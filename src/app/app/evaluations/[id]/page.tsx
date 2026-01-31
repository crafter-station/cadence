import type { Metadata } from "next"
import { EvaluationDetail } from "@/components/evaluation-detail"

export const metadata: Metadata = {
  title: "Evaluation Details | Cadence",
  description: "View evaluation progress and results",
}

export default async function EvaluationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="h-[calc(100vh-57px)]">
      <EvaluationDetail evaluationId={id} />
    </div>
  )
}
