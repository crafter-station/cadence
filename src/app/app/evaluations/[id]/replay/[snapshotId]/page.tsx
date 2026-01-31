import type { Metadata } from "next"
import { SimulationReplayViewer } from "@/components/simulation-replay-viewer"

export const metadata: Metadata = {
  title: "Simulation Replay | Cadence",
  description: "Review a simulation snapshot",
}

export default async function ReplayPage({
  params,
}: {
  params: Promise<{ id: string; snapshotId: string }>
}) {
  const { id, snapshotId } = await params

  return (
    <div className="h-[calc(100vh-57px)]">
      <SimulationReplayViewer evaluationId={id} snapshotId={snapshotId} />
    </div>
  )
}
