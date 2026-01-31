"use client"

import { Clock } from "lucide-react"

interface ComingSoonProps {
  title: string
  description?: string
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="h-full flex items-center justify-center bg-background">
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
          <Clock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-semibold mb-2">{title}</h1>
        <p className="text-muted-foreground mb-6">
          {description || "This feature is coming soon. Stay tuned for updates!"}
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-sm text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-chart-2 animate-pulse" />
          In Development
        </div>
      </div>
    </div>
  )
}
