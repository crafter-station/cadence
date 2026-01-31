"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface EpochData {
  epochNumber: number
  accuracy: number | null
  conversionRate: number | null
  avgLatency: number | null
  isAccepted: boolean
}

interface EvaluationMetricsChartProps {
  epochs: EpochData[]
}

export function EvaluationMetricsChart({ epochs }: EvaluationMetricsChartProps) {
  if (epochs.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>No data to display yet.</p>
        <p className="text-sm mt-1">
          Metrics will appear here as epochs complete.
        </p>
      </div>
    )
  }

  const completedEpochs = epochs.filter(
    (e) => e.accuracy != null || e.conversionRate != null
  )

  if (completedEpochs.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>No completed epochs yet.</p>
      </div>
    )
  }

  const maxAccuracy = Math.max(...completedEpochs.map((e) => e.accuracy ?? 0))
  const maxConversion = Math.max(
    ...completedEpochs.map((e) => e.conversionRate ?? 0)
  )
  const maxLatency = Math.max(...completedEpochs.map((e) => e.avgLatency ?? 0))

  const normalizeValue = (value: number | null, max: number) => {
    if (value == null || max === 0) return 0
    return (value / max) * 100
  }

  return (
    <div className="space-y-6">
      {/* Accuracy Chart */}
      <Card>
        <CardHeader className="px-4 py-3 border-b border-border flex flex-row items-center justify-between space-y-0">
          <h3 className="text-sm font-medium">Accuracy Over Epochs</h3>
          <Badge variant="outline" className="text-xs font-mono">
            Max: {maxAccuracy.toFixed(1)}%
          </Badge>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-48 flex items-end gap-2">
            {completedEpochs.map((epoch) => (
              <div
                key={epoch.epochNumber}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <span className="text-xs text-muted-foreground">
                  {epoch.accuracy?.toFixed(0) ?? "—"}%
                </span>
                <div
                  className={`w-full rounded-t transition-all ${
                    epoch.isAccepted ? "bg-chart-2" : "bg-chart-1"
                  }`}
                  style={{
                    height: `${normalizeValue(epoch.accuracy, maxAccuracy)}%`,
                    minHeight: "4px",
                  }}
                />
                <span className="text-xs text-muted-foreground">
                  E{epoch.epochNumber}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conversion Chart */}
      <Card>
        <CardHeader className="px-4 py-3 border-b border-border flex flex-row items-center justify-between space-y-0">
          <h3 className="text-sm font-medium">Conversion Rate Over Epochs</h3>
          <Badge variant="outline" className="text-xs font-mono">
            Max: {maxConversion.toFixed(1)}%
          </Badge>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-48 flex items-end gap-2">
            {completedEpochs.map((epoch) => (
              <div
                key={epoch.epochNumber}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <span className="text-xs text-muted-foreground">
                  {epoch.conversionRate?.toFixed(0) ?? "—"}%
                </span>
                <div
                  className={`w-full rounded-t transition-all ${
                    epoch.isAccepted ? "bg-chart-2" : "bg-chart-4"
                  }`}
                  style={{
                    height: `${normalizeValue(epoch.conversionRate, maxConversion)}%`,
                    minHeight: "4px",
                  }}
                />
                <span className="text-xs text-muted-foreground">
                  E{epoch.epochNumber}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Latency Chart (inverted - lower is better) */}
      <Card>
        <CardHeader className="px-4 py-3 border-b border-border flex flex-row items-center justify-between space-y-0">
          <h3 className="text-sm font-medium">Average Latency Over Epochs</h3>
          <Badge variant="outline" className="text-xs font-mono">
            Min: {Math.min(...completedEpochs.map((e) => e.avgLatency ?? Infinity)).toFixed(0)}ms
          </Badge>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-48 flex items-end gap-2">
            {completedEpochs.map((epoch) => (
              <div
                key={epoch.epochNumber}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <span className="text-xs text-muted-foreground">
                  {epoch.avgLatency?.toFixed(0) ?? "—"}ms
                </span>
                <div
                  className="w-full bg-chart-5 rounded-t transition-all"
                  style={{
                    height: `${normalizeValue(epoch.avgLatency, maxLatency)}%`,
                    minHeight: "4px",
                  }}
                />
                <span className="text-xs text-muted-foreground">
                  E{epoch.epochNumber}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Table */}
      <Card>
        <CardHeader className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-medium">Epoch Summary</h3>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-secondary/30">
              <tr>
                <th className="px-4 py-2 text-xs font-medium text-left">Epoch</th>
                <th className="px-4 py-2 text-xs font-medium text-right">
                  Accuracy
                </th>
                <th className="px-4 py-2 text-xs font-medium text-right">
                  Conversion
                </th>
                <th className="px-4 py-2 text-xs font-medium text-right">
                  Latency
                </th>
                <th className="px-4 py-2 text-xs font-medium text-center">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {completedEpochs.map((epoch) => (
                <tr key={epoch.epochNumber}>
                  <td className="px-4 py-2 text-sm font-mono">
                    {epoch.epochNumber}
                  </td>
                  <td className="px-4 py-2 text-sm text-right">
                    {epoch.accuracy?.toFixed(1) ?? "—"}%
                  </td>
                  <td className="px-4 py-2 text-sm text-right">
                    {epoch.conversionRate?.toFixed(1) ?? "—"}%
                  </td>
                  <td className="px-4 py-2 text-sm text-right">
                    {epoch.avgLatency?.toFixed(0) ?? "—"}ms
                  </td>
                  <td className="px-4 py-2 text-center">
                    {epoch.isAccepted ? (
                      <Badge className="bg-chart-2/10 text-chart-2 border-0 text-xs">
                        Accepted
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Rejected
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
