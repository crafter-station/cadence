"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Play,
  FileText,
  History,
  FlaskConical,
  GitBranch,
  Terminal,
  LayoutDashboard,
  Users,
} from "lucide-react"

const MODULES = [
  { id: "evaluation", href: "/", label: "Evaluation", icon: Play },
  { id: "prompts", href: "/prompts", label: "Prompts", icon: FileText },
  { id: "personas", href: "/personas", label: "Personas", icon: Users },
  { id: "scenarios", href: "/scenarios", label: "Scenarios", icon: FlaskConical },
  { id: "ab-testing", href: "/ab-testing", label: "A/B Testing", icon: GitBranch },
  { id: "history", href: "/history", label: "History", icon: History },
  { id: "debug", href: "/debug", label: "Debug", icon: Terminal },
]

export function DashboardNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <div className="border-b border-border bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-chart-1" />
              <span className="font-semibold tracking-tight">Cadence</span>
            </Link>

            <nav className="flex items-center">
              {MODULES.map((module) => {
                const Icon = module.icon
                return (
                  <Link
                    key={module.id}
                    href={module.href}
                    className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                      isActive(module.href)
                        ? "text-foreground bg-secondary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {module.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>v1.5.0</span>
          </div>
        </div>
      </div>
    </div>
  )
}
